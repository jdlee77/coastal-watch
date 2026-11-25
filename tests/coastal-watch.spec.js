// Coastal Watch behaviour, checked the way a person would see it.
// Every outside request is answered from tests/fixtures (recorded 25 Nov 2026, 12:26 PT,
// during king-tide flooding), and the page clock is frozen at that moment.
const { test, expect } = require("@playwright/test");
const { useFixtures, minutesAgo, coopsStamp } = require("./fixtures");

const WALL = { width: 1920, height: 1080 };
const DESK = { width: 1400, height: 1000 };
const PHONE = { width: 390, height: 844 };
const AREAS = ["Columbia River mouth", "Tillamook Bay", "Nestucca / Lincoln City", "Newport", "Florence",
  "Reedsport", "Coos Bay / Coquille", "Port Orford / Gold Beach"];

async function open(page, hash = "", opts = {}) {
  await useFixtures(page, opts);
  await page.goto("/" + hash);
  await expect(page.locator("#updated")).toContainText("Refreshed");
}
const marker = (page, key) => page.locator(`.cw-marker[data-station="${key}"]`);
const area = (page, name) => page.locator(`#boardPane .area[data-area="${name}"]`);
const layoutOf = page => page.evaluate(() => ["board", "map", "split"].find(l => document.body.classList.contains("layout-" + l)));

// Rare cases, made on purpose by editing saved responses
const riverAt = (lid, stage) => (key, j) => { if (key === `nwps-${lid}.json`) j.status.observed.primary = stage; return j; };
const tideAt = (station, value) => (key, j) => { if (key === `coops-water_level-${station}.json`) j.data[0].v = String(value); return j; };
const tideAge = (station, minutes) => (key, j) => { if (key === `coops-water_level-${station}.json`) j.data[0].t = coopsStamp(minutesAgo(minutes)); return j; };
const riverAge = (lid, minutes) => (key, j) => { if (key === `nwps-${lid}.json`) j.status.observed.validTime = minutesAgo(minutes).toISOString(); return j; };
const buoyAge = (id, minutes) => (key, j) => { if (key === "waves.json") j.stations[id].reading.time = minutesAgo(minutes).toISOString(); return j; };
const all = (...fs) => (key, j) => fs.reduce((acc, f) => f(key, acc) || acc, j);

test.describe("Choosing a Layout", () => {
  test("a desk screen opens on the Board", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page);
    expect(await layoutOf(page)).toBe("board");
    await expect(page.locator("#mapPane")).toBeHidden();
    await expect(page).toHaveURL(/#board$/);
  });

  test("a wall-width screen opens in Split", async ({ page }) => {
    await page.setViewportSize(WALL);
    await open(page);
    expect(await layoutOf(page)).toBe("split");
    await expect(page.locator("#map")).toBeVisible();
    await expect(page.locator("#boardPane")).toBeVisible();
  });

  test("a phone opens on the Board, with one button to switch to the Map and no Split button", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await open(page);
    expect(await layoutOf(page)).toBe("board");
    await expect(page.getByRole("button", { name: "Split" })).toBeHidden();
    await page.locator("#layoutToggle").click();
    expect(await layoutOf(page)).toBe("map");
    await expect(page.locator("#layoutToggle")).toHaveText("Board");
  });

  test("the address pins the Layout", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    expect(await layoutOf(page)).toBe("map");
    await expect(page.locator("#boardPane")).toBeHidden();
  });

  test("the last choice is remembered on the device", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page);
    await page.getByRole("button", { name: "Map", exact: true }).click();
    await expect(page).toHaveURL(/#map$/);
    await page.goto("/");
    await expect(page.locator("#updated")).toContainText("Refreshed");
    expect(await layoutOf(page)).toBe("map");
  });

  test("a pinned address wins over the remembered choice", async ({ page }) => {
    await page.setViewportSize(WALL);
    await open(page);
    await page.getByRole("button", { name: "Board" }).click();
    await page.goto("/#split");
    await expect(page.locator("#updated")).toContainText("Refreshed");
    expect(await layoutOf(page)).toBe("split");
  });

  test("Split asked for on a phone shows the Board with a note", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await open(page, "#split");
    expect(await layoutOf(page)).toBe("board");
    await expect(page.locator("#note")).toContainText("Split needs a screen at least 1,000 pixels wide");
  });
});

test.describe("Text size", () => {
  test("can be pinned in the address", async ({ page }) => {
    await page.setViewportSize(WALL);
    await open(page, "#split&text=xl");
    await expect(page.locator("html")).toHaveClass(/text-xl/);
    await expect(page.locator("#textsize")).toHaveValue("xl");
  });

  test("the control changes the size, updates the address and is remembered", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page);
    const before = await page.locator(".area h2").first().evaluate(e => e.getBoundingClientRect().height);
    await page.locator("#textsize").selectOption("l");
    await expect(page).toHaveURL(/#board&text=l$/);
    const after = await page.locator(".area h2").first().evaluate(e => e.getBoundingClientRect().height);
    expect(after).toBeGreaterThan(before);
    await page.goto("/");
    await expect(page.locator("#updated")).toContainText("Refreshed");
    await expect(page.locator("html")).toHaveClass(/text-l/);
  });

  test("Map markers grow with the text size", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    const w1 = await marker(page, "CO-OPS:9439040").evaluate(e => e.getBoundingClientRect().width);
    await page.locator("#textsize").selectOption("xl");
    const w2 = await marker(page, "CO-OPS:9439040").evaluate(e => e.getBoundingClientRect().width);
    expect(w2).toBeGreaterThan(w1 * 1.3);
  });
});

test.describe("The Map", () => {
  test("shows every Station once, and none that is not in the station list", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    await expect(page.locator(".cw-marker")).toHaveCount(24);
    await expect(marker(page, "CDIP:277")).toHaveCount(0);
    // Garibaldi serves a neighbouring area on the Board but appears once on the Map
    await expect(marker(page, "CO-OPS:9437540")).toHaveCount(1);
  });

  test("marker shape follows the kind of Station", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    await expect(marker(page, "CO-OPS:9439040").locator("circle").last()).toBeAttached();
    await expect(marker(page, "USGS:14301500")).toHaveAttribute("data-kind", "river_gage");
    await expect(marker(page, "USGS:14301500").locator("polygon")).toHaveAttribute("points", /^\S+ \S+ \S+$/); // triangle
    await expect(marker(page, "NDBC:46050").locator("polygon")).toHaveAttribute("points", /^\S+ \S+ \S+ \S+$/); // diamond
  });

  test("marker color follows the Threshold level, the same as the Board", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map", { edit: riverAt("TLMO3", 20) }); // Wilson River above major (19 ft)
    await expect(marker(page, "USGS:14301500")).toHaveAttribute("data-state", "major");
    await expect(marker(page, "USGS:14301500")).toHaveAttribute("aria-label", /major/);
    await expect(marker(page, "CO-OPS:9437540")).toHaveAttribute("data-state", "nothr"); // Garibaldi: no Threshold
    await expect(marker(page, "NDBC:46050")).toHaveAttribute("data-state", "nothr");    // waves: no Threshold
  });

  test("sources differ is marked on the Map", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map", { edit: tideAt("9439040", 11.0) }); // NOAA minor 10.6, NWS minor 12
    await expect(marker(page, "CO-OPS:9439040")).toHaveAttribute("data-differ", "true");
    await expect(marker(page, "CO-OPS:9439040")).toHaveAttribute("aria-label", /sources differ/);
  });

  test("a Stale buoy has a dashed outline and an Offline Station is grey", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map", { edit: all(buoyAge("NDBC:46029", 180), tideAge("9431647", 30 * 60)) });
    await expect(marker(page, "NDBC:46029")).toHaveAttribute("data-fresh", "stale");
    await expect(marker(page, "NDBC:46029").locator("g")).toHaveAttribute("stroke-dasharray", /\d/);
    await expect(marker(page, "CO-OPS:9431647")).toHaveAttribute("data-state", "offline");
    await expect(marker(page, "CO-OPS:9431647")).toHaveAttribute("aria-label", /offline/);
  });

  test("labels every Coastal area and has a key", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    for (const a of AREAS) await expect(page.locator(".cw-area-label", { hasText: a })).toBeVisible();
    await expect(page.locator(".maplegend")).toContainText("sources differ");
  });

  test("the whole coast is in view when the Map opens", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    const box = await page.locator("#map").boundingBox();
    for (const el of await page.locator(".cw-marker").all()) {
      const b = await el.boundingBox();
      expect(b.y).toBeGreaterThanOrEqual(box.y - 1);
      expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height + 1);
    }
  });

  test("markers that sit close together stay individually clickable", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    const boxes = [];
    for (const el of await page.locator(".cw-marker").all()) boxes.push(await el.boundingBox());
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      expect(d, `markers ${i} and ${j} overlap`).toBeGreaterThan(a.width * 0.9);
    }
  });

  test("still shows Station markers when the background map cannot load", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map", { tiles: "fail" });
    await expect(page.locator(".cw-marker")).toHaveCount(24);
    await expect(page.locator("#mapnote")).toContainText("Background map unavailable");
  });

  test("a marker popup shows the Reading, both sources, its age, and Open on Board", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    await marker(page, "CO-OPS:9439040").click();
    const pop = page.locator(".leaflet-popup");
    await expect(pop).toContainText("Astoria (Tongue Point)");
    await expect(pop).toContainText("ft");
    await expect(pop.locator(".chip.src.nws")).toBeVisible();
    await expect(pop.locator(".chip.src.nos")).toBeVisible();
    await expect(pop).toContainText("min ago");
    await expect(pop.getByRole("button", { name: "Open on Board" })).toBeVisible();
  });
});

test.describe("Links between the Map and the Board", () => {
  test("Open on Board switches to the Board and highlights the Station's card", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#map");
    await marker(page, "USGS:14327055").click(); // Coquille River at Coquille
    await page.locator(".leaflet-popup").getByRole("button", { name: "Open on Board" }).click();
    expect(await layoutOf(page)).toBe("board");
    const card = page.locator("#card-USGS-14327055");
    await expect(card).toHaveClass(/hl/);
    await expect(card).toBeInViewport();
  });

  test("Show on map switches to the Map, centers on the Station and pulses its marker", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page);
    await page.locator("#card-USGS-14327055").getByRole("button", { name: "Show on map" }).click();
    expect(await layoutOf(page)).toBe("map");
    await expect(marker(page, "USGS:14327055")).toHaveClass(/pulse/);
    const mapBox = await page.locator("#map").boundingBox();
    const m = await marker(page, "USGS:14327055").boundingBox();
    expect(Math.abs(m.x + m.width / 2 - (mapBox.x + mapBox.width / 2))).toBeLessThan(mapBox.width * 0.2);
  });

  test("in Split, a marker highlights its Coastal area in the Board half without leaving Split", async ({ page }) => {
    await page.setViewportSize(WALL);
    await open(page, "#split");
    await marker(page, "USGS:14307620").click(); // Siuslaw, Florence
    expect(await layoutOf(page)).toBe("split");
    await expect(area(page, "Florence")).toHaveClass(/hl/);
  });

  test("in Split, clicking a Coastal area on the Board pulses its markers without leaving Split", async ({ page }) => {
    await page.setViewportSize(WALL);
    await open(page, "#split");
    await area(page, "Tillamook Bay").locator("h2").click();
    expect(await layoutOf(page)).toBe("split");
    await expect(marker(page, "USGS:14301000")).toHaveClass(/pulse/);
    await expect(marker(page, "CO-OPS:9437540")).toHaveClass(/pulse/);
  });
});

test.describe("Split on the video wall", () => {
  test("shows the whole coast and all eight Coastal areas with no scrolling at 1920x1080", async ({ page }) => {
    await page.setViewportSize(WALL);
    await open(page, "#split");
    for (const a of AREAS) await expect(area(page, a)).toBeInViewport({ ratio: 1 });
    const pane = await page.locator("#boardPane").evaluate(e => [e.scrollHeight, e.clientHeight]);
    expect(pane[0]).toBeLessThanOrEqual(pane[1] + 1);
    const doc = await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]);
    expect(doc[0]).toBeLessThanOrEqual(doc[1] + 1);
  });

  test("the Board half is in Compact, worst Coastal area first", async ({ page }) => {
    await page.setViewportSize(WALL);
    await open(page, "#split", { edit: riverAt("TLMO3", 20) });
    await expect(page.locator("body")).toHaveClass(/compact/);
    await expect(page.locator("#boardPane .area").first()).toHaveAttribute("data-area", "Tillamook Bay");
  });
});

test.describe("The Board (unchanged rules)", () => {
  test("Area status takes the worst level of the area's own Stations", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board", { edit: riverAt("TLMO3", 20) });
    await expect(area(page, "Tillamook Bay").locator("h2 .chip").last()).toHaveText(/major/i);
  });

  test("an area with no current Readings shows no current data, never below flood", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board", { edit: riverAge("MPLO3", 30 * 60) }); // Florence's only own Station offline
    await expect(area(page, "Florence").locator("h2 .chip").last()).toHaveText(/no current data/i);
  });

  test("a tide gauge shows both Threshold sources and flags when they differ", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board", { edit: tideAt("9439040", 11.0) });
    const card = page.locator("#card-CO-OPS-9439040");
    await expect(card.locator(".chip.src.nws")).toBeVisible();
    await expect(card.locator(".chip.src.nos")).toBeVisible();
    await expect(card).toContainText("sources differ");
    await expect(card.locator(".val .chip")).toHaveText(/minor · NOAA/i);
  });

  test("Compact lists the worst area first", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board", { edit: riverAt("TLMO3", 20) });
    await page.getByRole("button", { name: "Compact" }).click();
    await expect(page.locator("#boardPane .area").first()).toHaveAttribute("data-area", "Tillamook Bay");
  });
});

test.describe("Oregon as an Area definition", () => {
  const officeOf = (lid, abbreviation, name) => (key, j) => { if (key === `nwps-${lid}.json`) j.wfo = { abbreviation, name }; return j; };

  test("the header names the Area of responsibility from its Area definition", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board");
    await expect(page.locator("header h1")).toContainText("Oregon coast");
  });

  test("every time shows its zone, in the area's local time", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board");
    const card = page.locator("#card-CO-OPS-9439040");
    await expect(card.locator(".time")).toHaveText(/^\d\d:\d\d PST \(/); // 25 Nov: standard time
    await expect(card).toContainText(/Next high tide \(predicted\): .* PST/);
    await expect(page.locator("#updated")).toContainText(/Refreshed \d\d:\d\d PST/);
  });

  test("the Threshold source explanation names the NWS offices of the Stations shown, and the areas each covers", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board");
    const offices = page.locator("#offices");
    await expect(offices).toContainText("NWS Portland: Columbia River mouth to Florence");
    await expect(offices).toContainText("NWS Medford: Reedsport to Port Orford / Gold Beach");
  });

  test("office coverage follows the Stations, not a fixed list", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board", { edit: officeOf("MPLO3", "MFR", "Medford") });
    const offices = page.locator("#offices");
    await expect(offices).toContainText("NWS Portland: Columbia River mouth to Newport");
    await expect(offices).toContainText("NWS Medford: Florence to Port Orford / Gold Beach");
  });
});

test.describe("An Area of responsibility from the link", () => {
  const TAMPA = "area=-82.9,27.5,-82.35,28.05";
  const TAMPA_GAUGES = ["Clearwater Beach", "East Bay", "Old Port Tampa", "St. Petersburg", "Port Manatee"]; // north to south
  const openArea = (page, hash, opts = {}) => open(page, hash, { moment: "tampa", ...opts });

  test("shows one Coastal area per tide gauge, named after it, north to south", async ({ page }) => {
    await page.setViewportSize(DESK);
    await openArea(page, `#board&${TAMPA}&name=Tampa%20Bay`);
    const names = await page.locator("#boardPane .area").evaluateAll(els => els.map(e => e.dataset.area));
    expect(names).toEqual(TAMPA_GAUGES);
    await expect(page.locator("#card-CO-OPS-8726520 .val")).toContainText("ft");
    for (const a of AREAS) await expect(area(page, a)).toHaveCount(0); // nothing from Oregon
  });

  test("the header shows the name from the link, or Custom area without one", async ({ page }) => {
    await page.setViewportSize(DESK);
    await openArea(page, `#board&${TAMPA}&name=Tampa%20Bay`);
    await expect(page.locator("header h1")).toContainText("Tampa Bay");
    await openArea(page, `#board&${TAMPA}`);
    await page.reload();
    await expect(page.locator("#updated")).toContainText("Refreshed");
    await expect(page.locator("header h1")).toContainText("Custom area");
  });

  test("times are in the area's own local time, with its zone", async ({ page }) => {
    await page.setViewportSize(DESK);
    await openArea(page, `#board&${TAMPA}`);
    await expect(page.locator("#card-CO-OPS-8726520 .time")).toHaveText(/^\d\d:\d\d EST \(/);
    await expect(page.locator("#offices")).toContainText("NWS Ruskin: Clearwater Beach to Port Manatee");
  });

  test("area, Layout and text size work together in one link, and the Map shows the whole area", async ({ page }) => {
    await page.setViewportSize(WALL);
    await openArea(page, `#split&text=xl&${TAMPA}&name=Tampa%20Bay`);
    expect(await layoutOf(page)).toBe("split");
    await expect(page.locator("html")).toHaveClass(/text-xl/);
    await expect(page).toHaveURL(/#split&text=xl&area=-82\.9,27\.5,-82\.35,28\.05&name=Tampa%20Bay$/);
    await expect(page.locator(".cw-marker")).toHaveCount(5);
    const box = await page.locator("#map").boundingBox();
    for (const el of await page.locator(".cw-marker").all()) {
      const b = await el.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(box.x - 1);
      expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }
  });

  test("changing the area in the link loads the new area", async ({ page }) => {
    await page.setViewportSize(DESK);
    await open(page, "#board");
    await expect(area(page, "Newport")).toHaveCount(1);
    await page.evaluate(h => { location.hash = h; }, `#board&${TAMPA}&name=Tampa%20Bay`);
    await expect(page.locator("header h1")).toContainText("Tampa Bay");
    await expect(page.locator("#boardPane .area")).toHaveCount(5);
  });
});
