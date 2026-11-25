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
  if (u.pathname.endsWith("/mdapi/prod/webapi/stations.json")) return `mdapi-stations-${q.get("type")}.json`;
  if ((m = u.pathname.match(/\/mdapi\/prod\/webapi\/stations\/(\w+)\/(floodlevels|datums)\.json$/))) return `mdapi-${m[1]}-${m[2]}.json`;
  // The NWS gauge search by rectangle: one file per rectangle.
  if (u.pathname.endsWith("/nwps/v1/gauges")) return `nwps-gauges-${["xmin", "ymin", "xmax", "ymax"].map(k => q.get("bbox." + k)).join("_")}.json`;
  if ((m = u.pathname.match(/\/nwps\/v1\/gauges\/(\w+)\/stageflow\/forecast$/))) return `nwps-${m[1]}-forecast.json`;
  if ((m = u.pathname.match(/\/nwps\/v1\/gauges\/(\w+)$/))) return `nwps-${m[1]}.json`;
  if (u.pathname.endsWith("/data/waves.json")) return "waves.json";
  // CDIP's data server answers in text and XML; these fixtures are kept as text.
  if (u.hostname === "thredds.cdip.ucsd.edu") {
    if (u.pathname.endsWith("/catalog/cdip/realtime/catalog.xml")) return "cdip-catalog.xml";
    if (u.pathname.endsWith("/latest_3day.nc.ascii")) return "cdip-latest_3day.txt";
    if ((m = u.pathname.match(/\/(\w+)_rt\.nc\.das$/))) return `cdip-${m[1]}.das.txt`;
  }
  return null;
}

module.exports = { fixtureKey, DIR };
