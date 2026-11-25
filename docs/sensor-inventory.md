# Oregon Coast Sensor Inventory

Starting research, November 2026. Station IDs marked **verify** need to be checked against the operator's site before they are used in code.

## 1. Water level and storm surge: NOAA CO-OPS tide gauges

Real-time water level. Surge = observed water level minus predicted tide.

- Astoria, Tongue Point (9439040, verify)
- Garibaldi, Tillamook Bay (9437540). Gauge is on the Coast Guard pier.
- South Beach, Newport (9435380, verify). Also in the global GLOSS core network.
- Charleston, Coos Bay (9432780, verify)
- Port Orford (9431647). Flagged "low water condition" as of Nov 2026.

Data: https://tidesandcurrents.noaa.gov (CO-OPS API serves JSON).

## 2. Offshore waves: NOAA NDBC buoys

- 46029 Columbia River Bar, 20 nm west of the river mouth
- 46089 Tillamook (verify)
- 46050 Stonewall Bank, 20 nm west of Newport
- 46015 Port Orford

Data: https://www.ndbc.noaa.gov (real-time text files per station).

## 3. Nearshore waves: Scripps CDIP Waverider buoys

Wave height, direction, period and spectrum, which are the inputs for runup and overtopping.

- PacWave South off Newport: CDIP 277, 278, 280. **Not in CDIP real-time data as of 25 Nov 2026**, so they were removed from the station list (they had no location and could never report).
- Live Oregon CDIP stations as of 25 Nov 2026: 162 Clatsop Spit, 179 Astoria Canyon, 139 Umpqua Offshore

Data: https://cdip.ucsd.edu. PacWave also runs FLOATr, Sofar Spotter and Nexsens buoys.

NWS bar cameras and bar observations cover the river entrances.

## 4. River flooding: USGS stream gages and NWS forecast points

Coastal rivers. USGS gage numbers and NWS codes were verified on 25 Nov 2026 and are in `data/sensors.csv`:

- Nehalem River near Foss
- Wilson River near Tillamook
- Trask River near Tillamook
- Nestucca River near Beaver (14303600, NWS forecast point)
- Siletz River at Siletz
- Alsea River near Tidewater
- Siuslaw River near Mapleton
- Umpqua River near Elkton
- Coquille River at Coquille; South Fork Coquille at Myrtle Point and Powers
- Rogue River at Agness

Data: USGS Water Data API; NWS National Water Prediction Service (https://water.noaa.gov) for flood stages and forecasts.

## 5. Tsunami: DART

A seafloor bottom pressure recorder plus a surface buoy, relayed by satellite. NOAA deployed 4th-generation DART test systems off Oregon, designed for near-field Cascadia detection. **Current status not confirmed.**

## 6. Earthquake: ShakeAlert

PNSN finished planned installations in 2026: 569 seismic stations across Washington and Oregon. The offshore sensors on the Oregon seafloor cable are not yet part of ShakeAlert.

## 7. Ocean conditions: OOI Coastal Endurance Array (OSU)

Newport line moorings at the inner shelf (~25-30 m), shelf (~80 m, cabled) and slope (~500-600 m), plus gliders. Mainly for hypoxia, upwelling and marine heatwaves, not inundation.

## 8. Surface currents: HF radar (OSU)

Useful for search and rescue and spill drift.

## 9. Shoreline change: DOGAMI / OSU beach monitoring

Repeat GPS beach profiles. Documents erosion and dune retreat after storms. Not real-time.

## Gaps

- No live water level in several small estuaries
- Little nearshore wave and runup sensing at communities
- Candidate fills: low-cost water-level sensors; USGS rapid-deployment storm-tide sensors placed before forecast events
