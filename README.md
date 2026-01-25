## Methods (Anomaly Detection)

This prototype treats campus monitoring as a spatiotemporal anomaly detection problem.

### 1) Sensor Spike Detection (Statistical Outliers)
For each sensor, we model normal behavior using its empirical mean and standard deviation over the simulated window.
We flag events with z-score ≥ threshold:
z = (x - μ) / σ
These spikes are visualized on the map and in the sensor time-series, enabling interpretability (value vs baseline).

### 2) Spatial Hotspots (Density-based)
We discretize the campus into a uniform grid and count trajectory points per cell.
Cells with unusually high density are flagged as HOTSPOT anomalies and rendered as geo-markers.

### 3) Route Deviation (Trajectory Outliers)
We compute a simple trajectory length score per tour (sum of segment distances).
Tours with unusually large lengths are flagged as ROUTE_DEVIATION anomalies and visualized for investigation.

## Sensor Deployment Assumptions
Sensors are anchored at real campus POIs (gate, library, academic block, cafeteria, hostel, admin),
with small positional jitter (≈5–10m) to reflect realistic installation variance.
All signals are simulated locally; no real tracking data is used.

## Limitations
- Detection uses simple baselines (z-score, grid density, path length) rather than learned models.
- The simulator approximates mobility and counts; real deployments require calibration and privacy-aware data handling.
- Coordinate accuracy depends on POI placement and basemap alignment.

## Run
```bash
npm install
npm run dev
```

---
**Copyright @ Leroy 2026. All rights reserved.**
