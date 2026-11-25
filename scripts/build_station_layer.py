"""Build the Station layer for an Area definition (CONTEXT.md, "Station layer").

Writes <area>.geojson and <area>.csv: every Station in the Area definition, with
its operator, IDs, name, kind, location, Coastal area and links to its operator's
page and live data. No Readings. The publish job runs this, so the files always
follow the station list.

The page's "Download these Stations" link builds the same fields in the browser
(stationLayerRows in index.html); a test checks the two agree for Oregon.

Usage: python3 scripts/build_station_layer.py data/areas/oregon.json out/dir
Standard library only.
"""

import csv
import io
import json
import os
import sys

KIND = {"tide_gauge": "tide gauge", "river_gage": "river gauge", "wave_buoy": "wave buoy"}
FIELDS = ["operator", "network", "station_id", "nws_id", "name", "kind", "coastal_area",
          "latitude", "longitude", "station_page", "nws_page", "data_url"]


def links(network, station_id, nws_id, kind):
    """(station_page, nws_page, data_url) for one Station.

    station_page: the operator's page for a person. nws_page: the NWS gauge page
    (river gauges only, where NWS publishes flood stages and forecasts).
    data_url: the address of the live Readings, for a program.
    """
    sid, nws = station_id, nws_id
    nws_page = f"https://water.noaa.gov/gauges/{nws}" if kind == "river_gage" and nws else ""
    if network == "CO-OPS":
        return (f"https://tidesandcurrents.noaa.gov/stationhome.html?id={sid}", nws_page,
                "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_level&date=latest"
                f"&datum=MLLW&units=english&time_zone=gmt&format=json&station={sid}")
    if network == "USGS":
        return (f"https://waterdata.usgs.gov/monitoring-location/USGS-{sid}/", nws_page,
                f"https://api.water.noaa.gov/nwps/v1/gauges/{nws}/stageflow/observed" if nws else "")
    if network == "NWPS":
        return (f"https://water.noaa.gov/gauges/{sid}", nws_page,
                f"https://api.water.noaa.gov/nwps/v1/gauges/{sid}/stageflow/observed")
    if network == "NDBC":
        return (f"https://www.ndbc.noaa.gov/station_page.php?station={sid}", "",
                f"https://www.ndbc.noaa.gov/data/realtime2/{sid}.txt")
    if network == "CDIP":
        return (f"https://cdip.ucsd.edu/m/products/?stn={sid}p1", "",
                f"https://thredds.cdip.ucsd.edu/thredds/dodsC/cdip/realtime/{sid}p1_rt.nc.html")
    return ("", nws_page, "")


def rows_for(area_definition_path):
    """One dict per Station, in the station list's order."""
    with open(area_definition_path) as f:
        area = json.load(f)
    stations_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(area_definition_path))),
                                 os.path.relpath(area["stations"], "data"))
    with open(stations_path, newline="") as f:
        stations = list(csv.DictReader(f))
    rows = []
    for s in stations:
        page, nws_page, data = links(s["network"], s["station_id"], s.get("nws_id", ""), s["kind"])
        rows.append({
            "operator": s["operator"], "network": s["network"], "station_id": s["station_id"],
            "nws_id": s.get("nws_id", ""), "name": s["name"], "kind": KIND.get(s["kind"], s["kind"]),
            "coastal_area": s["area"], "latitude": float(s["lat"]), "longitude": float(s["lon"]),
            "station_page": page, "nws_page": nws_page, "data_url": data,
        })
    return area, rows


def geojson(area, rows):
    return {
        "type": "FeatureCollection",
        "name": f"{area['name']} Stations",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [r["longitude"], r["latitude"]]},
            "properties": {k: r[k] for k in FIELDS if k not in ("latitude", "longitude")},
        } for r in rows],
    }


def csv_text(rows):
    out = io.StringIO()
    w = csv.DictWriter(out, fieldnames=FIELDS, lineterminator="\n")
    w.writeheader()
    w.writerows(rows)
    return out.getvalue()


def main(area_definition_path, out_dir):
    area, rows = rows_for(area_definition_path)
    stem = os.path.splitext(os.path.basename(area_definition_path))[0]
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, stem + ".geojson"), "w") as f:
        json.dump(geojson(area, rows), f, indent=1)
    with open(os.path.join(out_dir, stem + ".csv"), "w", newline="") as f:
        f.write(csv_text(rows))
    print(f"{stem}: {len(rows)} Stations", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
