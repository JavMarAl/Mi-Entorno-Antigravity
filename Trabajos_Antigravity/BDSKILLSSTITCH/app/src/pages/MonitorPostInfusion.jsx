import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckCircle, AlertTriangle, Clock, ChevronDown, Activity } from 'lucide-react';

const mockPacientes = [
    { id: 1, nombre: 'Isabel Torres', lote: 'CART-2026-0039', producto: 'CAR-T CD19', infusion: '05/02/2026', diasPost: 17 },
    { id: 2, nombre: 'Alejandro Muñoz', lote: 'CART-2026-0038', producto: 'CAR-T CD19', infusion: '02/02/2026', diasPost: 20 },
];

const mockData = {
    1: {
        crs: { grado: 2, estado: 'resuelto', color: 'var(--warning)' },
        icans: { grado: 0, estado: 'no detectado', color: 'var(--success)' },
        respuesta: 'Evaluación D+30 pendiente',
        eventos: [
            { dia: 'D+2', texto: 'Fiebre 38.5°C — Inicio CRS Grado 1', tto: 'Soporte antipirético', resuelto: true, tipo: 'warning' },
            { dia: 'D+4', texto: 'Escalada CRS Grado 2, IL-6 ↑ 2,450 pg/mL', tto: 'Tocilizumab 8mg/kg IV', resuelto: true, tipo: 'danger' },
            { dia: 'D+8', texto: 'CRS Grado 2 resuelto — Afebril 48h', tto: '—', resuelto: true, tipo: 'success' },
            { dia: 'D+12', texto: 'Control laboratorio — parámetros normales', tto: '—', resuelto: true, tipo: 'success' },
            { dia: 'D+17', texto: 'HOY — Sin eventos activos', tto: '—', resuelto: false, tipo: 'info' },
        ],
        citoquinas: [
            { dia: 'D0', il6: 12, ifn: 8, crp: 2 },
            { dia: 'D1', il6: 45, ifn: 22, crp: 8 },
            { dia: 'D2', il6: 320, ifn: 85, crp: 42 },
            { dia: 'D3', il6: 890, ifn: 210, crp: 68 },
            { dia: 'D4', il6: 2450, ifn: 420, crp: 112 },
            { dia: 'D5', il6: 1800, ifn: 350, crp: 98 },
            { dia: 'D6', il6: 980, ifn: 220, crp: 75 },
            { dia: 'D8', il6: 280, ifn: 95, crp: 38 },
            { dia: 'D10', il6: 85, ifn: 32, crp: 14 },
            { dia: 'D12', il6: 28, ifn: 12, crp: 4 },
            { dia: 'D14', il6: 15, ifn: 8, crp: 2 },
            { dia: 'D17', il6: 10, ifn: 6, crp: 2 },
        ],
        labs: [
            { label: 'Leucocitos', value: '2,100/μL', normal: false, ref: '4,500-11,000/μL' },
            { label: 'CD19+ B-cells', value: '0 cél/μL', normal: true, ref: '0 (Aplasia B = Eficacia ✓)' },
            { label: 'CAR-T en sangre', value: '12.4% linfocitos', normal: true, ref: 'Persistencia CAR-T ✓' },
            { label: 'CRP', value: '2.1 mg/L', normal: true, ref: '<10 mg/L' },
            { label: 'Ferritina', value: '320 ng/mL', normal: true, ref: '<500 ng/mL' },
            { label: 'ICE Score', value: '10/10', normal: true, ref: 'Normal (10=sin ICANS)' },
        ],
        proximas: [
            { label: 'D+30 — Respuesta completa', dias: 13, tipo: 'primary' },
            { label: 'D+100 — BM aspirado + PET-CT', dias: 83, tipo: 'neutral' },
            { label: 'Año 1 — Follow-up largo plazo', dias: 348, tipo: 'neutral' },
            { label: 'Trazabilidad 30 años (EMA/España)', dias: null, tipo: 'muted' },
        ],
    },
    2: {
        crs: { grado: 1, estado: 'resuelto', color: 'var(--success)' },
        icans: { grado: 0, estado: 'no detectado', color: 'var(--success)' },
        respuesta: 'Respuesta completa D+30 confirmada',
        eventos: [
            { dia: 'D+3', texto: 'Fiebre 38.2°C — CRS Grado 1', tto: 'Paracetamol', resuelto: true, tipo: 'warning' },
            { dia: 'D+6', texto: 'CRS Grado 1 resuelto', tto: '—', resuelto: true, tipo: 'success' },
            { dia: 'D+20', texto: 'HOY — Estable, sin eventos', tto: '—', resuelto: false, tipo: 'info' },
        ],
        citoquinas: [
            { dia: 'D0', il6: 10, ifn: 6, crp: 1 },
            { dia: 'D2', il6: 180, ifn: 65, crp: 25 },
            { dia: 'D3', il6: 520, ifn: 120, crp: 48 },
            { dia: 'D5', il6: 290, ifn: 75, crp: 32 },
            { dia: 'D6', il6: 80, ifn: 28, crp: 12 },
            { dia: 'D10', il6: 18, ifn: 8, crp: 3 },
            { dia: 'D15', il6: 11, ifn: 6, crp: 2 },
            { dia: 'D20', il6: 9, ifn: 5, crp: 1 },
        ],
        labs: [
            { label: 'Leucocitos', value: '3,200/μL', normal: true, ref: '4,500-11,000/μL' },
            { label: 'CD19+ B-cells', value: '0 cél/μL', normal: true, ref: 'Aplasia B = Eficacia ✓' },
            { label: 'CAR-T en sangre', value: '8.2% linfocitos', normal: true, ref: 'Persistencia CAR-T ✓' },
            { label: 'CRP', value: '1.8 mg/L', normal: true, ref: '<10 mg/L' },
            { label: 'Ferritina', value: '245 ng/mL', normal: true, ref: '<500 ng/mL' },
            { label: 'ICE Score', value: '10/10', normal: true, ref: 'Normal' },
        ],
        proximas: [
            { label: 'D+30 ✓ — Respuesta completa confirmada', dias: null, tipo: 'success' },
            { label: 'D+100 — BM aspirado + PET-CT', dias: 80, tipo: 'primary' },
            { label: 'Año 1 — Follow-up largo plazo', dias: 345, tipo: 'neutral' },
            { label: 'Trazabilidad 30 años (EMA/España)', dias: null, tipo: 'muted' },
        ],
    },
};

const tipoColor = { warning: 'var(--warning)', danger: 'var(--danger)', success: 'var(--success)', info: 'var(--accent)', muted: 'var(--text-muted)' };

export default function MonitorPostInfusion() {
    const [selectedId, setSelectedId] = useState(1);
    const pac = mockPacientes.find(p => p.id === selectedId);
    const data = mockData[selectedId];

    return (
        <div className="animate-in">
            {/* Header */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Paciente:</label>
                    <div style={{ position: 'relative' }}>
                        <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 32px 8px 12px', fontSize: 13, appearance: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                            {mockPacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.lote}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>
                    <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text-muted)' }}>Infusión:</span> <strong>{pac.infusion}</strong></span>
                    <span className="badge badge-info" style={{ fontSize: 11, letterSpacing: 0.5 }}>EN SEGUIMIENTO</span>
                </div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid" style={{ marginBottom: 16 }}>
                <div className="kpi-card">
                    <span className="kpi-label"><Activity size={12} /> D+ Actual</span>
                    <span className="kpi-value" style={{ color: 'var(--accent)' }}>D+{pac.diasPost}</span>
                    <span className="kpi-sub">Próx. eval: D+30</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Estado CRS</span>
                    <span className="kpi-value" style={{ color: data.crs.color, fontSize: data.crs.grado === 0 ? 24 : 28 }}>
                        {data.crs.grado === 0 ? 'No detectado' : `Grado ${data.crs.grado}`}
                    </span>
                    <span className="kpi-sub" style={{ textTransform: 'capitalize' }}>{data.crs.estado}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">ICANS</span>
                    <span className="kpi-value" style={{ color: data.icans.color, fontSize: 22 }}>No detectado</span>
                    <span className="kpi-sub">ICE Score normal</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Respuesta</span>
                    <span className="kpi-value" style={{ fontSize: 16, lineHeight: 1.3 }}>{data.respuesta}</span>
                </div>
            </div>

            {/* Main content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
                {/* Left */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Eventos adversos */}
                    <div className="card">
                        <div className="card-header"><span className="card-title">⚠️ Eventos Adversos</span></div>
                        {data.eventos.map((ev, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < data.eventos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: tipoColor[ev.tipo], minWidth: 36, paddingTop: 2 }}>{ev.dia}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13 }}>{ev.texto}</div>
                                    {ev.tto !== '—' && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Tratamiento: {ev.tto}</div>}
                                </div>
                                {ev.resuelto && <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />}
                            </div>
                        ))}
                    </div>

                    {/* Gráfico citoquinas */}
                    <div className="card">
                        <div className="card-header"><span className="card-title">📈 Cinética de Citoquinas</span></div>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={data.citoquinas}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#8ba4d4' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#8ba4d4' }} />
                                <Tooltip
                                    contentStyle={{ background: '#111827', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 12, color: '#f0f4ff' }}
                                    labelStyle={{ color: '#7baaf7', fontWeight: 600 }}
                                    itemStyle={{ color: '#f0f4ff' }}
                                />
                                <Line type="monotone" dataKey="il6" stroke="#EF4444" strokeWidth={2} dot={false} name="IL-6 (pg/mL)" />
                                <Line type="monotone" dataKey="ifn" stroke="#F59E0B" strokeWidth={2} dot={false} name="IFN-γ (pg/mL)" />
                                <Line type="monotone" dataKey="crp" stroke="#22C55E" strokeWidth={2} dot={false} name="CRP (mg/L)" />
                            </LineChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                            {[['IL-6', '#EF4444'], ['IFN-γ', '#F59E0B'], ['CRP', '#22C55E']].map(([n, c]) => (
                                <span key={n} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ width: 14, height: 3, background: c, borderRadius: 2, display: 'inline-block' }} />{n}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Labs */}
                    <div className="card">
                        <div className="card-header"><span className="card-title">🧬 Labs D+{pac.diasPost}</span></div>
                        {data.labs.map((lab, i) => (
                            <div key={i} style={{ padding: '8px 0', borderBottom: i < data.labs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lab.label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: lab.normal ? 'var(--text-primary)' : 'var(--warning)' }}>{lab.value}</span>
                                        {lab.normal
                                            ? <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                                            : <AlertTriangle size={12} style={{ color: 'var(--warning)' }} />}
                                    </div>
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{lab.ref}</div>
                            </div>
                        ))}
                    </div>

                    {/* Próximas evaluaciones */}
                    <div className="card">
                        <div className="card-header"><span className="card-title">📅 Evaluaciones</span></div>
                        {data.proximas.map((ev, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < data.proximas.length - 1 ? '1px solid var(--border)' : 'none', gap: 8 }}>
                                <span style={{ fontSize: 12, color: ev.tipo === 'muted' ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1 }}>{ev.label}</span>
                                {ev.dias != null && (
                                    <span className={`badge badge-${ev.tipo === 'primary' ? 'info' : ev.tipo === 'success' ? 'success' : 'warning'}`}
                                        style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                                        {ev.dias}d
                                    </span>
                                )}
                                {ev.tipo === 'success' && <CheckCircle size={12} style={{ color: 'var(--success)' }} />}
                                {ev.tipo === 'muted' && <Clock size={12} style={{ color: 'var(--text-muted)' }} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
