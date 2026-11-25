"""Collect the latest wave Reading from every NDBC station in the country.

NDBC does not allow web pages to read its files directly, so GitHub
Actions runs this script on a schedule and publishes the result as
waves.json next to the page. See docs/adr/0002. CDIP buoys are not
collected: the page reads CDIP's data server itself.

Source: NDBC's national latest-observations file (one row per station,
its most recent report). Names come from NDBC's active station list.

A buoy sends weather reports more often than wave reports, so its latest
row often has no wave height. When that happens, the station's previous
wave Reading is kept from the last published file, so the page shows it
ageing (Stale, then Offline) instead of the buoy disappearing. Readings
more than 3 days old are dropped.

Usage: python3 scripts/fetch_waves.py out/waves.json [previous/waves.json]
Standard library only.
"""

import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

LATEST_OBS = "https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt"
ACTIVE_STATIONS = "https://www.ndbc.noaa.gov/activestations.xml"
M_TO_FT = 3.28084
KEEP = timedelta(days=3)
UA = {"User-Agent": "coastal-watch/1.0 (public dashboard)"}


def get(url, timeout=60):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def num(s):
    """A number, or None for NDBC's missing-value mark "MM"."""
    try:
        return None if s in ("MM", "") else float(s)
    except ValueError:
        return None


def iso(t):
    return t.isoformat().replace("+00:00", "Z")


def station_names(xml_text):
    """NDBC ID -> station name, from activestations.xml."""
    return {s.get("id").upper(): s.get("name", "") for s in ET.fromstring(xml_text).iter("station") if s.get("id")}


def collect(latest_obs, names=None, previous=None, now=None):
    """Build the published file from the text of latest_obs.txt.

    names: NDBC ID -> name. previous: the last published file (dict), or None.
    """
    names = names or {}
    now = now or datetime.now(timezone.utc)
    lines = latest_obs.splitlines()
    head = lines[0].lstrip("#").split()
    stations = {}
    for line in lines[1:]:
        if line.startswith("#") or not line.strip():
            continue
        row = dict(zip(head, line.split()))
        hs = num(row.get("WVHT", "MM"))
        if hs is None:
            continue
        try:
            t = datetime(int(row["YYYY"]), int(row["MM"]), int(row["DD"]),
                         int(row["hh"]), int(row["mm"]), tzinfo=timezone.utc)
            lat, lon = float(row["LAT"]), float(row["LON"])
        except (KeyError, ValueError):
            continue
        sid = row["STN"].upper()
        stations["NDBC:" + sid] = {
            "name": names.get(sid, ""),
            "lat": lat,
            "lon": lon,
            "reading": {
                "time": iso(t),
                "height_ft": round(hs * M_TO_FT, 1),
                "period_s": num(row.get("DPD", "MM")) or None,  # some stations send 0 for no period
                "direction_deg": num(row.get("MWD", "MM")),
            },
        }
    # Keep an earlier wave Reading when the latest report has none.
    for key, old in ((previous or {}).get("stations") or {}).items():
        r = old.get("reading") if isinstance(old, dict) else None
        if key in stations or not r or old.get("lat") is None:
            continue
        try:
            t = datetime.fromisoformat(r["time"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            continue
        if now - t <= KEEP:
            stations[key] = old
    return {"collected": iso(now), "source": LATEST_OBS, "stations": stations}


def main(out_path, previous_path=None):
    previous = None
    if previous_path:
        try:
            with open(previous_path) as f:
                previous = json.load(f)
        except (OSError, ValueError) as e:  # first run, or the site is not published yet
            print("no previous file:", e, file=sys.stderr)
    try:
        names = station_names(get(ACTIVE_STATIONS))
    except Exception as e:  # names are a convenience; Readings still publish
        print("no station names:", e, file=sys.stderr)
        names = {}
    out = collect(get(LATEST_OBS), names, previous)
    with open(out_path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"{len(out['stations'])} wave stations", file=sys.stderr)


if __name__ == "__main__":
    main(*sys.argv[1:3])
