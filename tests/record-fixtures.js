// Records the live feed responses the page makes into tests/fixtures.
// Run this only when you want new saved data (for example after adding a Station):
//   1. serve the built site (index.html, data/sensors.csv, data/waves.json) on http://localhost:8765
//   2. npm run record-fixtures
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
    try {
      let json = await res.json();
      if (json.predictions && key.includes("-6-")) {
        const lo = now.getTime() - 3 * 3600e3, hi = now.getTime() + 30 * 3600e3;
        json.predictions = json.predictions.filter(p => { const t = Date.parse(p.t.replace(" ", "T") + "Z"); return t >= lo && t <= hi; });
      }
      fs.writeFileSync(path.join(DIR, key), JSON.stringify(json));
      saved.push(key);
    } catch (e) { console.error("skip", key, e.message); }
  });
  await page.goto(site + "#board");
  await page.waitForFunction(() => document.getElementById("updated").textContent.startsWith("Refreshed"), null, { timeout: 120000 });
  await page.waitForTimeout(1000);
  fs.writeFileSync(path.join(DIR, "meta.json"), JSON.stringify({ recorded: now.toISOString(), note: "Live responses recorded for tests" }, null, 1) + "\n");
  console.log(`saved ${saved.length} responses at ${now.toISOString()}`);
  await browser.close();
})();
