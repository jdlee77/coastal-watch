// Records the live feed responses the page makes into tests/fixtures.
// Run this only when you want new saved data (for example after adding a Station):
//   1. serve the built site (index.html, data/areas, data/sensors.csv, data/waves.json) on http://localhost:8765
//   2. npm run record-fixtures
// To record another Area of responsibility without touching the Oregon files, set
//   HASH="#board&area=W,S,E,N&name=..." KEEP_EXISTING=1 MOMENT=<name>
// Its recording time is then saved in meta.json under moments.<name>, for tests to freeze the clock there.
// waves.json is not recorded here: it is what scripts/fetch_waves.py publishes. The fixture is built by running
// collect() on tests/fixtures/ndbc-latest_obs.txt, with Oregon's four NDBC buoys passed in as the previous
// file so they keep the Readings recorded at Oregon's moment (see the "note" in waves.json).
// Tide predictions are trimmed to the hours the page uses, to keep the files small.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { fixtureKey, DIR } = require("./fixtures-key");

(async () => {
  const site = process.env.SITE || "http://localhost:8765/";
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
  const browser = await chromium.launch({ proxy });
  const page = await browser.newPage();
  const now = new Date();
  const saved = [];
  page.on("response", async res => {
    const key = fixtureKey(res.url());
    if (!key || !res.ok()) return;
    if (process.env.KEEP_EXISTING && fs.existsSync(path.join(DIR, key))) return;
    try {
      if (!key.endsWith(".json")) { // CDIP text and XML, saved as served
        fs.writeFileSync(path.join(DIR, key), await res.text());
        saved.push(key);
        return;
      }
      let json = await res.json();
      if (json.predictions && key.includes("-6-")) {
        const lo = now.getTime() - 3 * 3600e3, hi = now.getTime() + 30 * 3600e3;
        json.predictions = json.predictions.filter(p => { const t = Date.parse(p.t.replace(" ", "T") + "Z"); return t >= lo && t <= hi; });
      }
      // The national station list: keep only the fields the page reads.
      if (key.startsWith("mdapi-stations-")) {
        const keep = ["id", "name", "lat", "lng", "state", "tidal", "greatlakes", "shefcode", "timezone", "timezonecorr", "observedst"];
        json = { count: json.count, stations: json.stations.map(s => Object.fromEntries(keep.map(k => [k, s[k]]))) };
      }
      // NWS gauges: keep only the fields the page reads (a full gauge record is up to 50 KB).
      if (key.startsWith("nwps-gauges-")) {
        json = { gauges: json.gauges.map(g => ({ lid: g.lid, name: g.name, wfo: g.wfo, latitude: g.latitude, longitude: g.longitude, pedts: g.pedts })) };
      } else if (/^nwps-\w+\.json$/.test(key)) {
        json = { lid: json.lid, name: json.name, wfo: json.wfo, flood: { categories: json.flood && json.flood.categories }, status: json.status };
      }
      fs.writeFileSync(path.join(DIR, key), JSON.stringify(json));
      saved.push(key);
    } catch (e) { console.error("skip", key, e.message); }
  });
  await page.goto(site + (process.env.HASH || "#board"));
  await page.waitForFunction(() => document.getElementById("updated").textContent.startsWith("Refreshed"), null, { timeout: 120000 });
  await page.waitForTimeout(1000);
  const metaFile = path.join(DIR, "meta.json");
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : {};
  if (process.env.MOMENT) meta.moments = { ...meta.moments, [process.env.MOMENT]: now.toISOString() };
  else Object.assign(meta, { recorded: now.toISOString(), note: "Live responses recorded for tests" });
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1) + "\n");
  console.log(`saved ${saved.length} responses at ${now.toISOString()}`);
  await browser.close();
})();
