// Maps each outside request the page makes to a saved-response file name.
const path = require("path");
const DIR = path.join(__dirname, "fixtures");

// One file name per outside request the page makes.
function fixtureKey(url) {
  const u = new URL(url);
  const q = u.searchParams;
  if (u.hostname === "api.tidesandcurrents.noaa.gov" && u.pathname.endsWith("/datagetter")) {
    const interval = q.get("interval") ? "-" + q.get("interval") : "";
    return `coops-${q.get("product")}${interval}-${q.get("station")}.json`;
  }
  let m;
  if ((m = u.pathname.match(/\/mdapi\/prod\/webapi\/stations\/(\w+)\/(floodlevels|datums)\.json$/))) return `mdapi-${m[1]}-${m[2]}.json`;
  if ((m = u.pathname.match(/\/nwps\/v1\/gauges\/(\w+)\/stageflow\/forecast$/))) return `nwps-${m[1]}-forecast.json`;
  if ((m = u.pathname.match(/\/nwps\/v1\/gauges\/(\w+)$/))) return `nwps-${m[1]}.json`;
  if (u.pathname.endsWith("/data/waves.json")) return "waves.json";
  return null;
}

module.exports = { fixtureKey, DIR };
