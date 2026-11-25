// Saved feed responses for tests, and a helper that serves them to the page.
const fs = require("fs");
const path = require("path");

const { fixtureKey, DIR } = require("./fixtures-key");
const meta = JSON.parse(fs.readFileSync(path.join(DIR, "meta.json"), "utf8"));
// The moment the fixtures were recorded. Tests freeze the page's clock here,
// so Fresh/Stale/Offline results do not depend on when the tests run.
const NOW = new Date(meta.recorded);

const read = key => JSON.parse(fs.readFileSync(path.join(DIR, key), "utf8"));
// A 1x1 grey PNG stands in for background map tiles.
const TILE = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN89+7dfwAJeAPmhWsfjQAAAABJRU5ErkJggg==", "base64");

/**
 * Serve saved responses to the page and freeze its clock.
 * edit(key, json) may return a changed copy to create a rare case on purpose.
 * tiles: "ok" (grey tiles) or "fail" (every tile request fails).
 */
async function useFixtures(page, { edit = null, tiles = "ok" } = {}) {
  await page.clock.setFixedTime(NOW);
  await page.route(url => !/^http:\/\/localhost:8787\//.test(url.href) || url.pathname.endsWith("/data/waves.json"), async route => {
    const url = route.request().url();
    if (url.includes("basemap.nationalmap.gov")) {
      return tiles === "fail" ? route.abort() : route.fulfill({ status: 200, contentType: "image/png", body: TILE });
    }
    const key = fixtureKey(url);
    if (!key || !fs.existsSync(path.join(DIR, key))) return route.abort();
    let json = read(key);
    if (edit) json = edit(key, JSON.parse(JSON.stringify(json))) || json;
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(json) });
  });
}

// Helpers for building rare cases
const minutesAgo = m => new Date(NOW.getTime() - m * 60000);
const coopsStamp = d => d.toISOString().slice(0, 16).replace("T", " ");

module.exports = { useFixtures, fixtureKey, NOW, read, minutesAgo, coopsStamp, DIR };
