"""Collect the latest wave Reading from every NDBC wave buoy in the station list.

NDBC does not allow web pages to read its files directly, so GitHub
Actions runs this script on a schedule and publishes the result as
waves.json next to the page. See docs/adr/0002. CDIP buoys are not
collected: the page reads CDIP's data server itself.

Usage: python3 scripts/fetch_waves.py data/sensors.csv out/waves.json
Standard library only.
"""

import csv
import json
import sys
import urllib.request
from datetime import datetime, timezone

M_TO_FT = 3.28084
UA = {"User-Agent": "coastal-watch/1.0 (public dashboard)"}


def get(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def num(s):
    try:
        return None if s in ("MM", "") else float(s)
    except ValueError:
        return None


def ndbc(station_id):
    """Most recent row with a wave height. Older rows are used if the latest
    has none, so a broken wave sensor shows up as an old (Stale/Offline) Reading."""
    lines = get(f"https://www.ndbc.noaa.gov/data/realtime2/{station_id}.txt").splitlines()
    head = lines[0].lstrip("#").split()
    for line in lines[2:]:
        row = dict(zip(head, line.split()))
        hs = num(row.get("WVHT", "MM"))
        if hs is None:
            continue
        t = datetime(int(row["YY"]), int(row["MM"]), int(row["DD"]),
                     int(row["hh"]), int(row["mm"]), tzinfo=timezone.utc)
        return {
            "time": t.isoformat().replace("+00:00", "Z"),
            "height_ft": round(hs * M_TO_FT, 1),
            "period_s": num(row.get("DPD", "MM")),
            "direction_deg": num(row.get("MWD", "MM")),
        }
    return None


def main(sensors_csv, out_path):
    out = {"collected": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"), "stations": {}}
    with open(sensors_csv, newline="") as f:
        rows = [r for r in csv.DictReader(f) if r["kind"] == "wave_buoy" and r["network"] == "NDBC"]
    for r in rows:
        key = f'{r["network"]}:{r["station_id"]}'
        try:
            reading = ndbc(r["station_id"])
            out["stations"][key] = {"reading": reading}
        except Exception as e:  # one bad buoy must not stop the rest
            out["stations"][key] = {"reading": None, "error": f"{type(e).__name__}: {e}"}
        print(key, out["stations"][key], file=sys.stderr)
    with open(out_path, "w") as f:
        json.dump(out, f, indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
