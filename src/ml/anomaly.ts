/* Copyright @ Leroy 2026. All rights reserved. */
import type { Anomaly, SensorEvent } from "../types";

function mean(xs: number[]) {
    return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
}

function std(xs: number[]) {
    const m = mean(xs);
    const v = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / Math.max(1, xs.length);
    return Math.sqrt(v);
}

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

export function detectSensorSpikeAnomalies(events: SensorEvent[], zThreshold = 3.0): Anomaly[] {
    // group by sensorId
    const bySensor = new Map<string, SensorEvent[]>();
    for (const e of events) {
        if (!bySensor.has(e.sensorId)) bySensor.set(e.sensorId, []);
        bySensor.get(e.sensorId)!.push(e);
    }

    const anomalies: Anomaly[] = [];

    for (const [sensorId, es] of bySensor.entries()) {
        // sort by time
        es.sort((a, b) => a.ts - b.ts);

        const values = es.map((x) => x.value);
        const m = mean(values);
        const s = std(values) || 1e-6;

        for (const e of es) {
            const z = (e.value - m) / s;

            if (z >= zThreshold) {
                // Score scaled into 0..1 for visualization
                const score = clamp01((z - zThreshold) / 5);

                anomalies.push({
                    id: `anom-${sensorId}-${e.ts}`,
                    kind: "SENSOR_SPIKE",
                    ts: e.ts,
                    lat: e.lat,
                    lng: e.lng,
                    score,
                    refId: e.id,
                    why: [
                        `sensor=${sensorId}`,
                        `value=${e.value}`,
                        `mean≈${m.toFixed(1)}`,
                        `std≈${s.toFixed(1)}`,
                        `z≈${z.toFixed(2)}`,
                    ],
                });
            }
        }
    }

    // sort by highest score first
    anomalies.sort((a, b) => b.score - a.score);
    return anomalies;
}
