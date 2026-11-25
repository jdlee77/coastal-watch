# Coastal Watch: notes for Claude Code

## Who this is for
Jon Lee, Oregon Statewide Interoperability Coordinator (ODEM). He is not a software developer: explain processes and terms in plain language, and keep tooling simple.

## What we are building
A watch-floor view of Oregon coastal hazards (inundation, surge, waves, coastal river flooding, tsunami) built from public real-time feeds. Users: ESF-2, the OEC3 watch floor, and OR-Alert decision makers.

## Ground rules
- Before using a station ID in code, check it against `data/sensors.csv`. Rows with `verified=no` must be confirmed against the operator's site first.
- Public feeds only (NOAA CO-OPS, NDBC, CDIP, USGS, NWS NWPS). No credentials in the repo.
- Show data age on every reading. A stale gauge must look stale.
- Prefer a single self-contained page or small app over a heavy framework.

## Key files
- `README.md`: overview
- `docs/sensor-inventory.md`: research notes by hazard
- `data/sensors.csv`: station list
