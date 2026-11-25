# Public GitHub Pages site, with buoy readings collected on a schedule

Coastal Watch is a single page published on GitHub Pages; there is no server of our own. The page reads tide gauges (NOAA CO-OPS) and rivers (NWS NWPS) directly from the viewer's browser, because those services allow it. NOAA NDBC does not allow web pages to read its buoy files, so a GitHub Actions job (`.github/workflows/publish.yml`) runs every 10 minutes, collects the latest wave Reading from each NDBC and CDIP buoy into `waves.json`, and republishes the site. We chose this over running a relay server because it needs no hosting, no credentials and no maintenance, and all the data is public.

## Consequences

- Buoy readings can be up to about 10 minutes behind NDBC, plus GitHub's scheduling delays (often 5 to 20 minutes at busy times). Each Reading carries its own time, so a delay shows up as Stale, not as wrong data.
- GitHub pauses scheduled jobs in a repository with no commits for 60 days. If that happens, wave buoys will turn Stale and then Offline on the page; re-enable the workflow from the repository's Actions tab.
- If GitHub Actions is unavailable, tide gauges and rivers keep working because the browser fetches them directly.

## Update, 25 November 2026

For the any-state version (ADR 0003), the scheduled job collects NDBC's single national "latest readings" file instead of a fixed list of buoys. CDIP buoys are no longer collected: the research (docs/research/nationwide-discovery.md) found that CDIP's data server allows the page to read it directly. A buoy listed by both networks is shown once, using CDIP's own data.
