/* Copyright @ Leroy 2026. All rights reserved. */
export type LatLng = [number, number];

export type POI = {
    id: string;
    name: string;
    kind: "dorm" | "lab" | "cafeteria" | "library" | "gym" | "admin" | "gate" | "class";
    center: LatLng;
};

export type RoutePoint = { t: number; lat: number; lng: number };

export type Tour = {
    id: string;
    personType: "visitor" | "student" | "staff";
    startTs: number; // epoch ms
    endTs: number;
    path: RoutePoint[];
    poiStops: { poiId: string; ts: number }[];
};

export type SensorEvent = {
    id: string;
    sensorId: string;
    kind: "wifi_count" | "gate_count" | "ble_count";
    lat: number;
    lng: number;
    ts: number;
    value: number;
    label?: string;
};

export type Anomaly = {
    id: string;
    kind: "SENSOR_SPIKE" | "HOTSPOT" | "ROUTE_DEVIATION";
    ts: number;
    lat: number;
    lng: number;
    score: number; // 0..1
    why: string[];
    refId?: string; // event/tour id
};

export type Building = {
    id: string;
    name: string;
    coords: LatLng[];
};
