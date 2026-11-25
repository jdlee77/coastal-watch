# One shared site for any Area of responsibility, chosen in the link

Coastal Watch becomes one shared public site that anyone can point at their own Area of responsibility, rather than a template that each state or agency copies and runs itself. The viewer draws a rectangle on the map, and the rectangle is saved in the page's link, so a bookmark or a video-wall address always opens the same area. We chose this because a copy per agency means each one has to manage its own GitHub setup, and every fix has to be repeated in every copy. The obstacle to a shared site was the buoy collection job, which today runs over a fixed Oregon list. NDBC, however, publishes one national file of the latest reading from every station, so a single job can collect buoys for the whole country (see docs/research/nationwide-discovery.md).

## Considered options

- **Template per agency**: rejected. It is more work for each adopter and forks drift apart.
- **Pick a state or NWS office from a list**: deferred. The boundary data could not be verified yet. Presets can be added later as shortcuts that fill in a rectangle.

## Consequences

- Tide gauges without a tidal datum are out of scope for now: the Great Lakes, plus about 12 Gulf and Puerto Rico stations. They have no MLLW datum and no tide prediction, and therefore no Surge. They are left off with a visible note. River gauges and buoys in those places still show.
