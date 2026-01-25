Step 2
What: Routed UI through AppShell to enforce dashboard architecture.

Why: Keep entry component clean; enable modular map/charts/controls.

How: App.tsx → AppShell.tsx + Leaflet CSS import in main.tsx.

Step 4 — Add core types + simulate campus activity (tours + sensors)

What we’re doing

We’re defining the full spatiotemporal schema and generating synthetic but realistic campus activity:

Tours: moving trajectories with stops at POIs

Sensor events: time-series counts near buildings (wifi/gate/ble style)

Why we’re doing it

You can’t do anomaly detection without time-series + trajectories.

A clear schema makes your project read like a serious prototype.

Simulation lets you create repeatable “ground truth” anomalies for the demo.


Step 5 — Add spatiotemporal overlays to CampusMap
What we’re doing

We will extend CampusMap to render:

Tour trajectories (polylines)

Sensors (circle markers)

Injected spike windows (temporary “anomaly markers”)

Why we’re doing it

Turns simulation into something interpretable.

Makes anomaly detection “real” (you can point to spikes on the map).

Sets up Step 6: actual anomaly scoring + dashboard filters.

Step 7 — Build the Controls panel (filters + Top Anomalies list)
What: Added visibility toggles, sensitivity slider, and a ranked anomaly feed.
Why: Attention management. Allows for rapid investigation of anomalies by clicking them to pan the map.

Step 8 — Interactive Time-Series Charts
What we’re doing:
- Integrate a charting library (like Recharts).
- Show the 6-hour trend for a sensor when selected.
- Highlight anomaly points on the chart.
Why we’re doing it:
- Maps show "Where", charts show "When" and "How much".
- Essential for verifying if an anomaly is a genuine spike or just noise.
