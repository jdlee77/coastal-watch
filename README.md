# Coastal Watch

A live, shared picture of coastal flooding conditions, built from public real-time sensors. It was built first for the Oregon coast's ESF-2 group, the OEC3 watch floor and OR-Alert decision makers, and it works for any US coast.

**Open it:** <https://jdlee77.github.io/coastal-watch/>

## Why

No single feed covers coastal flooding. The dangerous events are **compound**: high river flow, high tide, storm surge and big waves arriving together, as in Tillamook and Coquille. Each piece is measured by a different agency on a different website. Coastal Watch puts them side by side, grouped by stretch of coast, and colored by each agency's own published flood levels.

It is **not an official warning product**. For tsunami, follow the [National Tsunami Warning Center](https://www.tsunami.gov/).

## Using it

### Three Layouts
- **Board**: each Coastal area as a card, along the coast (north to south, or west to east on a coast that runs that way). Inside a card, the most urgent Station comes first. **Compact** shows one line per area, worst area first.
- **Map**: every Station at its real location. Shape shows the kind (circle = tide gauge, triangle = river, diamond = wave buoy); color shows the flood level. Click a marker for its Reading.
- **Split**: Map and Board side by side, built for the watch-floor video wall. Clicking an area on the Board points to its markers on the Map, and clicking a marker points to its area on the Board.

### Reading the colors
- **Flood levels** follow the NWS steps: action (yellow), minor (orange), moderate (red), major (purple). Green is below flood; an outlined grey tag means the Station has no published flood level.
- **NWS and NOAA levels** are shown side by side on tide gauges. NWS levels come from the local forecast office; NOAA levels come from one national formula. When the two disagree, the Station is marked **sources differ** and shows the higher one. The "Flood level sources" panel on the Board explains both and names the NWS offices for the area.
- **Data age** is on every Reading. **Stale** means late by more than twice the usual reporting interval (a dashed outline on the Map). **Offline** means over 24 hours old.
- **Silent Stations** (no Reading in the last 24 hours) are hidden, so they don't clutter the view. The **Silent (N)** button in the header shows how many are hidden, and shows them when pressed. An area whose Stations are all silent keeps its card and says "no current data", because a blind spot is not the same as calm water.

### Saving a view in a link
Everything about the view lives in the address, so a bookmark or a video-wall screen always reopens the same thing:

| Link | Opens |
|---|---|
| `…/coastal-watch/` | The Oregon coast, Layout chosen by screen width |
| `…/coastal-watch/#split&text=xl` | Oregon in Split, extra-large text (video wall) |
| `…/coastal-watch/#board&area=-82.9,27.5,-82.35,28.05&name=Tampa%20Bay` | Any other coast: a rectangle (west, south, east, north) and a name |

### Watching another coast
On the Map, press **Choose area**, drag a rectangle over the coast (mouse or finger), give it a name if you like, and press **Use this area**. The link updates, so you can bookmark it or share it.

Coastal Watch then finds every Station in that rectangle from each agency's own public list:
- Each NOAA tide gauge anchors a Coastal area named after it.
- Each river gauge joins the area of its closest tide gauge, or gets its own area if every tide gauge is more than 40 miles away.
- Each buoy joins its closest tide gauge's area. An area with no buoy of its own shows the closest one within 100 miles, marked "nearby".

Oregon is different: its eight Coastal areas ("Columbia River mouth" to "Port Orford / Gold Beach") are hand-named in an **Area definition** ([`data/areas/oregon.json`](data/areas/oregon.json) with [`data/sensors.csv`](data/sensors.csv)), so they match how OR-Alert talks about the coast. Another state can add its own the same way.

### Data for your own map
For GIS staff, [**Data for your own map**](https://jdlee77.github.io/coastal-watch/feeds.html) (linked in the Board's footer) gives:
- the Oregon **Station layer** as GeoJSON and CSV at fixed addresses, with steps for adding it to ArcGIS Online: every Station with its location, Coastal area, and links to its agency page and live data;
- links to NOAA's own ArcGIS services for river gauges, tide gauges and NDBC buoys.

For any other area, **Download these Stations** in the Board's footer saves the Stations on screen as GeoJSON or CSV.

## Where the data comes from

| What | Network | Agency | How Coastal Watch reads it |
|---|---|---|---|
| Water level, Surge, next high tide | Tide gauges (CO-OPS) | NOAA | Directly from the browser |
| River stage, flood levels, forecast crests | River gauges | NWS (National Water Prediction Service); most measured by USGS | Directly from the browser |
| Nearshore and offshore waves | Waverider buoys (CDIP) | Scripps | Directly from the browser |
| Offshore waves | Moored buoys (NDBC) | NOAA | Collected about every 10 minutes by a scheduled job, because NDBC does not let web pages read its files directly |

**Surge** is how far the measured water level is above or below the predicted tide at that moment.

## What it does not cover
- **Wave flood levels:** waves have no published flood levels yet, so buoys show heights without a color.
- **Great Lakes, and tide gauges with no tidal datum:** they have no tide prediction or MLLW reading, so they are left out, with a note saying how many. River gauges and buoys there still show.
- **River gauges that only USGS tracks:** they have no published flood levels, so they are not shown.
- **Small Oregon estuaries** (Nehalem, Siletz, Coquille) have no live water-level gauge, only tide predictions.
- **Other hazards** (earthquake, tsunami sensors, currents) are out of scope; see [ADR 0001](docs/adr/0001-v1-scope-compound-flooding.md). The wider research list of Oregon sensors is in [`docs/sensor-inventory.md`](docs/sensor-inventory.md).

## How it is built

For whoever maintains it:

- **One page, no server.** [`index.html`](index.html) is the page; [`feeds.html`](feeds.html) is the data page. [`coastal-areas.js`](coastal-areas.js) groups an area's Stations into Coastal areas (the 40-mile and 100-mile rules, coast order, or an Area definition's own grouping) and is loaded by the page. The only library is [Leaflet](https://leafletjs.com/) for the Map, stored in `vendor/`.
- **Publishing.** [`.github/workflows/publish.yml`](.github/workflows/publish.yml) publishes the site to GitHub Pages on every change to `main`, and on a schedule about every 10 minutes to refresh buoy data ([ADR 0002](docs/adr/0002-github-pages-with-scheduled-buoy-collection.md)). Each run:
  - collects NDBC wave data with [`scripts/fetch_waves.py`](scripts/fetch_waves.py), keeping each buoy's last wave Reading between its wave reports;
  - builds the Oregon Station layer with [`scripts/build_station_layer.py`](scripts/build_station_layer.py).

  GitHub sometimes delays or skips scheduled runs. When that happens, buoy Readings turn Stale and then Offline on the page instead of passing old data off as current.
- **Tests.** GitHub runs them on every change. Locally, `npm test` runs:
  - fast tests of the Coastal area grouping rules ([`tests/coastal-areas.unit.js`](tests/coastal-areas.unit.js)), with made-up Stations and no browser;
  - then opens the page in a headless browser and checks what a watch officer would see: the Layouts, the Map, the links between them, the flood-level rules, data age, finding Stations for other coasts, and the data page. Every outside request is answered from saved real responses in [`tests/fixtures/`](tests/fixtures/), with the clock frozen at the moment they were recorded, so results never depend on live conditions. To record new ones, see [`tests/record-fixtures.js`](tests/record-fixtures.js).
  - `python3 -m unittest discover -s tests -p "test_*.py"` checks the two Python scripts.

### Further reading
- [`CONTEXT.md`](CONTEXT.md): the words used on the page and in the code (Station, Reading, Threshold, Coastal area, Silent Station…), each with one meaning.
- [`docs/adr/`](docs/adr/): the decisions behind the design and why they were made.
- [`docs/research/nationwide-discovery.md`](docs/research/nationwide-discovery.md): how each agency's feed can be searched by area, and its gaps outside Oregon.
- [NANOOS Visualization System](https://nvs.nanoos.org): the regional ocean-observing portal for the Pacific Northwest, a broader view of many of the same sensors.
