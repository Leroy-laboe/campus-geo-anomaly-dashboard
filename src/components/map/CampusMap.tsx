/* Copyright @ Leroy 2026. All rights reserved. */
import { MapContainer, TileLayer, Polygon, Marker, Popup, Polyline, CircleMarker, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { LatLng as MyLatLng, POI, Building, Tour, SensorEvent, Anomaly } from "../../types";
import type { LatLngExpression } from "leaflet";
import { useEffect } from "react";
import L from "leaflet";


type Sensor = {
    sensorId: string;
    kind: SensorEvent["kind"];
    lat: number;
    lng: number;
    poiId: string;
    label?: string;
};

type SpikeWindow = {
    id: string;
    start: number;
    end: number;
    sensorId: string;
    multiplier: number;
};

type Props = {
    anomalies?: Anomaly[];
    showAnomalies?: boolean;
    center: MyLatLng;
    boundary: MyLatLng[];
    pois: POI[];
    buildings?: Building[];
    onMapClick?: (lat: number, lng: number) => void;



    // Simulation Props
    tours?: Tour[];
    sensors?: Sensor[];
    events?: SensorEvent[];
    spikeWindows?: SpikeWindow[];
    showTours?: boolean;
    showSensors?: boolean;
    showSpikes?: boolean;
    onSensorClick?: (sensorId: string) => void;
    selectedAnomalyId?: string | null;
};

// Custom marker icons (Matching NavSmart look)
const createIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

const kindColors: Record<string, string> = {
    admin: '#3b82f6',     // Blue
    library: '#10b981',   // Emerald
    lab: '#8b5cf6',       // Violet
    cafeteria: '#f59e0b', // Amber
    dorm: '#ec4899',      // Pink
    gym: '#6366f1',       // Indigo
    gate: '#64748b',      // Slate
    class: '#a855f7',     // Purple
};

function MapResizeHandler() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 100);
    }, [map]);
    return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}



// Smoothly pan map when center changes
function MapFocusHandler({ center }: { center: MyLatLng }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center as LatLngExpression, 18, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, map]);
    return null;
}

export default function CampusMap({
    center,
    boundary,
    pois,
    buildings = [],
    onMapClick,

    tours = [],
    sensors = [],
    spikeWindows = [],
    anomalies = [],
    showTours = true,
    showSensors = true,
    showSpikes = true,
    showAnomalies = true,
    onSensorClick,
    selectedAnomalyId,
}: Props) {

    const spikeSensorIds = new Set(spikeWindows.map((w) => w.sensorId));
    const sensorById = new Map(sensors.map((s) => [s.sensorId, s]));

    return (
        <MapContainer
            center={center as LatLngExpression}
            zoom={18}
            style={{ height: "100%", width: "100%", background: '#e2e8f0' }}
            zoomControl={false}
            attributionControl={false}
        >
            <MapResizeHandler />
            <MapFocusHandler center={center} />
            <MapClickHandler onMapClick={onMapClick} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.6}
            />



            {/* Render Buildings */}
            {buildings.map((b) => (
                <Polygon
                    key={b.id}
                    positions={b.coords as LatLngExpression[]}
                    pathOptions={{
                        color: 'rgba(51, 65, 85, 0.4)',
                        weight: 1,
                        fillColor: '#1e293b',
                        fillOpacity: 0.8
                    }}
                >
                    <Tooltip direction="center" offset={[0, 0]} opacity={0.7} permanent>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>{b.name}</span>
                    </Tooltip>
                </Polygon>
            ))}

            {/* Official Boundary */}

            <Polygon
                positions={boundary as LatLngExpression[]}
                pathOptions={{
                    color: 'rgba(99, 102, 241, 0.4)',
                    weight: 2,
                    fillColor: 'transparent',
                    dashArray: '10, 10'
                }}
            />


            {/* Tour Trajectories */}
            {showTours && tours.slice(0, 60).map((t) => (
                <Polyline
                    key={t.id}
                    positions={t.path.map((p) => [p.lat, p.lng] as LatLngExpression)}
                    pathOptions={{ color: t.personType === 'visitor' ? '#f59e0b' : '#64748b', weight: 2, opacity: 0.2, dashArray: '5, 5' }}
                />
            ))}

            {/* Sensors */}
            {showSensors && sensors.map((s) => (
                <CircleMarker
                    key={s.sensorId}
                    center={[s.lat, s.lng]}
                    radius={3}
                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.8, weight: 1, className: 'sensor-marker' }}
                    eventHandlers={{
                        click: () => onSensorClick?.(s.sensorId)
                    }}
                >
                    <Tooltip sticky>
                        <div style={{ fontSize: 11 }}>
                            <div style={{ fontWeight: 800 }}>{s.label || "SENSOR NODE"}</div>
                            <div style={{ opacity: 0.7 }}>{s.sensorId} • {s.kind}</div>
                        </div>
                    </Tooltip>
                </CircleMarker>
            ))}

            {/* POI Markers (NavSmart Style) */}
            {pois.map((p) => (
                <Marker
                    key={p.id}
                    position={p.center as LatLngExpression}
                    icon={createIcon(kindColors[p.kind] || '#94a3b8')}
                >
                    <Popup>
                        <div style={{ minWidth: 160, padding: '4px 0' }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{p.name}</div>
                            {/* Hidden kind/category per request */}
                            {/* <div style={{ opacity: 0.8, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{p.kind}</div> */}
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Spike Markers */}
            {showSpikes && Array.from(spikeSensorIds).map((sid) => {
                const s = sensorById.get(sid);
                if (!s) return null;
                const related = spikeWindows.filter((w) => w.sensorId === sid);
                return (
                    <CircleMarker
                        key={`spike-${sid}`}
                        center={[s.lat, s.lng]}
                        radius={16}
                        pathOptions={{
                            color: '#ef4444',
                            fillColor: '#ef4444',
                            fillOpacity: 0.3,
                            weight: 0,
                            className: 'interactive-spike'
                        }}
                        eventHandlers={{
                            click: () => onSensorClick?.(sid)
                        }}
                    >
                        <Tooltip sticky>
                            <div style={{ fontSize: 12 }}>
                                <div style={{ fontWeight: 700, color: '#ef4444' }}>Anomaly Spike</div>
                                <div>Max x{Math.max(...related.map((r) => r.multiplier)).toFixed(1)}</div>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                );
            })}
            {/* Detected anomalies */}
            {showAnomalies &&
                anomalies.slice(0, 30).map((a) => {
                    const isSelected = a.id === selectedAnomalyId;
                    const sensorId = a.why[0].split('=')[1];
                    return (
                        <CircleMarker
                            key={a.id}
                            center={[a.lat, a.lng]}
                            radius={isSelected ? 16 : 10}
                            pathOptions={{
                                color: isSelected ? '#ef4444' : '#f97316', // Red for selected, Orange for rest
                                fillColor: isSelected ? '#ef4444' : '#f97316',
                                fillOpacity: isSelected ? 0.6 : 0.4,
                                weight: isSelected ? 3 : 2,
                                className: 'interactive-anomaly'
                            }}
                            eventHandlers={{
                                click: () => onSensorClick?.(sensorId)
                            }}
                        >
                            {isSelected && (
                                <Popup>
                                    <div style={{ fontSize: 13 }}>
                                        <div style={{ fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>ANOMALY DETECTED</div>
                                        <div style={{ fontSize: '0.8rem', marginBottom: 2 }}><strong>Kind:</strong> {a.kind}</div>
                                        <div style={{ fontSize: '0.8rem', marginBottom: 2 }}><strong>Score:</strong> {(a.score * 100).toFixed(0)}%</div>
                                        <div style={{ fontSize: '0.8rem', marginBottom: 2 }}><strong>Time:</strong> {new Date(a.ts).toLocaleTimeString()}</div>
                                        <div style={{ marginTop: 6, padding: 6, background: '#fee2e2', borderRadius: 4, fontSize: '0.75rem' }}>
                                            {a.why.map((w, i) => <div key={i}>{w}</div>)}
                                        </div>
                                    </div>
                                </Popup>
                            )}
                            <Tooltip sticky>
                                <div style={{ fontSize: 12 }}>
                                    <div style={{ fontWeight: 700, color: '#c2410c' }}>{a.kind}</div>
                                    <div style={{ opacity: 0.8 }}>score: {a.score.toFixed(2)}</div>
                                    <div style={{ opacity: 0.8 }}>{new Date(a.ts).toLocaleTimeString()}</div>
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}
        </MapContainer>
    );
}
