# Stations are found automatically; the operator's catalog is the check

Until now, every Station was confirmed by hand against its operator before it could appear (the `verified` column of `data/sensors.csv`, and the matching rule in CLAUDE.md). For any Area of responsibility, Stations are now found automatically from each operator's own public station list, and a Station counts as genuine if the operator lists it. We chose this because the hand check mostly confirmed what the operator's list already says (ID, location, still running), and it cannot be done for an area someone picks on the spot. A Station that is listed but silent is not hidden; it shows as Stale or Offline under the existing Data age rules, which is the safeguard the hand check was standing in for.

## Considered options

- **Show discovered Stations marked "unreviewed"** until someone confirms them: rejected, because every Station in a new area would carry the mark, and it would become noise that people learn to ignore.
- **Hand-approved only**: rejected, because it does not scale beyond the areas someone has curated.

## Consequences

- The station-checking rule in CLAUDE.md must be rewritten when this is built.
- The same buoy can appear in both NDBC and CDIP lists under different IDs (about 51 do). It must be shown once.
- Operators' lists include stations that have been silent for days or months. These show as Offline, so an area may show more grey markers than Oregon does today.
