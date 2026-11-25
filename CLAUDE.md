# Coastal Watch: notes for Claude Code

## Who this is for
Jon Lee, Oregon Statewide Interoperability Coordinator (ODEM). He is not a software developer: explain processes and terms in plain language, and keep tooling simple.

## What we are building
A watch-floor view of Oregon coastal hazards (inundation, surge, waves, coastal river flooding, tsunami) built from public real-time feeds. Users: ESF-2, the OEC3 watch floor, and OR-Alert decision makers.

## Ground rules
- Stations come from each operator's own public station list (ADR 0004): a Station counts as genuine if its operator lists it. Never hard-code a station ID in the page logic. An Area definition (for Oregon, `data/areas/oregon.json` with `data/sensors.csv`) only groups and names Stations; check any ID you add to one against the operator's list.
- Public feeds only (NOAA CO-OPS, NDBC, CDIP, USGS, NWS NWPS). No credentials in the repo.
- Show data age on every reading. A stale gauge must look stale.
- Prefer a single self-contained page or small app over a heavy framework.

## Key files
- `README.md`: overview
- `docs/sensor-inventory.md`: research notes by hazard
- `data/sensors.csv`: the Oregon coast's station list, grouped into named Coastal areas
- `data/areas/`: Area definitions
- `docs/research/nationwide-discovery.md`: how each feed finds Stations by area
