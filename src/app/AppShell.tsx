/* Copyright @ Leroy 2026. All rights reserved. */
import { useState, useMemo } from "react";
import CampusMap from "../components/map/CampusMap";
import { CAMPUS_BOUNDS, CAMPUS_CENTER, POIS } from "../data/campus";
import { simulateData } from "../sim/simulate";
import { detectSensorSpikeAnomalies } from "../ml/anomaly";
import SensorChart from "../components/charts/SensorChart";

export default function AppShell() {
    // Dashboard Controls State
    const [showTours, setShowTours] = useState(true);
    const [showSensors, setShowSensors] = useState(true);
    const [showAnomalies, setShowAnomalies] = useState(true);
    const [zThreshold, setZThreshold] = useState(3.0);
    const [mapCenter, setMapCenter] = useState<[number, number]>(CAMPUS_CENTER);
    const [selectedSensorId, setSelectedSensorId] = useState<string | null>("s_gate_main");
    const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(true);

    // Simulation State
    const startTs = useMemo(() => Date.now() - 6 * 3600_000, []); // Last 6 hours
    const sim = useMemo(
        () => simulateData({ seed: 7, startTs, hours: 6, tourCount: 120, pois: POIS }),
        [startTs]
    );

    const anomalies = useMemo(() => detectSensorSpikeAnomalies(sim.events, zThreshold), [sim.events, zThreshold]);

    const handleMapClick = () => {
        // Map click interactivity can be added here for future features
    };

    return (
        <div style={{ padding: '24px 40px', minHeight: '100vh', maxWidth: 1600, margin: '0 auto' }}>
            {/* Header Section */}
            <header className="animate-fade" style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div className="primary-gradient" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 20px var(--primary-glow)' }}>🛰️</div>
                    <h1 className="text-gradient" style={{ fontSize: '2.4rem' }}>Campus Geo-Anomaly Sentinel</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                        Simulated spatiotemporal monitoring + statistical outlier detection
                    </p>
                    <div style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }}></div>
                        LIVE SIMULATION ACTIVE
                    </div>
                </div>
            </header>

            <main
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 400px",
                    gap: 24,
                }}
            >
                {/* Left Column: Map focus */}
                <div className="glass-panel animate-fade" style={{ height: 750, overflow: 'hidden', position: 'relative' }}>
                    {/* Onboarding Hint */}
                    {showHint && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 20,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 1000,
                                background: 'rgba(99, 102, 241, 0.9)',
                                color: 'white',
                                padding: '8px 20px',
                                borderRadius: 30,
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <span>👆 Click any sensor dot or anomaly on the map to analyze its trend</span>
                            <button
                                onClick={() => setShowHint(false)}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '10px' }}
                            >✕</button>
                        </div>
                    )}

                    <CampusMap
                        center={mapCenter}
                        boundary={CAMPUS_BOUNDS}
                        pois={POIS}
                        onMapClick={handleMapClick}
                        tours={sim.tours}
                        sensors={sim.sensors}
                        events={sim.events}
                        spikeWindows={sim.spikeWindows}
                        anomalies={anomalies}
                        showTours={showTours}
                        showSensors={showSensors}
                        showAnomalies={showAnomalies}
                        onSensorClick={(id) => {
                            setSelectedSensorId(id);
                            setShowHint(false);
                        }}
                        selectedAnomalyId={selectedAnomalyId}
                    />
                </div>

                {/* Right Column: Controls & Insights */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade">

                    {/* Controls Card */}
                    <section className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--primary)' }}>⚙️</span> Parameters
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>System Sensitivity</span>
                                <span style={{ color: 'var(--info)', fontWeight: 800 }}>{zThreshold.toFixed(1)}σ</span>
                            </div>
                            <input
                                type="range" min="1.5" max="4.5" step="0.1"
                                value={zThreshold}
                                onChange={e => setZThreshold(parseFloat(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />

                            <div style={{ marginTop: 12 }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Toggle map visibility: (click buttons below)
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    <ToggleButton label="Trajectories" active={showTours} onClick={() => setShowTours(!showTours)} color="var(--warning)" />
                                    <ToggleButton label="IoT Nodes" active={showSensors} onClick={() => setShowSensors(!showSensors)} color="var(--success)" />
                                    <ToggleButton label="Anomalies" active={showAnomalies} onClick={() => setShowAnomalies(!showAnomalies)} color="var(--accent)" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Step 8 Chart Panel */}
                    {selectedSensorId && (() => {
                        const sensor = sim.sensors.find(s => s.sensorId === selectedSensorId);
                        return (
                            <div className="glass-panel animate-fade" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Trend: {sensor?.label || selectedSensorId}</h2>
                                    <button onClick={() => setSelectedSensorId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                </div>
                                <SensorChart
                                    sensorId={selectedSensorId}
                                    events={sim.events.filter(e => e.sensorId === selectedSensorId)}
                                    anomalies={anomalies}
                                />
                                <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    Analyzing 6-hour temporal trend vs. baseline
                                </div>
                            </div>
                        );
                    })()}
                    {!selectedSensorId && (
                        <div
                            className="glass-panel"
                            style={{
                                padding: 40,
                                textAlign: 'center',
                                borderStyle: 'dashed',
                                background: 'rgba(255,255,255,0.01)',
                                cursor: 'default'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', marginBottom: 12, opacity: 0.3 }}>📈</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                No sensor active.<br />
                                <strong style={{ color: 'var(--primary)' }}>Click a dot on the map</strong><br />
                                to load simulated telemetry.
                            </div>
                        </div>
                    )}

                    {/* Anomaly Feed */}
                    <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, maxHeight: 500 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bg-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>Alert Feed</h3>
                            <div style={{ background: 'var(--accent)', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 800, boxShadow: '0 0 10px rgba(244, 63, 94, 0.4)' }}>
                                {anomalies.length} ALERTS
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                            {anomalies.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {anomalies.slice(0, 15).map((a) => {
                                        const sId = a.why.find(w => w.startsWith('sensor='))?.split('=')[1] || '';
                                        const isFocused = selectedAnomalyId === a.id;
                                        return (
                                            <div
                                                key={a.id}
                                                onClick={() => {
                                                    if (isFocused) {
                                                        setSelectedAnomalyId(null);
                                                    } else {
                                                        setMapCenter([a.lat, a.lng]);
                                                        setSelectedAnomalyId(a.id);
                                                        if (sId) setSelectedSensorId(sId);
                                                    }
                                                }}
                                                className="glass-card"
                                                style={{
                                                    padding: 14,
                                                    cursor: 'pointer',
                                                    borderLeft: isFocused ? '4px solid var(--accent)' : '4px solid transparent',
                                                    background: isFocused ? 'rgba(244, 63, 94, 0.05)' : ''
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isFocused ? 'var(--accent)' : 'var(--text-main)' }}>{a.kind}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.why[1]}</div>
                                                {isFocused && (
                                                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Analyzing telemetry...</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', opacity: 0.3, padding: '40px 0' }}>
                                    No significant outliers detected
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main >
        </div >
    );
}

function ToggleButton({ label, active, onClick, color }: { label: string, active: boolean, onClick: () => void, color: string }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? `${color}20` : 'transparent',
                color: active ? color : 'var(--text-muted)',
                border: `1px solid ${active ? color : 'var(--bg-card-border)'}`,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
            }}
        >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? color : 'var(--text-muted)' }}></div>
            {label}
        </button>
    );
}
