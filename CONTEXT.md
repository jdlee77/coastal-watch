# Coastal Watch

A shared, real-time picture of coastal flooding conditions on the Oregon coast for ESF-2, the OEC3 watch floor and OR-Alert decision makers.

## Hazards

**Compound flooding**:
Flooding driven by several factors arriving together: high river flow, high tide, storm surge and large waves. This is the hazard Coastal Watch exists to show.
_Avoid_: Coastal flooding (too broad), inundation (used loosely for any high water)

**Surge**:
How far a tide gauge's observed water level is above or below the predicted tide at that moment.
_Avoid_: Storm tide (that is the total water level, not the difference), anomaly, residual

## Places

**Area of responsibility**:
The whole stretch of coast one viewer has chosen to watch, such as one state's coast or one NWS office's coast. Every Station inside it is shown; the Coastal areas divide it up.
_Avoid_: Area of concern, region, coverage, extent

**Coastal area**:
A stretch of coast, ordered north to south, that groups the Stations relevant to one community's flood risk: its tide gauge, its rivers and its nearest wave buoys. A Station may serve neighbouring Coastal areas.
_Avoid_: Basin, zone, region, sector

**Nearby Station**:
A Station shown in a Coastal area it does not sit in, because that area has none of its own of that kind (for example a buoy off Newport shown for Florence).
_Avoid_: Shared station, borrowed station

**Area status**:
The overall condition of a Coastal area: the worst Threshold level reached by its own Fresh or Stale Readings (Nearby Stations do not count), marked stale when only Stale Readings reached it. An area with no Fresh Reading that has a Threshold, and nothing above Threshold, has the status "no current data", never "normal".
_Avoid_: Area color, area alert, area level

## Measurement

**Station**:
One fixed measuring site, identified by the operator that does the measuring, such as the Garibaldi tide gauge or NDBC buoy 46050. An agency that only publishes Thresholds or Forecasts for a site (for example NWS for a USGS river gage) does not make it a second Station.
_Avoid_: Sensor, gauge, gage, buoy, site (as the general term; "buoy" and "tide gauge" are kinds of Station)

**Reading**:
One measured value from a Station at one point in time, such as "water level 9.2 ft at 14:06".
_Avoid_: Observation, measurement, data point

**Forecast**:
A predicted value for a Station at a future time, such as the next high tide or an NWS river crest. Always kept distinct from a Reading.
_Avoid_: Prediction, outlook, projection

**Threshold**:
A published level that, when a Reading passes it, marks a condition worth attention (for example an NWS flood stage). Coastal Watch uses the operators' published levels and does not invent its own; a Station with no published level has no Threshold.
_Avoid_: Limit, alarm level, trigger

**Threshold source**:
The agency whose published level a Threshold is. **NWS** levels are set by the local NWS forecast office and drive its advisories and warnings; **NOAA** levels are derived by NOAA's National Ocean Service from one national formula. A tide gauge can have both; a Reading is shown against every source it has.
_Avoid_: Flood level type, threshold provider

**Sources differ**:
A Reading that two Threshold sources put at different Threshold levels. The higher level is shown, named with its source, so the analyst can confirm with the forecast office which one it is working from.
_Avoid_: Conflict, mismatch, disagreement

**Threshold level**:
One of the four NWS steps a Threshold can mark, in rising order: action, minor, moderate, major. Tide-gauge flood levels use only minor, moderate and major.
_Avoid_: Severity, alert level, warning level

## Data age

**Fresh**:
A Reading no older than twice its network's usual reporting interval.

**Stale**:
A Reading older than twice its network's usual reporting interval but no more than 24 hours old.
_Avoid_: Late, delayed

**Offline**:
A Station whose latest Reading is more than 24 hours old.
_Avoid_: Down, dead, out of service

## Views

**Layout**:
How the watch picture is arranged on a screen: Board, Map or Split. A screen shows one Layout at a time.
_Avoid_: Mode (Compact is a mode of the Board), view type, page

**Board**:
The Layout that lists Coastal areas north to south, each with its Stations, Readings, Thresholds and Forecasts.
_Avoid_: Chart (means a nautical chart or a hydrograph), dashboard, list, table

**Map**:
The Layout that places every Station once at its real location, shaped by kind and colored by Threshold level, with Coastal areas labeled along the coast.
_Avoid_: Chart, GIS view

**Split**:
The Layout that shows the Map and the Board side by side on one screen, built for the watch-floor video wall; selecting a Station in one half points to it in the other.
_Avoid_: Wall mode, dual view

**Compact**:
A mode of the Board that shows one line per Coastal area, worst Area status first, with only its most urgent Reading.
_Avoid_: Mobile mode, summary view
