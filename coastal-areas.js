// Coastal area grouping (CONTEXT.md: "Coastal area", "Nearby Station", "Area definition").
//
//   coastalAreas(stations, { rectangle, definition }) -> ordered Coastal areas
//
// In:  the Stations of an Area of responsibility, its rectangle [west, south, east, north],
//      and, when it has one, its Area definition: a Map from each Station to its hand-made
//      placement { area, order, alsoServes: [area names] }.
// Out: [{ name, order, own: [Station], nearby: [Station] }], in coast order. Stations keep
//      their input order inside each list. The Stations themselves are not changed.
//
// With an Area definition, its named areas, order and Nearby links are used; a Nearby link
// to an area that does not exist is ignored. Without one, the rules apply:
//   - each tide gauge anchors a Coastal area named after it;
//   - each river gauge joins the area of its closest tide gauge, or anchors its own area,
//     named after it, when every tide gauge is more than 40 miles away;
//   - each wave buoy joins the area of its closest tide gauge (with no tide gauge, its closest
//     Coastal area so far; with none at all, it anchors its own);
//   - an area with no buoy of its own shows the closest buoy within 100 miles as a Nearby Station;
//   - areas run west to east when the rectangle is wider than it is tall, otherwise north to south.
//
// Works in the page (as a global) and in Node (require), so its tests need no browser.
(function (root) {
  "use strict";
  const RIVER_ANCHOR_MI = 40;
  const NEARBY_BUOY_MI = 100;

  // Great-circle distance in miles.
  function miles(lat1, lon1, lat2, lon2) {
    const r = Math.PI / 180, a = Math.sin((lat2 - lat1) * r / 2) ** 2 +
      Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(a));
  }
  const closest = (s, list) => list.reduce((best, t) => {
    const d = miles(s.lat, s.lon, t.lat, t.lon); return d < best.d ? { t, d } : best;
  }, { t: null, d: Infinity });

  function fromDefinition(stations, definition) {
    const byName = new Map();
    for (const s of stations) {
      const p = definition.get(s);
      if (!p) continue;
      if (!byName.has(p.area)) byName.set(p.area, { name: p.area, order: +p.order, own: [], nearby: [] });
    }
    for (const s of stations) {
      const p = definition.get(s);
      if (!p) continue;
      byName.get(p.area).own.push(s);
      for (const other of p.alsoServes || []) if (byName.has(other)) byName.get(other).nearby.push(s);
    }
    return [...byName.values()].sort((a, b) => a.order - b.order);
  }

  function fromRules(stations, rectangle) {
    const areaOf = new Map(), alsoServes = new Map(stations.map(s => [s, []]));
    const tides = stations.filter(s => s.kind === "tide_gauge");
    const rivers = stations.filter(s => s.kind === "river_gage");
    const buoys = stations.filter(s => s.kind === "wave_buoy");
    const anchors = [...tides];
    for (const s of tides) areaOf.set(s, s.name);
    for (const s of rivers) {
      const c = closest(s, tides);
      if (c.t && c.d <= RIVER_ANCHOR_MI) areaOf.set(s, areaOf.get(c.t));
      else { areaOf.set(s, s.name); anchors.push(s); }
    }
    for (const b of buoys) {
      const c = closest(b, tides.length ? tides : anchors);
      if (c.t) areaOf.set(b, areaOf.get(c.t));
      else { areaOf.set(b, b.name); anchors.push(b); }
    }
    for (const a of anchors) {
      const name = areaOf.get(a);
      if (buoys.some(b => areaOf.get(b) === name)) continue;
      const c = closest(a, buoys);
      if (c.t && c.d <= NEARBY_BUOY_MI) alsoServes.get(c.t).push(name);
    }
    const [w, s, e, n] = rectangle;
    const midLat = (s + n) / 2;
    const wide = miles(midLat, w, midLat, e) > miles(s, w, n, w);
    anchors.sort(wide ? (a, b) => a.lon - b.lon : (a, b) => b.lat - a.lat);
    const placement = new Map(stations.filter(st => areaOf.has(st)).map(st => [st, {
      area: areaOf.get(st), order: anchors.findIndex(a => areaOf.get(a) === areaOf.get(st)) + 1, alsoServes: alsoServes.get(st),
    }]));
    return fromDefinition(stations, placement);
  }

  function coastalAreas(stations, { rectangle, definition } = {}) {
    return definition ? fromDefinition(stations, definition) : fromRules(stations, rectangle);
  }

  const api = { coastalAreas };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CoastalAreas = api;
})(this);
