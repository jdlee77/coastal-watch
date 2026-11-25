"""The Station layer builder, run on the real Oregon Area definition.

Run: python3 -m unittest discover -s tests -p "test_*.py"
"""
import csv
import io
import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from build_station_layer import FIELDS, main  # noqa: E402

OREGON = os.path.join(ROOT, "data", "areas", "oregon.json")


class OregonStationLayer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.mkdtemp()
        main(OREGON, cls.dir)
        with open(os.path.join(cls.dir, "oregon.geojson")) as f:
            cls.gj = json.load(f)
        with open(os.path.join(cls.dir, "oregon.csv"), newline="") as f:
            cls.rows = list(csv.DictReader(f))
        with open(os.path.join(ROOT, "data", "sensors.csv"), newline="") as f:
            cls.sensors = list(csv.DictReader(f))

    def test_every_station_in_the_station_list_once(self):
        self.assertEqual(len(self.gj["features"]), len(self.sensors))
        self.assertEqual(len(self.rows), len(self.sensors))
        keys = {(r["network"], r["station_id"]) for r in self.rows}
        self.assertEqual(keys, {(s["network"], s["station_id"]) for s in self.sensors})

    def test_geojson_points_are_longitude_then_latitude(self):
        f = next(f for f in self.gj["features"] if f["properties"]["station_id"] == "9437540")  # Garibaldi
        self.assertEqual(f["geometry"], {"type": "Point", "coordinates": [-123.9189, 45.5545]})
        self.assertEqual(f["properties"]["coastal_area"], "Tillamook Bay")
        self.assertEqual(f["properties"]["kind"], "tide gauge")

    def test_csv_has_the_agreed_columns_and_no_readings(self):
        self.assertEqual(list(self.rows[0].keys()), FIELDS)
        for col in ("value", "level", "reading", "time"):
            self.assertNotIn(col, FIELDS)

    def test_links_per_network(self):
        by = {(r["network"], r["station_id"]): r for r in self.rows}
        river = by[("USGS", "14301500")]  # Wilson River near Tillamook, NWS TLMO3
        self.assertEqual(river["station_page"], "https://waterdata.usgs.gov/monitoring-location/USGS-14301500/")
        self.assertEqual(river["nws_page"], "https://water.noaa.gov/gauges/TLMO3")
        self.assertEqual(river["data_url"], "https://api.water.noaa.gov/nwps/v1/gauges/TLMO3/stageflow/observed")
        self.assertEqual(by[("NDBC", "46050")]["data_url"], "https://www.ndbc.noaa.gov/data/realtime2/46050.txt")
        self.assertEqual(by[("CDIP", "162")]["station_page"], "https://cdip.ucsd.edu/m/products/?stn=162p1")
        self.assertTrue(by[("CO-OPS", "9437540")]["data_url"].endswith("&station=9437540"))
        self.assertEqual(by[("CO-OPS", "9437540")]["nws_page"], "")  # NWS pages only for river gauges

    def test_every_station_has_a_station_page_and_a_data_url(self):
        for r in self.rows:
            self.assertTrue(r["station_page"].startswith("https://"), r["name"])
            self.assertTrue(r["data_url"].startswith("https://"), r["name"])


if __name__ == "__main__":
    unittest.main()
