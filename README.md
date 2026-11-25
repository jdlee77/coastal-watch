# Coastal Watch

A situational-awareness tool for Oregon coastal hazards: inundation, storm surge, high surf, river flooding at the coast, and tsunami. It pulls public, real-time sensor feeds into one watch-floor view so that ESF-2, the OEC3 watch floor, and OR-Alert decision makers see the same picture.

## Why

No single feed covers coastal flooding. The dangerous events are **compound**: high river flow, high tide, storm surge, and big waves arriving together, as in Tillamook and Coquille. Each piece is measured by a different agency on a different website. Coastal Watch puts them side by side.

## Sensor networks (starting inventory)

| Hazard | Network | Operator | Examples |
|---|---|---|---|
| Water level / surge | Tide gauges (CO-OPS) | NOAA | Astoria, Garibaldi, South Beach, Charleston, Port Orford |
| Offshore waves | Moored buoys | NOAA NDBC | 46029 Columbia River Bar, 46050 Stonewall Bank, 46015 Port Orford |
| Nearshore waves | Waverider buoys | Scripps CDIP | PacWave South (277, 278, 280) and others |
| River flooding | Stream gages / forecast points | USGS, NWS | Nehalem, Wilson, Trask, Nestucca, Siletz, Alsea, Siuslaw, Umpqua, Coquille, Rogue |
| Tsunami | DART buoys | NOAA | DART 4G off Oregon (status to verify) |
| Earthquake | ShakeAlert seismic stations | PNSN / USGS | 569 stations across OR and WA |
| Ocean conditions | OOI Endurance Array | OSU | Newport line moorings (inner shelf, shelf, slope) |
| Surface currents | HF radar | OSU | Coastal coverage |
| Shoreline change | Beach profile monitoring | DOGAMI / OSU | Repeat GPS surveys, not real-time |

The full list is in [`docs/sensor-inventory.md`](docs/sensor-inventory.md) and the machine-readable station list is in [`data/sensors.csv`](data/sensors.csv).

## Known gaps

- No live water-level gauges in several small estuaries (Nehalem, Siletz, Coquille). Those have tide predictions only.
- Little nearshore wave or runup sensing at the communities themselves.
- Possible fills: low-cost water-level sensors, or USGS rapid-deployment storm-tide sensors placed ahead of forecast events.

## Status

`index.html` is a single page with three Layouts:

- **Board**: tide gauges, coastal rivers and wave buoys by coastal area, north to south, colored by the operators' published flood levels (NWS and NOAA shown side by side), with late data marked stale or offline. **Compact** lists areas worst-first, one line each.
- **Map**: every Station at its real location, shaped by kind and colored by level.
- **Split**: Map and Board side by side for the watch-floor video wall.

The Layout and text size can be pinned in the address, for example `…/#split&text=xl` for the video wall. The page refreshes every 5 minutes.

- Terms used on the page: [`CONTEXT.md`](CONTEXT.md)
- Decisions: [`docs/adr/`](docs/adr/)
- Tests: `npm test` opens the page in a headless browser with saved feed responses and checks the Layouts, the Map, the links between them, and the flood-level rules. GitHub runs them on every change. To refresh the saved responses, see `tests/record-fixtures.js`.
- Publishing: [`.github/workflows/publish.yml`](.github/workflows/publish.yml) publishes to GitHub Pages and collects buoy data every 10 minutes ([ADR 0002](docs/adr/0002-github-pages-with-scheduled-buoy-collection.md)).

## Aggregator to start from

NANOOS Visualization System (NVS): https://nvs.nanoos.org
