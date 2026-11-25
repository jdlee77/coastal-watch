# Finding sensors by area, nationwide

Research notes, 25 November 2026. The question was whether each feed Coastal Watch uses can find its stations, flood levels and other details **for any area in the US**, and what stops working outside Oregon. All live calls were made on 2026-11-25 between 20:30 and 21:00 UTC. Counts are as of that time and will change.

## Summary

- **All four networks can be searched by area, but each one works differently.** NWS river gauges (NWPS) accept a map rectangle directly. Tide gauges (CO-OPS) come as one national list with coordinates, which we then filter ourselves; there is also a "stations within N miles of this one" search. NDBC and CDIP each publish one file listing every station with its coordinates.
- **Flood levels are patchy outside Oregon.** Of 303 active CO-OPS water-level stations, 193 have at least one NWS flood level and 133 have a NOAA-formula level. Coverage is good on the Gulf and East coasts. It is weak in Alaska (7 of 27), Puerto Rico (1 of 13), the Pacific islands and the Great Lakes (most Great Lakes gauges have only an "action" level). Many California stations have an NWS minor level but no moderate or major level.
- **The Great Lakes do not fit the current code.** They have no tide predictions, no MLLW datum and no surge. Water levels are given against the lake datum (IGLD or Low Water Datum). The app always requests MLLW, which returns an error there.
- **Some places on the list are not live.** Twelve CO-OPS stations on the "active" list (eight in Puerto Rico) returned no data for the past week. Four CDIP buoys in the real-time catalog have been silent for weeks or months. A discovered station needs a freshness check before it is shown.
- **The browser can read CO-OPS, NWPS, USGS and CDIP's data server directly. It cannot read NDBC, CDIP's text summary page or the main CDIP website.** This matches ADR 0002. One new fact: CDIP's data server does allow browser reads.
- **NWPS has more than rivers.** It includes about 340 tide-height gauges, most of them on CO-OPS stations. Some of those carry NWS flood categories in MLLW, and some carry NWS total-water-level forecasts. On the Oregon coast, only Astoria (ASTO3) is in NWPS, and it has no flood categories there, even though CO-OPS publishes NWS levels for it.
- **USGS:** NWPS already gives the observed stage for every gauge it covers. USGS adds gauges that NWS does not track, and their site type and county, but **USGS publishes no flood thresholds**. The old USGS WaterServices will be shut down on **22 February 2027**, with deliberate slowdowns and outages from January 2027. The replacement is api.waterdata.usgs.gov.
- **Not reachable from here:** api.weather.gov, www.weather.gov, coast.noaa.gov and fisheries.noaa.gov are blocked by this session's network settings. The items below that depend on them (NWS office lookup by point, NWS zone shapefiles, NOAA coastal county list) come from search results only and are marked **unverified**.

---

## 1. NOAA CO-OPS tide gauges

### Discovery endpoints
- National list of active water-level stations (one request, about 780 KB):
  `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=waterlevels`
  On 2026-11-25 it returned `count: 303`. The documentation defines `waterlevels` as "Stations that actively measure water levels". `waterlevelsandmet` also exists (active stations, excluding current meters). (https://api.tidesandcurrents.noaa.gov/mdapi/prod/)
- The same list with flood levels and details embedded (about 900 KB):
  `...stations.json?type=waterlevels&expand=details,floodlevels`
  Asking for `expand=datums` on the list returned only a link, not the datums. Datums need one request per station: `.../stations/{id}/datums.json`.
- **There is no bounding-box, state or office filter** on the station list (no such parameter is documented at https://api.tidesandcurrents.noaa.gov/mdapi/prod/). Each record has `lat`/`lng` and a `state` code, so filtering by rectangle or state has to happen on our side.
- Radius search around a station: `.../stations/9439040/nearby.json?radius=30` returned Astoria, Cape Disappointment, Skamokawa and Wauna, each with a distance in miles. The default radius is 170 miles (per the documentation). It searches around a station, not around an arbitrary point.

### Fields that matter (from the live list and the documentation's field table)
`id`, `name`, `lat`, `lng`, `state`, `tidal` (true/false), `greatlakes` (true/false), `shefcode` (the NWS location ID, e.g. `ASTO3`), `timezone` (e.g. `PST`, `HAST`), `timezonecorr` (hours from UTC), `observedst` (whether daylight saving time applies), `affiliations` (e.g. `NWLON`, `PORTS`), `stormsurge`, `forecast`, `outlook`, `inundationdb`, `tideType`. The `details` part adds `established`, `removed` and `timemeridian`.

### Flood level coverage (`floodlevels`), 303 active stations
"Any NWS" means at least one of `nws_minor`, `nws_moderate` or `nws_major` is set. "All 3 NWS" means all three are set. Source: `stations.json?type=waterlevels&expand=details,floodlevels`, called live.

| State | Stations | Any NWS | Any NOAA (`nos_*`) | All 3 NWS | `action` set |
|---|---|---|---|---|---|
| TX | 39 | 30 | 9 | 30 | 12 |
| MI (Great Lakes) | 29 | 10 | 0 | 4 | 29 |
| AK | 27 | 7 | 0 | 5 | 21 |
| FL | 23 | 23 | 17 | 23 | 1 |
| CA | 19 | 10 | 13 | **0** | 4 |
| NY | 16 | 5 | 3 | 5 | 14 |
| WA | 16 | 14 | 7 | 9 | 6 |
| LA | 15 | 9 | 11 | 9 | 5 |
| PR | 13 | 1 | 2 | 0 | 5 |
| VA | 9 | 9 | 7 | 9 | 7 |
| HI | 7 | 6 | 6 | 0 | 1 |
| OR | 7 | 4 | 4 | 1 | 1 |
| NC | 6 | 6 | 5 | 6 | 3 |
| Pacific territories, labelled "United States of America" (Guam, Midway, Wake, Kwajalein) | 5 | 0 | 4 | 0 | 1 |
| **All 303** | | **193** | **133** | **157** | **132** |

Gotchas:
- The `state` field is not always a state code. Five Pacific stations say `"United States of America"`, and others say `"Bermuda"` or `"American Samoa"`. Bermuda (two stations) and Kwajalein are outside US jurisdiction but are in the list.
- **The `action` field is mostly used at Great Lakes stations.** All 52 Great Lakes stations have some flood value, but often only `action`. Example: Ogdensburg 8311030 has `action: 247.67` and nothing else. The current app reads only minor, moderate and major, so it would treat such a station as having no Threshold.
- **The floodlevels response does not say which datum it uses.** The documentation describes it only as "NOS and NWS flood thresholds". A live cross-check shows the values are in station datum (STND). Atlantic City 8534720: `nws_minor 10.96` − MLLW `4.96` = 6.0 ft MLLW, which equals NWPS's ACYN4 minor stage of 6 ft "(IN MLLW)". Calumet Harbor 9087044: `nws_minor 582.51` is on the same scale as its IGLD reading of 579.06 ft. The app's existing "subtract MLLW" step is consistent with this, but it is an inference, not a documented rule.

### Datums
- **Tidal stations with no MLLW:** 12 of the 239 tidal stations had no MLLW in `datums.json`: 6 in Puerto Rico, 4 in Texas (Laguna Madre area) and 2 in Louisiana. The app's `datum=MLLW` request would fail at these stations.
- **Great Lakes** (52 stations, `greatlakes: true`, `tidal: false`): `datums.json` for Calumet Harbor 9087044 lists only `GL_LWD` (577.43 ft) and no MLLW, MSL or NAVD. Live datagetter calls returned:
  - `datum=MLLW` gives `"There is no MLLW for the station: 9087044"`
  - `datum=IGLD` gives 579.062 ft, and `datum=STND` gives the same value (station datum is IGLD there)
  - `datum=LWD` gives 1.634 ft (height above Low Water Datum)
  - `datum=NAVD` and `datum=MSL` give "There is no … for the station"
  - `product=predictions` gives `"Great Lakes stations don't have Predictions data."` So the Surge definition (observed minus predicted tide) cannot be computed there.

### Live data check
A `date=latest` request was made at every station on the list: 291 had a reading less than 1 hour old, and 12 returned "No data was found". Those 12 were Reedy Point DE, Carrollton LA, Sabine Offshore TX, Marquette MI and 8 Puerto Rico stations. A 7-day request at Fajardo PR also returned no data. Being on the "active" list does not guarantee current readings.

### Time zone
Each station has `timezone`, `timezonecorr` and `observedst`. Values found: EST, CST, PST, AKST, AST (with and without daylight saving time), HAST, SST, ChST and NZST (used for Wake and Kwajalein). The datagetter also accepts `time_zone=lst_ldt` (station local time). Astoria returned `12:42` local for the same reading that `gmt` returned as `20:42`.

### CORS
**Yes.** `access-control-allow-origin: *` on the mdapi station list, on floodlevels and on the datagetter (curl with an `Origin` header).

### Sources
- https://api.tidesandcurrents.noaa.gov/mdapi/prod/ (documentation, read)
- https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=waterlevels&expand=details,floodlevels (called)
- https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/{id}/datums.json and `/floodlevels.json` (called for all 303)
- https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=9087044&product=water_level&date=latest&datum=IGLD&units=english&time_zone=gmt&format=json (and the MLLW, LWD, STND, NAVD and MSL variants; called)

---

## 2. NWS NWPS river (and tide) gauges

### Discovery endpoints
- OpenAPI (Swagger 2) document: `https://api.water.noaa.gov/nwps/v1/docs/swagger.json` (the Swagger page is at `/nwps/v1/docs/`).
- Rectangle search: `GET /nwps/v1/gauges?bbox.xmin=&bbox.ymin=&bbox.xmax=&bbox.ymax=&srid=EPSG_4326`. Other `srid` values are `EPSG_3857` and `SRID_UNSPECIFIED`. The only other parameter is `catfim` ("Filter gauges based on CatFIM configuration. Default: false").
  - **`srid` is effectively required.** The Oregon box without `srid` returned an 18-byte response; with `EPSG_4326` it returned 65 gauges (from both OR and WA).
  - With `catfim=true`, the Oregon box returned 0 gauges. What the filter selects is unclear (see open questions).
- **There is no state, office (WFO), county or River Forecast Center filter** in the OpenAPI document. Those are fields in the response.
- The list has **no paging**. With no box, the request returned all **12,981** gauges (13.2 MB, about 40 seconds). A Florida-sized box returned 857 KB in 3.5 seconds.
- Other useful paths: `/gauges/{id}` (full metadata), `/gauges/{id}/stageflow[/{observed|forecast}]`, `/gauges/{id}/riverflow` (upstream and downstream gauges), and `POST /gauges/raag`.

### Fields
- **In the list** (`/gauges?bbox…`): `lid`, `name`, `rfc{abbreviation,name}`, `wfo{abbreviation,name}`, `state{abbreviation,name}`, `latitude`, `longitude`, `pedts{observed,forecast}`, and `status.observed/forecast{primary, primaryUnit, floodCategory, validTime}`. The list has **no flood stages, no USGS ID and no county**. The current flood category is included (values: `no_flooding`, `not_defined`, `action`, `minor`, `moderate`, `major`, `low_threshold`, `obs_not_current`, `out_of_service`).
- **Per gauge** (`/gauges/TLMO3`): adds `usgsId`, `reachId`, `county`, `timeZone` (a POSIX zone such as `PST8PDT`), `flood.categories.{action,minor,moderate,major}.{stage,flow}` (−9999 when not set), `inService`, `datums`, `upstreamLid` and `downstreamLid`. Getting thresholds and USGS IDs for the gauges in an area therefore takes one request per gauge.
- Nationwide on 2026-11-25: 4,156 of 12,981 gauges had observed category `not_defined` (no flood categories), 849 were `obs_not_current` and 714 were `out_of_service`. Gauges were spread across 53 state codes, including PR (119), VI (3), AK (393) and HI (75).
- `usgsId` can be empty when the gauge is run by someone other than USGS. Example: NRNO3, Nehalem River at Nehalem.

### Coastal and tidal gauges in NWPS
- 339 gauges have an observed code starting with `HM` (tide or lake height), and 199 start with `HT`. Examples include ACYN4 "New Jersey Atlantic Coast at Atlantic City (ocean front) (IN MLLW)", AAMC1 "San Francisco Bay Alameda tide gage" and ADKA2 Adak.
- 301 CO-OPS stations have a `shefcode`, and **219 of those codes exist as NWPS gauges**. On the Oregon coast, only **ASTO3** (Astoria) is in NWPS. PORO3, CHAO3, SBEO3 and TLBO3 are not (Wauna and St Helens are on the Columbia River).
- **NWPS and CO-OPS flood levels can disagree in coverage.** ASTO3 in NWPS has all flood categories at −9999 (`not_defined`), but CO-OPS floodlevels for 9439040 has `nws_minor 14.24`, `nws_moderate 16.74` (station datum). The reverse case was also seen: ACYN4 in NWPS has minor, moderate and major of 6, 7 and 8 ft MLLW, which match the CO-OPS `nws_*` values after conversion.
- ASTO3 has an NWS forecast (`pedts.forecast: HMIFZ`, forecast primary 11.85 ft at 21:00Z). So NWPS can supply **NWS total-water-level forecasts at some tide gauges**, which CO-OPS does not.
- The NWPS stage at ASTO3 (11.53 ft at 20:06Z) is close to the CO-OPS MLLW reading (11.82 ft at 20:42Z), which suggests NWPS also uses MLLW there. This is **unverified**: the per-gauge `datums` block lists NGVD29 and does not say which datum the stage uses.

### CORS
**Yes.** `access-control-allow-origin: *` on `/gauges?bbox…`, `/gauges/TLMO3` and `/gauges/TLMO3/stageflow/forecast`.

### Sources
- https://api.water.noaa.gov/nwps/v1/docs/swagger.json (read)
- https://api.water.noaa.gov/nwps/v1/gauges (all; called), `?bbox…&srid=EPSG_4326` (called), `/gauges/ASTO3`, `/gauges/TLMO3`, `/gauges/ACYN4` (called)

---

## 3. USGS

### Is USGS needed beyond NWPS?
- NWPS already provides observed stage, flood categories and forecasts for its gauges, and the app currently uses only NWPS for rivers.
- **USGS has gauges that NWPS does not.** In a Tillamook box (−124.2, 45.3, −123.6, 45.8), USGS `latest-continuous` (gage height, code 00065) listed 14301000, 14301340, 14301500, 14302020 and 14302480. NWPS lists FSSO3, MIAO3, NRNO3, TLMO3, TRAO3 and WTSO3. **14301340 has no NWPS gauge.** MIAO3's `usgsId` is 14301300, which did not appear in the USGS gage-height results.
- USGS publishes **no flood thresholds**. A USGS-only gauge would have a Reading but no Threshold.
- USGS provides useful extras: `site_type_code` (e.g. `ST` stream, `ES` estuary; the USGS `site-types` collection lists the others), `county_name`, `state_name`, `hydrologic_unit_code`, `time_zone_abbreviation`, `uses_daylight_savings` and `vertical_datum`.
- `latest-continuous` also returns long-dead gauges (USGS-452546123492700 last reported 2023-05-24), so a freshness check is needed.

### New API (OGC API – Features)
- Collections: `https://api.waterdata.usgs.gov/ogcapi/v0/collections?f=json` includes `monitoring-locations`, `latest-continuous`, `continuous`, `time-series-metadata`, `counties`, `states`, `site-types`, `time-zone-codes` and others.
- Rectangle search examples:
  - `.../collections/monitoring-locations/items?f=json&bbox=-124.2,45.3,-123.6,45.8&site_type_code=ST`
  - `.../collections/latest-continuous/items?f=json&bbox=-124.2,45.3,-123.6,45.8&parameter_code=00065&limit=100`
- API keys are optional and give "higher rate limits". The actual limits with and without a key were not found on the pages read (**unverified**) (https://api.waterdata.usgs.gov/signup/, https://api.waterdata.usgs.gov/docs/ogcapi/).
- CORS: **yes** (`access-control-allow-origin: *`).

### Legacy WaterServices shutdown
The waterservices.usgs.gov home page says: "WaterServices will be permanently shut down on February 22nd, 2027. Requests will be intentionally slowed down and there will be intentional outages beginning in January 2027. Users must migrate to https://api.waterdata.usgs.gov." Legacy `/nwis/iv` currently sends `Access-Control-Allow-Origin: *`.

### Sources
- https://waterservices.usgs.gov/ (read)
- https://api.waterdata.usgs.gov/ogcapi/v0/collections?f=json and the item queries above (called)
- https://api.waterdata.usgs.gov/docs/ogcapi/, https://api.waterdata.usgs.gov/signup/ (read)

---

## 4. NDBC buoys

### Discovery endpoints
- `https://www.ndbc.noaa.gov/activestations.xml`: 1,357 stations. Attributes: `id`, `lat`, `lon`, `elev`, `name`, `owner`, `pgm`, `type` (`fixed` 710, `buoy` 438, `dart` 76, `oilrig` 54, `tao` 48, `other` 29, `usv` 2), and the flags `met`, `currents`, `waterquality` and `dart`. **There is no waves flag.**
- To find which stations report waves:
  - `https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt` has one row per station (818 rows) with `LAT`, `LON`, time and `WVHT`. 192 rows had a wave height on 2026-11-25. This single file is enough to find wave-reporting stations by area.
  - The `realtime2/` directory listing had 243 `.spec` files (spectral wave summaries), which is another indicator.
- `https://www.ndbc.noaa.gov/data/stations/station_table.txt` is a pipe-delimited table with `OWNER`, `TTYPE`, `LOCATION`, **`TIMEZONE`** (a letter, e.g. `P`, `E`, `C`) and **`FORECAST`**. The FORECAST column holds the WMO header of the NWS marine forecast product, which names the issuing office (e.g. 46029 → `FZUS56.KPQR`).
- `realtime2/{id}.txt` holds the last 45 days ("The Realtime directory data/realtime2 contains the current (last 45 days) data", https://www.ndbc.noaa.gov/faq/rt_data_access.shtml).

### Gotchas
- **Duplicates with CDIP:** 51 `owner="SCRIPPS"` stations are CDIP Waveriders under a WMO ID, with the CDIP number in the name (e.g. 46229 "UMPQUA OFFSHORE, OR (139)", 46243 Clatsop Spit (162)). Discovering both networks by area will list the same buoy twice unless CDIP's `wmo_id` is matched to the NDBC ID.
- Wave-reporting stations include foreign and non-federal owners (Environment and Climate Change Canada 23, the Korean Meteorological Administration, oil platforms, CORMP, USACE and others).
- NDBC buoys have no flood or wave thresholds.

### CORS
**No.** `activestations.xml`, `realtime2/46029.txt` and `latest_obs.txt` returned 200 with **no `Access-Control-Allow-Origin` header**, which confirms ADR 0002.

### Sources
- https://www.ndbc.noaa.gov/activestations.xml, https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt, https://www.ndbc.noaa.gov/data/realtime2/, https://www.ndbc.noaa.gov/data/stations/station_table.txt (called)
- https://www.ndbc.noaa.gov/faq/rt_data_access.shtml (read)

---

## 5. CDIP Waverider buoys

### Discovery endpoints
- THREDDS real-time catalog: `https://thredds.cdip.ucsd.edu/thredds/catalog/cdip/realtime/catalog.xml` lists 74 `{stn}p1_rt.nc` files, plus `latest_3day.nc` and `latest_7day.nc`. The catalog does not include coordinates.
- Per-station attributes: `.../dodsC/cdip/realtime/{stn}p1_rt.nc.das` contains `geospatial_lat_min/max`, `geospatial_lon_min/max`, `platform_name` (e.g. "CLATSOP SPIT, OR BUOY - 162p1"), **`wmo_id`** (the NDBC ID, e.g. 46243), `time_coverage_end`, and `title`/`summary` with water depth.
- **A single file for all stations:** `.../dodsC/cdip/realtime/latest_3day.nc` has `stationCount = 100` and contains `metaLatitude`, `metaLongitude`, `metaSiteLabel`, `metaStationName`, `metaWMOid` and `metaWaterDepth`, plus `waveHs`, `waveTp` and `waveDp` for the last 144 half-hour steps. CDIP's documentation says this file "contains the latest 3 days of data for all stations" (https://cdip.ucsd.edu/m/documents/data_access.html).
- Text summary: `https://cdip.ucsd.edu/data_access/sccoos.cdip` gives one line per active station (time, ID, name, lat, lon, depth, Hs, Tp, Dp, SST). It listed 74 stations. The documentation describes it as "a summary of our active stations including location, wave parameters and depth".

### Coverage (from the 74 real-time files, 2026-11-25)
- Pacific coast: CA (many), OR (139, 162, 179), WA (036 Grays Harbor, 248 Angeles Point), and 166 Ocean Station Papa.
- Alaska: 204 Lower Cook Inlet only.
- Hawaii: 098, 106, 188 and 233 live; 187 and 225 silent.
- Atlantic: FL, NC, VA, DE, NJ, RI, MA and NH.
- Gulf: FL (144, 214, 244), LA (279 Chandeleur), TX (252 Aransas Pass, silent for about 450 hours).
- Great Lakes: 274 Oswego, NY.
- Caribbean: PR (181, 249).
- Pacific territories and freely associated states: American Samoa, Guam (121, silent since June 2026), Marshall Islands, Micronesia and Palau.

### Gotchas
- **Being in the catalog does not mean live.** By `time_coverage_end` and `sccoos.cdip`, 121 Guam (last 2026-06-28), 187 Maui (last 2026-10-13), 225 Kaneohe (last 2026-07-14) and 252 Aransas Pass had no recent data.
- `latest_3day.nc` holds 100 entries with suffixes p0, p1, p2 and p3. It includes sites that are **not** in the `p1_rt` catalog or in `sccoos.cdip`. One is **270p0 "TILLAMOOK BAY SOUTH JETTY, OR"** (45.561, −123.991), which had a wave height at 2026-11-25 19:30Z. Another is 280p0 "YAQUINA CHANNEL SW, OR", which had no valid wave height in 3 days. 270p0_rt.nc and 280p0_rt.nc do not exist on THREDDS (404). What p0, p2 and p3 mean, and whether p0 data is meant for public use, is **unverified**.
- The NDBC duplicate issue is described in section 4. The `wmo_id`/`metaWMOid` field is the link between the two.

### CORS
- THREDDS OPeNDAP (`.dds`, `.das`, `.ascii`) and `catalog.xml`: **yes** (`access-control-allow-origin: *`).
- `cdip.ucsd.edu/data_access/sccoos.cdip` and `justdar.cdip`: **no** CORS header.

### Sources
- https://thredds.cdip.ucsd.edu/thredds/catalog/cdip/realtime/catalog.xml, `/dodsC/cdip/realtime/{stn}p1_rt.nc.das` (all 74), `/dodsC/cdip/realtime/latest_3day.nc.dds` and `.ascii?…` (called)
- https://cdip.ucsd.edu/data_access/sccoos.cdip (called), https://cdip.ucsd.edu/m/documents/data_access.html (read)

---

## 6. Cross-cutting

### Which endpoints a browser can read (curl with `Origin: https://example.github.io`)
| Endpoint | Access-Control-Allow-Origin |
|---|---|
| api.tidesandcurrents.noaa.gov mdapi and datagetter | `*` |
| api.water.noaa.gov/nwps/v1 (gauges, detail, stageflow) | `*` |
| api.waterdata.usgs.gov/ogcapi | `*` |
| waterservices.usgs.gov/nwis/iv (shuts down 2027-02-22) | `*` |
| thredds.cdip.ucsd.edu (catalog, OPeNDAP) | `*` |
| www.ndbc.noaa.gov (activestations.xml, realtime2, latest_obs) | none |
| cdip.ucsd.edu/data_access/*.cdip | none |
| water.noaa.gov (web pages) | none |
| api.weather.gov | not tested: **blocked by this session's network proxy** ("no rule or network setting allows this host") |

### NWS office (WFO) for a point or station
- NWPS gives the office directly for each gauge: `wfo.abbreviation` and `wfo.name` (and `rfc`), in the list response.
- CO-OPS has no WFO field. Its `shefcode` links to an NWPS gauge for 219 stations, which gives the WFO for those.
- NDBC's `station_table.txt` FORECAST column names the office's marine product (e.g. `FZUS56.KPQR`).
- `api.weather.gov/points/{lat},{lon}` (which would give the office and forecast zone for any point) **could not be checked**: the host is blocked from this container.

### Time zone per station or area
- CO-OPS: `timezone`, `timezonecorr`, `observedst`.
- NWPS (per gauge): `timeZone`, e.g. `PST8PDT`.
- USGS: `time_zone_abbreviation`, `uses_daylight_savings`.
- NDBC station_table: `TIMEZONE` letter code.
- CDIP: none found in the attributes read. Times are UTC.

### NWS coastal flood and high-surf products
A machine-readable source is expected at api.weather.gov (alerts filtered by event, e.g. "Coastal Flood Warning", "High Surf Advisory"). It **could not be checked** because the host is blocked. Noted only.

---

## 7. Authoritative area definitions ("Coastal areas")
**Unverified:** these hosts are blocked in this session, so the pages could not be read. The URLs and descriptions below come from search-result listings only.
- NWS GIS public forecast zones shapefile (date-stamped zip, e.g. `z_18mr25.zip`): https://www.weather.gov/gis/PublicZones, with metadata at https://www.weather.gov/gis/PublicZoneMetadata
- NWS coastal, offshore and high-seas marine zones, including "Coastal Marine Zones Including the Great Lakes": https://www.weather.gov/gis/MarineZones
- NWS county warning areas (WFO boundaries): https://www.weather.gov/gis/CWABounds
- NWS zone-to-county correlation file (pipe-delimited): https://www.weather.gov/gis/ZoneCounty
- Index of NWS AWIPS shapefiles: https://www.weather.gov/gis/AWIPSShapefiles
- NOAA Office for Coastal Management "Coastal Counties" dataset on InPort (shoreline and watershed definitions; a search snippet says it was last updated August 2024): https://www.fisheries.noaa.gov/inport/item/66113, with background at https://coast.noaa.gov/digitalcoast/training/defining-coastal-counties.html. A search snippet says the older watershed-based framework excludes Alaska and Hawaii.

---

## Summary table

| Feed | Discover by area? | Thresholds nationwide? | Browser can read directly? | Notes |
|---|---|---|---|---|
| CO-OPS tide gauges | Partly: one national list (303) with lat/lng and state, filtered on our side; `nearby.json` radius search around a station | Partly: 193/303 have an NWS level and 133/303 a NOAA level; weak in AK, PR, the Pacific islands and the Great Lakes (mostly `action` only); CA has no NWS moderate or major levels | Yes | Levels are in station datum (inferred). 12 tidal stations lack MLLW. Great Lakes: no MLLW, no predictions, so no surge. 12 "active" stations had no data for a week. |
| NWS NWPS gauges | Yes: `/gauges?bbox…&srid=EPSG_4326`; no state, WFO or county filter | Yes where NWS has set them (8,825 of 12,981 not `not_defined`); stages need one request per gauge | Yes | Includes about 340 tidal (HM) gauges, with forecasts at some. Coverage differs from CO-OPS (ASTO3 has no NWPS levels, but CO-OPS has NWS levels for it). Full list 13 MB, no paging. |
| USGS (OGC API) | Yes: `bbox` on `monitoring-locations` and `latest-continuous` | No (USGS publishes none) | Yes | Adds gauges NWPS lacks, plus site type and county. Legacy WaterServices shuts down 2027-02-22 (slowdowns from January 2027). Rate limits are not stated (key optional). |
| NDBC | Yes, via whole files (`activestations.xml`, `latest_obs.txt` with lat/lon/WVHT) filtered on our side | No | **No** (no CORS) | No waves flag; use WVHT in latest_obs or `.spec` files. About 51 stations duplicate CDIP buoys. station_table gives the time zone and the NWS marine product office. |
| CDIP | Yes, via `latest_3day.nc` (100 sites with lat/lon/WMO ID) or per-station `.das`; filtered on our side | No | Yes for THREDDS; no for `sccoos.cdip` | Covers Pacific, Atlantic, Gulf, HI, one AK site, PR, one Great Lakes site and Pacific territories. Some catalog entries are long dead. p0 sites (e.g. 270p0 Tillamook) are outside the p1 catalog. |

## Open questions
1. What datum are CO-OPS `floodlevels` values in? The documentation does not say; station datum (STND) is inferred from two cross-checks.
2. When CO-OPS and NWPS both have NWS levels for the same gauge, are they always the same? (They matched at Atlantic City; NWPS has none at Astoria.)
3. What datum does an NWPS tidal (HM) gauge's stage use? Some names say "(IN MLLW)"; ASTO3's `datums` block does not say.
4. What does NWPS `catfim=true` select? It returned 0 gauges on the Oregon coast.
5. What do CDIP p0, p2 and p3 deployments mean (e.g. 270p0 Tillamook Bay South Jetty, 280p0 Yaquina Channel SW), and is their data meant for public real-time use?
6. What are the USGS OGC API rate limits without a key, for a public page with many viewers?
7. Were the 12 CO-OPS "active" stations with no data in the past week (mostly Puerto Rico) temporarily out of service? The station `notices`/`sensors` resources were not checked.
8. Not checkable from this session, because these hosts are blocked by its network settings: api.weather.gov (office and zone for a point, alerts for coastal flood and high surf, CORS), www.weather.gov GIS downloads, and the NOAA coastal counties dataset (fisheries.noaa.gov, coast.noaa.gov). Allowing api.weather.gov and www.weather.gov in the session's network settings would let these be verified.
