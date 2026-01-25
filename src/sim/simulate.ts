/* Copyright @ Leroy 2026. All rights reserved. */
import type { POI, Tour, SensorEvent } from "../types";

function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randn(rng: () => number) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(x: number, a: number, b: number) {
    return Math.max(a, Math.min(b, x));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function pick<T>(rng: () => number, arr: T[]) {
    return arr[Math.floor(rng() * arr.length)];
}

function jitterLatLng(rng: () => number, lat: number, lng: number, meters: number) {
    // rough conversion: 1e-5 deg ~ 1.11m lat; lng depends on latitude but ok for small jitter
    const deg = meters / 111_000;
    return {
        lat: lat + randn(rng) * deg,
        lng: lng + randn(rng) * deg,
    };
}

function dailyWave01(ts: number) {
    // returns 0..1 based on time-of-day
    const d = new Date(ts);
    const h = d.getHours() + d.getMinutes() / 60;
    // simple: low night, high midday
    const peak = Math.exp(-Math.pow((h - 13) / 3.5, 2)); // gaussian around 1pm
    const morning = Math.exp(-Math.pow((h - 9) / 2.2, 2));
    const evening = Math.exp(-Math.pow((h - 18) / 2.5, 2));
    const mix = 0.6 * peak + 0.25 * morning + 0.15 * evening;
    return clamp(mix, 0, 1);
}

export function simulateData(params: {
    seed: number;
    startTs: number;
    hours: number;
    tourCount: number;
    pois: POI[];
}) {
    const { seed, startTs, hours, tourCount, pois } = params;
    const rng = mulberry32(seed);
    const endTs = startTs + hours * 3600_000;

    // 1) Create anchored sensors at intentional POIs
    const configs = [
        { sensorId: "s_gate_main", poiId: "b1", kind: "gate_count" as const, label: "Main Entrance Gate" },
        { sensorId: "s_wifi_library", poiId: "b6", kind: "wifi_count" as const, label: "Library Central WiFi" },
        { sensorId: "s_wifi_academic", poiId: "b9", kind: "wifi_count" as const, label: "Academic Block WiFi" },
        { sensorId: "s_ble_cafeteria", poiId: "b4", kind: "ble_count" as const, label: "Main Cafeteria BLE" },
        { sensorId: "s_ble_hostel", poiId: "b23", kind: "ble_count" as const, label: "Hostel Zone BLE" },
        { sensorId: "s_wifi_admin", poiId: "b3", kind: "wifi_count" as const, label: "Admin Building WiFi" },
    ];

    const sensors = configs.map((cfg) => {
        const poi = pois.find(p => p.id === cfg.poiId) || pois[0];
        const pos = jitterLatLng(rng, poi.center[0], poi.center[1], 10); // 10m jitter for realism
        return {
            sensorId: cfg.sensorId,
            kind: cfg.kind,
            lat: pos.lat,
            lng: pos.lng,
            poiId: poi.id,
            label: cfg.label
        };
    });

    // 2) Create sensor events every 5 minutes
    const events: SensorEvent[] = [];
    const stepMs = 5 * 60_000;

    // Inject 2–3 spike windows to make anomalies obvious in the demo
    const spikeWindows = Array.from({ length: 3 }).map((_, k) => {
        const spikeStart = startTs + Math.floor((hours * 0.2 + rng() * hours * 0.6) * 3600_000);
        return {
            id: `spike-${k}`,
            start: spikeStart,
            end: spikeStart + 25 * 60_000,
            sensorId: pick(rng, sensors).sensorId,
            multiplier: 2.5 + rng() * 2.0,
        };
    });

    for (let t = startTs; t <= endTs; t += stepMs) {
        const wave = dailyWave01(t);
        for (const s of sensors) {
            // baseline depends on sensor kind + wave
            const base =
                s.kind === "gate_count" ? 18 + 55 * wave :
                    s.kind === "wifi_count" ? 35 + 90 * wave :
                        12 + 40 * wave;

            // add noise
            let value = base + randn(rng) * (3 + 6 * wave);

            // apply spike if within a spike window
            for (const w of spikeWindows) {
                if (w.sensorId === s.sensorId && t >= w.start && t <= w.end) {
                    value *= w.multiplier;
                }
            }

            events.push({
                id: `e-${s.sensorId}-${t}`,
                sensorId: s.sensorId,
                kind: s.kind,
                lat: s.lat,
                lng: s.lng,
                ts: t,
                value: Math.max(0, Math.round(value)),
                label: s.label
            });
        }
    }

    // 3) Create tours (paths between POIs with jitter)
    const tours: Tour[] = [];
    for (let i = 0; i < tourCount; i++) {
        const personType = (rng() < 0.15 ? "visitor" : rng() < 0.65 ? "student" : "staff") as Tour["personType"];

        const start = startTs + Math.floor(rng() * (hours * 3600_000));
        const durationMin = personType === "visitor" ? 25 + rng() * 35 : 35 + rng() * 70;
        const end = Math.min(endTs, start + Math.floor(durationMin * 60_000));

        // pick a sequence of POIs to visit
        const stopCount = personType === "visitor" ? 3 : 4 + Math.floor(rng() * 3);
        const stops = Array.from({ length: stopCount }).map(() => pick(rng, pois));

        // build a polyline by interpolating between stops
        const path: Tour["path"] = [];
        const poiStops: Tour["poiStops"] = [];

        let curTs = start;
        const totalSteps = Math.max(20, Math.floor((end - start) / 20_000)); // ~ every 20s
        for (let k = 0; k < stops.length - 1; k++) {
            const a = stops[k].center;
            const b = stops[k + 1].center;

            // stop event at POI a
            poiStops.push({ poiId: stops[k].id, ts: curTs });

            // segment steps
            const segSteps = Math.floor(totalSteps / (stops.length - 1));
            for (let s = 0; s < segSteps; s++) {
                const tt = s / Math.max(1, segSteps - 1);
                const lat = lerp(a[0], b[0], tt);
                const lng = lerp(a[1], b[1], tt);
                const j = jitterLatLng(rng, lat, lng, 6 + rng() * 10);
                path.push({ t: curTs, lat: j.lat, lng: j.lng });
                curTs += Math.floor((end - start) / totalSteps);
            }

            // dwell time at POI
            curTs += Math.floor((2 + rng() * 6) * 60_000);
        }

        // final POI stop
        const last = stops[stops.length - 1];
        poiStops.push({ poiId: last.id, ts: Math.min(curTs, end) });

        tours.push({
            id: `tour-${i}`,
            personType,
            startTs: start,
            endTs: end,
            path,
            poiStops,
        });
    }

    return { sensors, tours, events, spikeWindows };
}
