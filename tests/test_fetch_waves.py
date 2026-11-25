"""The wave collection job, fed a saved copy of NDBC's national latest-observations file
(tests/fixtures/ndbc-latest_obs.txt, recorded 25 Nov 2026 21:56 UTC).

Run: python3 -m unittest discover -s tests -p "test_*.py"
"""
import os
import sys
import unittest
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))
from fetch_waves import collect, station_names  # noqa: E402

with open(os.path.join(HERE, "fixtures", "ndbc-latest_obs.txt")) as f:
    LATEST = f.read()
NOW = datetime(2026, 11, 25, 21, 56, tzinfo=timezone.utc)


class Collect(unittest.TestCase):
    def setUp(self):
        self.out = collect(LATEST, now=NOW)["stations"]

    def test_keeps_every_station_with_a_wave_height(self):
        self.assertEqual(len(self.out), 173)
        self.assertIn("NDBC:41070", self.out)  # Ponce de Leon Inlet, FL
        self.assertIn("NDBC:46050", self.out)  # Stonewall Bank, OR

    def test_leaves_out_stations_whose_latest_report_has_no_wave_height(self):
        self.assertNotIn("NDBC:46029", self.out)  # weather-only report at 21:30
        self.assertNotIn("NDBC:15001", self.out)

    def test_reading_has_location_time_feet_period_and_direction(self):
        s = self.out["NDBC:41070"]
        self.assertEqual((s["lat"], s["lon"]), (29.289, -80.803))
        self.assertEqual(s["reading"], {"time": "2026-11-25T21:25:00Z", "height_ft": 7.5,  # 2.3 m
                                        "period_s": 11.0, "direction_deg": 64.0})

    def test_missing_values_become_null(self):
        r = self.out["NDBC:22101"]["reading"]  # period 0 and direction MM
        self.assertEqual(r["height_ft"], 3.3)
        self.assertIsNone(r["period_s"])
        self.assertIsNone(r["direction_deg"])

    def test_names_are_added_when_known(self):
        out = collect(LATEST, names={"41070": "Ponce de Leon Inlet Waves (PNCWAVE)"}, now=NOW)["stations"]
        self.assertEqual(out["NDBC:41070"]["name"], "Ponce de Leon Inlet Waves (PNCWAVE)")
        self.assertEqual(out["NDBC:41117"]["name"], "")

    def test_station_names_from_the_active_station_list(self):
        xml = '<stations><station id="41070" name="Ponce de Leon Inlet Waves (PNCWAVE)"/><station id="46029"/></stations>'
        self.assertEqual(station_names(xml), {"41070": "Ponce de Leon Inlet Waves (PNCWAVE)", "46029": ""})


class CarryForward(unittest.TestCase):
    """A buoy's latest report often has no wave height; its previous wave Reading is kept."""

    def previous(self, time):
        return {"stations": {"NDBC:46029": {"lat": 46.148, "lon": -124.508, "reading": {
            "time": time, "height_ft": 16.7, "period_s": 16.0, "direction_deg": 245.0}}}}

    def test_keeps_the_previous_reading_when_the_latest_report_has_none(self):
        out = collect(LATEST, previous=self.previous("2026-11-25T20:50:00Z"), now=NOW)["stations"]
        self.assertEqual(out["NDBC:46029"]["reading"]["time"], "2026-11-25T20:50:00Z")

    def test_drops_a_previous_reading_more_than_3_days_old(self):
        out = collect(LATEST, previous=self.previous("2026-11-22T20:00:00Z"), now=NOW)["stations"]
        self.assertNotIn("NDBC:46029", out)

    def test_a_new_reading_replaces_the_previous_one(self):
        prev = self.previous("2026-11-25T20:50:00Z")
        prev["stations"]["NDBC:46050"] = prev["stations"].pop("NDBC:46029")
        out = collect(LATEST, previous=prev, now=NOW)["stations"]
        self.assertEqual(out["NDBC:46050"]["reading"]["time"], "2026-11-25T21:20:00Z")


if __name__ == "__main__":
    unittest.main()
