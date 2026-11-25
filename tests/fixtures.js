// Saved feed responses for tests, and a helper that serves them to the page.
const fs = require("fs");
const path = require("path");

const { fixtureKey, DIR } = require("./fixtures-key");
const meta = JSON.parse(fs.readFileSync(path.join(DIR, "meta.json"), "utf8"));
// The moment the fixtures were recorded. Tests freeze the page's clock here,
// so Fresh/Stale/Offline results do not depend on when the tests run.
const NOW = new Date(meta.recorded);
// Other Areas of responsibility were recorded at their own moments (meta.json "moments").
const MOMENTS = Object.fromEntries(Object.entries(meta.moments || {}).map(([k, v]) => [k, new Date(v)]));

const isJSON = key => key.endsWith(".json");
const read = key => { const t = fs.readFileSync(path.join(DIR, key), "utf8"); return isJSON(key) ? JSON.parse(t) : t; };

// CDIP's 3-day file was recorded once and serves every test area. Readings not yet published
// at the frozen clock are blanked, so each area sees the file as CDIP served it at that moment.
// A reading is stamped with its sample's start; the half-hour sample is published after it ends.
function cdipAsOf(text, now) {
  const times = (text.match(/\nwaveTime\[\d+\]\n([^\n]+)/) || [])[1];
  if (!times) return text;
  const late = new Set(times.split(",").map((v, i) => [Number(v) * 1000, i]).filter(([t]) => t + 30 * 60000 > now.getTime()).map(([, i]) => i));
  return text.replace(/\nwaveHs\[\d+\]\[\d+\]\n([\s\S]*?)\n\n/, (all, rows) => all.replace(rows,
    rows.split("\n").map(r => { const m = r.match(/^\[(\d+)\], /); return m && late.has(+m[1]) ? r.replace(/, [^,]+/g, ", -999.99") : r; }).join("\n")));
}
// A 1x1 grey PNG stands in for background map tiles.
const TILE = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN89+7dfwAJeAPmhWsfjQAAAABJRU5ErkJggg==", "base64");

/**
 * Serve saved responses to the page and freeze its clock.
 * edit(key, json) may return a changed copy to create a rare case on purpose
 * (text fixtures, such as CDIP's, are passed and returned as text).
 * tiles: "ok" (grey tiles) or "fail" (every tile request fails).
 */
async function useFixtures(page, { edit = null, tiles = "ok", moment = null } = {}) {
  const now = moment ? MOMENTS[moment] : NOW;
  await page.clock.setFixedTime(now);
  await page.route(url => !/^http:\/\/localhost:8787\//.test(url.href) || url.pathname.endsWith("/data/waves.json"), async route => {
    const url = route.request().url();
    if (url.includes("basemap.nationalmap.gov")) {
      return tiles === "fail" ? route.abort() : route.fulfill({ status: 200, contentType: "image/png", body: TILE });
    }
    const key = fixtureKey(url);
    if (!key || !fs.existsSync(path.join(DIR, key))) return route.abort();
    let body = read(key);
    if (key === "cdip-latest_3day.txt") body = cdipAsOf(body, now);
    // The collected wave file serves every test area too: a station whose Reading is later than the frozen clock is left out.
    if (key === "waves.json") for (const [k, w] of Object.entries(body.stations))
      if (w.reading && Date.parse(w.reading.time) > now.getTime()) delete body.stations[k];
    if (edit) body = edit(key, isJSON(key) ? JSON.parse(JSON.stringify(body)) : body) || body;
    return route.fulfill({ status: 200, contentType: isJSON(key) ? "application/json" : "text/plain",
      headers: { "access-control-allow-origin": "*" }, body: isJSON(key) ? JSON.stringify(body) : body });
  });
}

// Helpers for building rare cases
const minutesAgo = m => new Date(NOW.getTime() - m * 60000);
const coopsStamp = d => d.toISOString().slice(0, 16).replace("T", " ");

module.exports = { useFixtures, fixtureKey, NOW, read, minutesAgo, coopsStamp, DIR };
