import { useState, useEffect } from 'react';
import { Thermometer, Wind, Droplets, Zap, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = 'http://localhost:3001/api';

export default function MonitorPage() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch(`${API}/monitor`).then(r => r.json()).then(setData).catch(console.error);
        const iv = setInterval(() => {
            fetch(`${API}/monitor`).then(r => r.json()).then(setData).catch(() => { });
        }, 30000);
        return () => clearInterval(iv);
    }, []);

    if (!data) return <div className="empty-state">Cargando monitor...</div>;

    const salaA = data.ultimasLecturas.find(l => l.id_sala === 1);
    const salaB = data.ultimasLecturas.find(l => l.id_sala === 2);

    const chartData = [];
    const grouped = {};
    data.historial.forEach(r => {
        const hour = r.timestamp_lectura.substring(11, 16);
        if (!grouped[hour]) grouped[hour] = { hour };
        if (r.id_sala === 1) { grouped[hour].tempA = r.temperatura; grouped[hour].humA = r.humedad_pct; }
        if (r.id_sala === 2) { grouped[hour].tempB = r.temperatura; grouped[hour].co2B = r.co2_pct; }
    });
    Object.values(grouped).forEach(g => chartData.push(g));

    return (
        <div className="animate-in">
            <div className="kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label"><Thermometer size={12} style={{ marginRight: 4 }} />Temp. Sala A</span>
                    <span className="kpi-value">{salaA ? salaA.temperatura.toFixed(1) : '—'}°C</span>
                    <span className="kpi-sub">Spec: 20-22°C</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label"><Thermometer size={12} style={{ marginRight: 4 }} />Temp. Sala B</span>
                    <span className="kpi-value" style={{ color: salaB && salaB.temperatura > 37.5 ? 'var(--warning)' : 'var(--success)' }}>
                        {salaB ? salaB.temperatura.toFixed(1) : '—'}°C
                    </span>
                    <span className="kpi-sub">Spec: 36.5-37.5°C (CO₂ Incubator)</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label"><Droplets size={12} style={{ marginRight: 4 }} />Humedad Sala A</span>
                    <span className="kpi-value">{salaA ? salaA.humedad_pct.toFixed(0) : '—'}%</span>
                    <span className="kpi-sub">Spec: 30-60%</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label"><Wind size={12} style={{ marginRight: 4 }} />CO₂ Sala B</span>
                    <span className="kpi-value">{salaB ? salaB.co2_pct.toFixed(1) : '—'}%</span>
                    <span className="kpi-sub">Spec: 4.5-5.5%</span>
                </div>
            </div>

            <div className="grid-60-40">
                <div className="card">
                    <div className="card-header"><span className="card-title">Tendencias 24h — Temperatura</span></div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 12 }} />
                            <Area type="monotone" dataKey="tempA" stroke="#3B82F6" fill="url(#gradA)" name="Sala A (°C)" strokeWidth={2} />
                            <Area type="monotone" dataKey="tempB" stroke="#EF4444" fill="url(#gradB)" name="Sala B (°C)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card">
                        <div className="card-header"><span className="card-title">Estado de Equipos</span></div>
                        {data.equipos.map(eq => (
                            <div key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(30,58,95,0.3)' }}>
                                <span className={`status-dot ${eq.estado_operativo}`}></span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{eq.nombre}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{eq.sala_nombre || eq.ubicacion}</div>
                                </div>
                                <span className={`badge ${eq.estado_operativo === 'operativo' ? 'badge-success' : eq.estado_operativo === 'mantenimiento' ? 'badge-warning' : 'badge-danger'}`}>
                                    {eq.estado_operativo}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Alertas Ambientales</span>
                            <span className="badge badge-danger">{data.alertas.filter(a => a.estado === 'activa').length}</span>
                        </div>
                        {data.alertas.slice(0, 5).map(a => (
                            <div key={a.id} className="alert-row">
                                <div className="alert-icon" style={{ background: a.severidad === 'critical' ? 'var(--danger-bg)' : 'var(--warning-bg)' }}>
                                    <AlertTriangle size={12} style={{ color: a.severidad === 'critical' ? 'var(--danger)' : 'var(--warning)' }} />
                                </div>
                                <div style={{ flex: 1, fontSize: 12 }}>{a.mensaje}</div>
                                <span className={`badge ${a.estado === 'activa' ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: 10 }}>{a.estado}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
