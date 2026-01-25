import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import type { SensorEvent, Anomaly } from '../../types';
import { format } from 'date-fns';

type Props = {
    sensorId: string;
    events: SensorEvent[];
    anomalies: Anomaly[];
};

export default function SensorChart({ sensorId, events, anomalies }: Props) {
    if (!events.length) return null;

    const data = events.map(e => ({
        ts: e.ts,
        time: format(e.ts, 'HH:mm'),
        value: e.value,
    }));

    // Find anomalies matching this sensor and time
    const sensorAnomalies = anomalies.filter(a => a.id.includes(sensorId));

    return (
        <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="time"
                        fontSize={9}
                        tick={{ fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        interval={Math.floor(data.length / 4)}
                    />
                    <YAxis
                        fontSize={9}
                        tick={{ fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#1e293b',
                            fontSize: '11px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#6366f1' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationDuration={1500}
                    />

                    {sensorAnomalies.map((anom, i) => (
                        <ReferenceDot
                            key={i}
                            x={format(anom.ts, 'HH:mm')}
                            y={events.find(e => e.ts === anom.ts)?.value || 0}
                            r={5}
                            fill="#f43f5e"
                            stroke="#fff"
                            strokeWidth={2}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
