// Coastal area grouping (coastal-areas.js), tested through its one interface with made-up Stations.
// Run: node --test tests/coastal-areas.unit.js  (part of npm test). No browser, no recordings.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { coastalAreas } = require("../coastal-areas.js");
// The distances come from CONTEXT.md ("Coastal area", "Nearby Station"), not from the module,
// so a change to the module's limits shows up here.
const RIVER_ANCHOR_MI = 40, NEARBY_BUOY_MI = 100;

const MI_PER_DEG_LAT = 69.05; // a degree of latitude, in the module's own distance (great-circle, R = 3958.8 mi)
const tide = (name, lat, lon) => ({ kind: "tide_gauge", name, lat, lon });
const river = (name, lat, lon) => ({ kind: "river_gage", name, lat, lon });
const buoy = (name, lat, lon) => ({ kind: "wave_buoy", name, lat, lon });
const TALL = [-125, 40, -124, 46];   // taller than wide: north to south
const WIDE = [-90, 30, -86, 31];     // wider than tall: west to east
const names = list => list.map(s => s.name);
const summary = areas => areas.map(a => ({ name: a.name, own: names(a.own), nearby: names(a.nearby) }));

test("each tide gauge anchors a Coastal area named after it", () => {
  const areas = coastalAreas([tide("Astoria", 46.2, -123.8), tide("Garibaldi", 45.6, -123.9)], { rectangle: TALL });
  assert.deepEqual(summary(areas), [
    { name: "Astoria", own: ["Astoria"], nearby: [] },
    { name: "Garibaldi", own: ["Garibaldi"], nearby: [] },
  ]);
  assert.deepEqual(areas.map(a => a.order), [1, 2]);
});

test("a river gauge joins the Coastal area of its closest tide gauge", () => {
  const areas = coastalAreas([tide("North", 45, -124), tide("South", 44, -124), river("Creek", 44.2, -123.9)], { rectangle: TALL });
  assert.deepEqual(names(areas.find(a => a.name === "South").own), ["South", "Creek"]);
});

test("a river gauge more than 40 miles from every tide gauge anchors its own area; within 40 it joins", () => {
  const near = river("Near", 44 + (RIVER_ANCHOR_MI - 1) / MI_PER_DEG_LAT, -124);
  const far = river("Far", 44 - (RIVER_ANCHOR_MI + 1) / MI_PER_DEG_LAT, -124);
  const areas = coastalAreas([tide("Gauge", 44, -124), near, far], { rectangle: TALL });
  assert.deepEqual(summary(areas), [
    { name: "Gauge", own: ["Gauge", "Near"], nearby: [] },
    { name: "Far", own: ["Far"], nearby: [] },
  ]);
});

test("Coastal areas run west to east in a wide rectangle, north to south in a tall one", () => {
  const stations = [tide("Middle", 30.6, -88), tide("East", 30.2, -87), tide("West", 30.3, -89.3)];
  assert.deepEqual(names(coastalAreas(stations, { rectangle: WIDE })), ["West", "Middle", "East"]);
  assert.deepEqual(names(coastalAreas(stations, { rectangle: TALL })), ["Middle", "West", "East"]);
});

test("a buoy joins its closest tide gauge's area", () => {
  const areas = coastalAreas([tide("A", 45, -124), tide("B", 43, -124), buoy("Offshore", 43.1, -124.5)], { rectangle: TALL });
  assert.deepEqual(names(areas.find(a => a.name === "B").own), ["B", "Offshore"]);
});

test("an area with no buoy shows the closest buoy within 100 miles as a Nearby Station, and none beyond", () => {
  const withBuoy = tide("Has buoy", 45, -124);
  const within = tide("Within", 45 - (NEARBY_BUOY_MI - 10) / MI_PER_DEG_LAT, -124);
  const beyond = tide("Beyond", 45 - (NEARBY_BUOY_MI + 10) / MI_PER_DEG_LAT, -124);
  const areas = coastalAreas([withBuoy, within, beyond, buoy("Buoy", 45, -124.01)], { rectangle: TALL });
  assert.deepEqual(summary(areas), [
    { name: "Has buoy", own: ["Has buoy", "Buoy"], nearby: [] },
    { name: "Within", own: ["Within"], nearby: ["Buoy"] },
    { name: "Beyond", own: ["Beyond"], nearby: [] },
  ]);
});

test("with no tide gauges, river gauges anchor areas and a buoy joins the closest one", () => {
  const areas = coastalAreas([river("Nemadji", 46.6, -92.1), buoy("Lake buoy", 46.8, -92.0)], { rectangle: [-92.35, 46.55, -91.85, 46.85] });
  assert.deepEqual(summary(areas), [{ name: "Nemadji", own: ["Nemadji", "Lake buoy"], nearby: [] }]);
});

test("a buoy with nothing to join anchors its own area; a later buoy joins it (current rule, kept as is)", () => {
  const areas = coastalAreas([buoy("First", 45, -125), buoy("Second", 44, -125)], { rectangle: TALL });
  assert.deepEqual(summary(areas), [{ name: "First", own: ["First", "Second"], nearby: [] }]);
});

test("an empty rectangle has no Coastal areas", () => {
  assert.deepEqual(coastalAreas([], { rectangle: TALL }), []);
});

test("an Area definition's own names, order and Nearby links are used", () => {
  const a = tide("Astoria", 46.2, -123.8), b = buoy("Bar", 46.1, -124.5), r = river("Wilson", 45.5, -123.7);
  const definition = new Map([
    [a, { area: "Columbia River mouth", order: 1, alsoServes: [] }],
    [b, { area: "Columbia River mouth", order: 1, alsoServes: ["Tillamook Bay", "Nowhere"] }], // "Nowhere" is ignored
    [r, { area: "Tillamook Bay", order: 2, alsoServes: [] }],
  ]);
  assert.deepEqual(summary(coastalAreas([r, a, b], { rectangle: TALL, definition })), [
    { name: "Columbia River mouth", own: ["Astoria", "Bar"], nearby: [] },
    { name: "Tillamook Bay", own: ["Wilson"], nearby: ["Bar"] },
  ]);
});

test("the Stations passed in are not changed", () => {
  const stations = [tide("A", 45, -124), river("R", 45.1, -124), buoy("B", 45, -124.5)];
  const copy = JSON.parse(JSON.stringify(stations));
  coastalAreas(stations, { rectangle: TALL });
  assert.deepEqual(stations, copy);
});
