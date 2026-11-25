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

Planning. Station inventory first, then a dashboard.

## Aggregator to start from

NANOOS Visualization System (NVS): https://nvs.nanoos.org
