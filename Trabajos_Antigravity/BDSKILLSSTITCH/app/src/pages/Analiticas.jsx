import { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ReferenceLine, BarChart, Bar, ScatterChart, Scatter, ComposedChart, Area,
} from 'recharts';

const API = 'http://localhost:3001/api';

const PARAMETROS = [
    { key: 'viabilidad', label: 'Viabilidad (%)', color: '#6ee7b7' },
    { key: 'pct_car', label: '% CAR+ (%)', color: '#818cf8' },
    { key: 'pct_cd3', label: '% CD3+ (%)', color: '#f9a8d4' },
    { key: 'ratio_cd4cd8', label: 'Ratio CD4:CD8', color: '#fbbf24' },
    { key: 'ifn_gamma', label: 'IFN-γ (pg/mL)', color: '#38bdf8' },
    { key: 'vcn', label: 'VCN (copias/genoma)', color: '#fb923c' },
    { key: 'ph', label: 'pH', color: '#a78bfa' },
];

const TABS = ['SPC', 'Capacidad', 'Distribuciones', 'Correlaciones'];

// ─── Helpers visuales ────────────────────────────────────────────────────────
function cpkColor(v) {
    if (v == null) return '#64748b';
    if (v >= 1.33) return '#22c55e';
    if (v >= 1.0) return '#f59e0b';
    return '#ef4444';
}
function cpkLabel(v) {
    if (v == null) return 'N/D';
    if (v >= 1.33) return 'CAPAZ';
    if (v >= 1.0) return 'MARGINAL';
    return 'NO CAPAZ';
}

const tooltipStyle = {
    backgroundColor: '#111827', border: '1px solid #2d4a7a',
    borderRadius: 8, color: '#e2e8f0', fontSize: 12,
};

// ─── Resumen de parámetro ────────────────────────────────────────────────────
function StatCard({ label, value, unit, sub, color }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg,#0f1e3a,#162445)', border: '1px solid #2d4a7a',
            borderRadius: 10, padding: '14px 18px', minWidth: 120,
        }}>
            <div style={{ fontSize: 11, color: '#7aa2d4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: color || '#e2e8f0', marginTop: 4 }}>
                {value != null ? value : '—'}{unit ? <span style={{ fontSize: 13, color: '#7aa2d4', marginLeft: 3 }}>{unit}</span> : null}
            </div>
            {sub && <div style={{ fontSize: 11, color: '#4a7ab5', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

// ─── Cpk Gauge ──────────────────────────────────────────────────────────────
function CpkGauge({ cpk, cp }) {
    const color = cpkColor(cpk);
    const label = cpkLabel(cpk);
    const pct = cpk != null ? Math.min(Math.max(cpk / 2, 0), 1) : 0;
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'linear-gradient(135deg,#0f1e3a,#162445)', border: '1px solid #2d4a7a',
            borderRadius: 12, padding: '24px 32px', gap: 12,
        }}>
            <div style={{ fontSize: 13, color: '#7aa2d4', fontWeight: 600, letterSpacing: 1 }}>ÍNDICE Cpk</div>
            {/* Arco visual */}
            <svg width={160} height={90} viewBox="0 0 160 90">
                {/* Bkg arc */}
                <path d="M 10 80 A 70 70 0 0 1 150 80" stroke="#1e3a5f" strokeWidth={14} fill="none" strokeLinecap="round" />
                {/* Color arc */}
                <path
                    d={`M 10 80 A 70 70 0 0 1 ${10 + 140 * pct} ${80 - Math.sin(Math.PI * pct) * 70}`}
                    stroke={color} strokeWidth={14} fill="none" strokeLinecap="round"
                />
                <text x={80} y={72} textAnchor="middle" fill={color} fontSize={26} fontWeight={700}>
                    {cpk != null ? cpk.toFixed(2) : '—'}
                </text>
            </svg>
            <div style={{
                padding: '5px 18px', borderRadius: 20, background: color + '22',
                color, fontWeight: 700, fontSize: 12, letterSpacing: 1,
            }}>{label}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: '#7aa2d4' }}>Cp: <b style={{ color: '#e2e8f0' }}>{cp != null ? cp.toFixed(2) : '—'}</b></span>
                <span style={{ color: '#7aa2d4' }}>Objetivo: <b style={{ color: '#22c55e' }}>≥ 1.33</b></span>
            </div>
        </div>
    );
}

// ─── Box-Whisker (usando BarChart como proxy) ────────────────────────────────
function BoxWhisker({ data, label }) {
    if (!data || !data.length) return <div style={{ color: '#4a7ab5', textAlign: 'center', padding: 40 }}>Sin datos por periodo</div>;

    const chartData = data.map(d => ({
        name: d.grupo,
        min: +(d.min_val || 0).toFixed(1),
        q1: +(d.q1 || 0).toFixed(1),
        mediana: +(d.mediana || 0).toFixed(1),
        q3: +(d.q3 || 0).toFixed(1),
        max: +(d.max_val || 0).toFixed(1),
        // Para la barra apilada: base=min, box=q3-q1, median line
        base: +(d.min_val || 0).toFixed(1),
        rangeLow: +((d.q1 || 0) - (d.min_val || 0)).toFixed(1),
        iqr: +((d.q3 || 0) - (d.q1 || 0)).toFixed(1),
        rangeHigh: +((d.max_val || 0) - (d.q3 || 0)).toFixed(1),
    }));

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="name" tick={{ fill: '#8ba4d4', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8ba4d4', fontSize: 11 }} label={{ value: label, angle: -90, position: 'insideLeft', fill: '#4a7ab5', fontSize: 11 }} />
                <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val, name) => [val.toFixed(1), name]}
                />
                <Bar dataKey="base" fill="transparent" stackId="bw" />
                <Bar dataKey="rangeLow" fill="#1e3a5f" stackId="bw" name="Rango bajo" />
                <Bar dataKey="iqr" fill="#6366f1" stackId="bw" name="IQR (Q1-Q3)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rangeHigh" fill="#1e3a5f" stackId="bw" name="Rango alto" />
                <Line type="step" dataKey="mediana" stroke="#f9a8d4" strokeWidth={2} dot={{ fill: '#f9a8d4', r: 4 }} name="Mediana" />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ─── Scatter con R² ──────────────────────────────────────────────────────────
function CorrelacionChart({ data, labelX, labelY, r2 }) {
    if (!data || !data.length) return <div style={{ color: '#4a7ab5', textAlign: 'center', padding: 40 }}>Sin datos cruzados entre ambos parámetros</div>;

    // Línea de regresión
    const n = data.length;
    const mx = data.reduce((s, p) => s + p.x, 0) / n;
    const my = data.reduce((s, p) => s + p.y, 0) / n;
    const b = data.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) /
        Math.max(data.reduce((s, p) => s + Math.pow(p.x - mx, 2), 0), 0.0001);
    const a = my - b * mx;
    const minX = Math.min(...data.map(p => p.x));
    const maxX = Math.max(...data.map(p => p.x));
    const regrLine = [{ x: minX, y: +(a + b * minX).toFixed(2) }, { x: maxX, y: +(a + b * maxX).toFixed(2) }];

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span style={{ color: '#7aa2d4', fontSize: 13 }}>
                    R² = <span style={{ color: r2 >= 0.7 ? '#22c55e' : r2 >= 0.4 ? '#f59e0b' : '#ef4444', fontWeight: 700, fontSize: 18 }}>
                        {r2 != null ? r2.toFixed(3) : '—'}
                    </span>
                    {r2 != null && <span style={{ color: '#4a7ab5', marginLeft: 8 }}>
                        ({r2 >= 0.7 ? 'Correlación fuerte' : r2 >= 0.4 ? 'Correlación moderada' : 'Correlación débil'})
                    </span>}
                </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="x" name={labelX} type="number" domain={['auto', 'auto']}
                        tick={{ fill: '#8ba4d4', fontSize: 11 }} label={{ value: labelX, position: 'insideBottom', offset: -15, fill: '#4a7ab5', fontSize: 11 }} />
                    <YAxis dataKey="y" name={labelY} type="number" domain={['auto', 'auto']}
                        tick={{ fill: '#8ba4d4', fontSize: 11 }} label={{ value: labelY, angle: -90, position: 'insideLeft', fill: '#4a7ab5', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }}
                        formatter={(val, name) => [val.toFixed(2), name]} />
                    <Scatter data={data} fill="#818cf8" opacity={0.85} />
                    <Line type="linear" data={regrLine} dataKey="y" stroke="#f59e0b" strokeWidth={2}
                        dot={false} legendType="none" name="Regresión" />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Analiticas() {
    const [activeTab, setActiveTab] = useState('SPC');
    const [selectedParam, setSelectedParam] = useState('viabilidad');
    const [corrX, setCorrX] = useState('viabilidad');
    const [corrY, setCorrY] = useState('pct_car');

    const [spcData, setSpcData] = useState(null);
    const [capData, setCapData] = useState(null);
    const [distData, setDistData] = useState(null);
    const [corrData, setCorrData] = useState(null);
    const [resumen, setResumen] = useState([]);
    const [loading, setLoading] = useState(false);

    const paramInfo = PARAMETROS.find(p => p.key === selectedParam);

    const fetchSPC = useCallback(async (param) => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/estadisticas/spc/${param}`);
            setSpcData(await r.json());
        } catch (e) { setSpcData(null); }
        setLoading(false);
    }, []);

    const fetchCap = useCallback(async (param) => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/estadisticas/capacidad/${param}`);
            setCapData(await r.json());
        } catch (e) { setCapData(null); }
        setLoading(false);
    }, []);

    const fetchDist = useCallback(async (param) => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/estadisticas/distribucion/${param}`);
            setDistData(await r.json());
        } catch (e) { setDistData(null); }
        setLoading(false);
    }, []);

    const fetchCorr = useCallback(async (x, y) => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/estadisticas/correlacion?x=${x}&y=${y}`);
            setCorrData(await r.json());
        } catch (e) { setCorrData(null); }
        setLoading(false);
    }, []);

    const fetchResumen = useCallback(async () => {
        try {
            const r = await fetch(`${API}/estadisticas/resumen`);
            setResumen(await r.json());
        } catch (e) { setResumen([]); }
    }, []);

    useEffect(() => { fetchResumen(); }, [fetchResumen]);

    useEffect(() => {
        if (activeTab === 'SPC') fetchSPC(selectedParam);
        if (activeTab === 'Capacidad') fetchCap(selectedParam);
        if (activeTab === 'Distribuciones') fetchDist(selectedParam);
    }, [activeTab, selectedParam, fetchSPC, fetchCap, fetchDist]);

    useEffect(() => {
        if (activeTab === 'Correlaciones') fetchCorr(corrX, corrY);
    }, [activeTab, corrX, corrY, fetchCorr]);

    // Selector de parámetro (para tabs 1-3)
    const ParamSelector = () => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PARAMETROS.map(p => (
                <button key={p.key} onClick={() => setSelectedParam(p.key)} style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: selectedParam === p.key ? p.color + '33' : '#1e3a5f',
                    color: selectedParam === p.key ? p.color : '#7aa2d4',
                    fontWeight: selectedParam === p.key ? 700 : 400,
                    fontSize: 12, outline: selectedParam === p.key ? `1px solid ${p.color}` : 'none',
                    transition: 'all 0.2s',
                }}>{p.label}</button>
            ))}
        </div>
    );

    return (
        <div style={{ padding: '24px 32px', background: '#0a0f1e', minHeight: '100vh', fontFamily: 'Inter,sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }}>
                        📊 Estadística Avanzada QC
                    </h1>
                    <p style={{ color: '#4a7ab5', fontSize: 13, margin: '4px 0 0' }}>
                        SPC · Capacidad de Proceso · Distribuciones · Correlaciones
                    </p>
                </div>
                <div style={{
                    background: '#162445', border: '1px solid #2d4a7a', borderRadius: 8,
                    padding: '6px 14px', fontSize: 12, color: '#7aa2d4',
                }}>
                    Metodología: Shewhart / ISO 8258
                </div>
            </div>

            {/* KPI Resumen rápido */}
            {resumen.length > 0 && (
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
                    {resumen.map(r => (
                        <div key={r.parametro} style={{
                            background: 'linear-gradient(135deg,#0f1e3a,#162445)', border: '1px solid #2d4a7a',
                            borderRadius: 10, padding: '10px 16px', minWidth: 140, flexShrink: 0,
                        }}>
                            <div style={{ fontSize: 10, color: '#7aa2d4', fontWeight: 600, textTransform: 'uppercase' }}>{r.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: cpkColor(r.cpk), marginTop: 2 }}>
                                {r.media != null ? r.media.toFixed(1) : '—'}
                            </div>
                            <div style={{ fontSize: 10, color: '#4a7ab5', marginTop: 2 }}>
                                n={r.n} · Cpk={r.cpk != null ? r.cpk.toFixed(2) : '—'}
                            </div>
                            {r.n_fuera_spec > 0 && (
                                <div style={{ fontSize: 10, color: '#ef4444', marginTop: 3 }}>
                                    ⚠ {r.n_fuera_spec} fuera de spec
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* TABS */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '9px 22px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
                        background: activeTab === tab ? '#1e3a5f' : '#0f1e3a',
                        color: activeTab === tab ? '#e2e8f0' : '#4a7ab5',
                        fontWeight: activeTab === tab ? 700 : 400, fontSize: 13,
                        borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                        transition: 'all 0.2s',
                    }}>{tab}</button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div style={{
                background: 'linear-gradient(135deg,#0f1e3a,#0d1b33)', border: '1px solid #2d4a7a',
                borderRadius: '0 12px 12px 12px', padding: 24,
            }}>

                {/* ─── TAB: SPC ─────────────────────────────────────────────────── */}
                {activeTab === 'SPC' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, margin: 0 }}>
                                Control Estadístico de Proceso (Shewhart X̄)
                            </h2>
                            <ParamSelector />
                        </div>

                        {loading && <div style={{ color: '#4a7ab5', textAlign: 'center', padding: 40 }}>Cargando datos SPC…</div>}

                        {!loading && spcData && (
                            <>
                                {/* Stats rápidos */}
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                                    <StatCard label="Observaciones" value={spcData.stats?.n} color="#6ee7b7" />
                                    <StatCard label="Media X̄" value={spcData.stats?.media?.toFixed(2)} color={paramInfo?.color} />
                                    <StatCard label="Desv. Std σ" value={spcData.stats?.desv_std?.toFixed(2)} color="#f9a8d4" />
                                    <StatCard label="CV%" value={spcData.stats?.cv_pct?.toFixed(1)} unit="%" color="#fbbf24"
                                        sub="<10% = proceso estable" />
                                    <StatCard label="Fuera de Spec" value={spcData.stats?.n_fuera_spec}
                                        color={spcData.stats?.n_fuera_spec > 0 ? '#ef4444' : '#22c55e'} />
                                    <StatCard label="UCL" value={spcData.stats?.ucl?.toFixed(2)} color="#ef4444" sub="X̄ + 3σ" />
                                    <StatCard label="LCL" value={spcData.stats?.lcl?.toFixed(2)} color="#38bdf8" sub="X̄ - 3σ" />
                                </div>

                                {spcData.puntos?.length === 0 && (
                                    <div style={{ color: '#4a7ab5', textAlign: 'center', padding: 40 }}>
                                        Sin datos registrados para este parámetro. Registre resultados QC primero.
                                    </div>
                                )}

                                {spcData.puntos?.length > 0 && (
                                    <ResponsiveContainer width="100%" height={340}>
                                        <ComposedChart data={spcData.puntos} margin={{ top: 10, right: 30, bottom: 40, left: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                                            <XAxis dataKey="lote_id" tick={{ fill: '#8ba4d4', fontSize: 10 }}
                                                label={{ value: 'Lote', position: 'insideBottom', offset: -20, fill: '#4a7ab5', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#8ba4d4', fontSize: 11 }}
                                                label={{ value: paramInfo?.label, angle: -90, position: 'insideLeft', fill: '#4a7ab5', fontSize: 11 }} />
                                            <Tooltip contentStyle={tooltipStyle}
                                                formatter={(val, name) => [typeof val === 'number' ? val.toFixed(2) : val, name]} />
                                            <Legend wrapperStyle={{ color: '#7aa2d4', fontSize: 12, paddingTop: 16 }} />

                                            {/* Zona entre UCL y LCL (relleno) */}
                                            <Area type="monotone" dataKey="ucl" fill="#1e3a5f" stroke="transparent" legendType="none" />

                                            {/* Lines de control */}
                                            <Line type="monotone" dataKey="ucl" stroke="#ef4444" strokeWidth={1.5}
                                                strokeDasharray="6 3" dot={false} name="UCL" />
                                            <Line type="monotone" dataKey="media_movil" stroke="#6366f1" strokeWidth={2}
                                                dot={false} name="Media móvil" />
                                            <Line type="monotone" dataKey="lcl" stroke="#38bdf8" strokeWidth={1.5}
                                                strokeDasharray="6 3" dot={false} name="LCL" />

                                            {/* Especificaciones */}
                                            {spcData.spec_min != null && (
                                                <ReferenceLine y={spcData.spec_min} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Spec Min', fill: '#f59e0b', fontSize: 10 }} />
                                            )}
                                            {spcData.spec_max != null && (
                                                <ReferenceLine y={spcData.spec_max} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Spec Max', fill: '#f59e0b', fontSize: 10 }} />
                                            )}

                                            {/* Observaciones — puntos fuera de control en rojo */}
                                            <Line type="monotone" dataKey="valor" stroke={paramInfo?.color || '#6ee7b7'} strokeWidth={2}
                                                name="Valor observado"
                                                dot={(props) => {
                                                    const { cx, cy, payload } = props;
                                                    const isOut = payload.es_outlier === 1;
                                                    return (
                                                        <circle key={payload.lote_id} cx={cx} cy={cy} r={isOut ? 7 : 4}
                                                            fill={isOut ? '#ef4444' : (paramInfo?.color || '#6ee7b7')}
                                                            stroke={isOut ? '#fff' : 'none'} strokeWidth={1.5} />
                                                    );
                                                }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}

                                <div style={{ marginTop: 12, fontSize: 11, color: '#4a7ab5', display: 'flex', gap: 20 }}>
                                    <span>🔴 Punto fuera de límites de control</span>
                                    <span>— — UCL/LCL: Límites 3σ Shewhart</span>
                                    <span>– – Spec: Especificación GMP</span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ─── TAB: CAPACIDAD ────────────────────────────────────────────── */}
                {activeTab === 'Capacidad' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, margin: 0 }}>
                                Análisis de Capacidad de Proceso (Cp / Cpk)
                            </h2>
                            <ParamSelector />
                        </div>

                        {!loading && capData && (
                            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
                                {/* Gauge + métricas */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <CpkGauge cpk={capData.stats?.cpk} cp={capData.stats?.cp} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <StatCard label="Media" value={capData.stats?.media?.toFixed(2)} color="#e2e8f0" />
                                        <StatCard label="Desv σ" value={capData.stats?.desv_std?.toFixed(3)} color="#f9a8d4" />
                                        <StatCard label="Min" value={capData.stats?.min_val?.toFixed(2)} color="#38bdf8" />
                                        <StatCard label="Máx" value={capData.stats?.max_val?.toFixed(2)} color="#fbbf24" />
                                        <StatCard label="n" value={capData.stats?.n} color="#6ee7b7" />
                                        <StatCard label="Fuera spec" value={capData.stats?.n_fuera_spec}
                                            color={capData.stats?.n_fuera_spec > 0 ? '#ef4444' : '#22c55e'} />
                                    </div>
                                    <div style={{
                                        background: '#0f1e3a', border: '1px solid #1e3a5f', borderRadius: 8,
                                        padding: '10px 14px', fontSize: 11, color: '#4a7ab5',
                                    }}>
                                        <div>Q1: {capData.stats?.q1?.toFixed(2)} | Mediana: {capData.stats?.mediana?.toFixed(2)} | Q3: {capData.stats?.q3?.toFixed(2)}</div>
                                        <div style={{ marginTop: 4 }}>Spec: [{capData.spec_min} – {capData.spec_max}]</div>
                                    </div>
                                </div>

                                {/* Histograma */}
                                <div>
                                    <div style={{ color: '#7aa2d4', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
                                        HISTOGRAMA DE DISTRIBUCIÓN
                                    </div>
                                    {capData.histograma?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={320}>
                                            <BarChart data={capData.histograma} margin={{ top: 10, right: 20, bottom: 60, left: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                                                <XAxis dataKey="rango" tick={{ fill: '#8ba4d4', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                                                <YAxis tick={{ fill: '#8ba4d4', fontSize: 11 }} label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft', fill: '#4a7ab5', fontSize: 11 }} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Bar dataKey="count" fill={paramInfo?.color || '#6366f1'} name="Frecuencia"
                                                    radius={[4, 4, 0, 0]} opacity={0.85} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ color: '#4a7ab5', textAlign: 'center', padding: 60 }}>
                                            Sin datos suficientes para histograma
                                        </div>
                                    )}

                                    {/* Interpretación Cpk */}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                        {[
                                            { rango: '< 1.0', label: 'No capaz', color: '#ef4444' },
                                            { rango: '1.0 – 1.33', label: 'Marginal', color: '#f59e0b' },
                                            { rango: '≥ 1.33', label: 'Capaz (GMP)', color: '#22c55e' },
                                            { rango: '≥ 1.67', label: 'Excelente', color: '#6ee7b7' },
                                        ].map(item => (
                                            <div key={item.rango} style={{
                                                background: item.color + '15', border: `1px solid ${item.color}55`,
                                                borderRadius: 6, padding: '4px 10px', fontSize: 11,
                                            }}>
                                                <span style={{ color: item.color, fontWeight: 700 }}>{item.rango}</span>
                                                <span style={{ color: '#7aa2d4', marginLeft: 6 }}>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB: DISTRIBUCIONES ──────────────────────────────────────── */}
                {activeTab === 'Distribuciones' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, margin: 0 }}>
                                Distribución por Período (Box-Whisker)
                            </h2>
                            <ParamSelector />
                        </div>

                        {!loading && distData && (
                            <>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                                    <StatCard label="Global Media" value={distData.globalStats?.media?.toFixed(2)} color={paramInfo?.color} />
                                    <StatCard label="Global σ" value={distData.globalStats?.desv_std?.toFixed(3)} color="#f9a8d4" />
                                    <StatCard label="Global IQR" value={distData.globalStats && ((distData.globalStats.q3 || 0) - (distData.globalStats.q1 || 0)).toFixed(2)} color="#fbbf24" />
                                    <StatCard label="Períodos" value={distData.seriesMeses?.length} color="#6ee7b7" />
                                </div>

                                <BoxWhisker data={distData.seriesMeses} label={paramInfo?.label} />

                                <div style={{ marginTop: 20 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#1e3a5f' }}>
                                                {['Período', 'n', 'Media', 'Mediana', 'Std σ', 'Q1', 'Q3', 'Min', 'Máx', 'Cpk'].map(col => (
                                                    <th key={col} style={{ padding: '8px 12px', color: '#7aa2d4', textAlign: 'left', fontWeight: 600 }}>{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {distData.seriesMeses?.map((row, i) => (
                                                <tr key={row.grupo} style={{ background: i % 2 ? '#0d1b33' : '#0f1e3a' }}>
                                                    <td style={{ padding: '7px 12px', color: '#e2e8f0', fontWeight: 600 }}>{row.grupo}</td>
                                                    <td style={{ padding: '7px 12px', color: '#6ee7b7' }}>{row.n}</td>
                                                    <td style={{ padding: '7px 12px', color: paramInfo?.color }}>{row.media?.toFixed(2)}</td>
                                                    <td style={{ padding: '7px 12px', color: '#f9a8d4' }}>{row.mediana?.toFixed(2)}</td>
                                                    <td style={{ padding: '7px 12px', color: '#e2e8f0' }}>{row.desv_std?.toFixed(3)}</td>
                                                    <td style={{ padding: '7px 12px', color: '#e2e8f0' }}>{row.q1?.toFixed(2)}</td>
                                                    <td style={{ padding: '7px 12px', color: '#e2e8f0' }}>{row.q3?.toFixed(2)}</td>
                                                    <td style={{ padding: '7px 12px', color: '#38bdf8' }}>{row.min_val?.toFixed(2)}</td>
                                                    <td style={{ padding: '7px 12px', color: '#fbbf24' }}>{row.max_val?.toFixed(2)}</td>
                                                    <td style={{ padding: '7px 12px', color: cpkColor(row.cpk), fontWeight: 700 }}>
                                                        {row.cpk != null ? row.cpk.toFixed(2) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ─── TAB: CORRELACIONES ───────────────────────────────────────── */}
                {activeTab === 'Correlaciones' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, margin: 0 }}>
                                Correlación Pearson (R²) entre Parámetros
                            </h2>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span style={{ color: '#7aa2d4', fontSize: 12 }}>Eje X:</span>
                                    <select value={corrX} onChange={e => setCorrX(e.target.value)} style={{
                                        background: '#1e3a5f', color: '#e2e8f0', border: '1px solid #2d4a7a',
                                        borderRadius: 6, padding: '5px 10px', fontSize: 12,
                                    }}>
                                        {PARAMETROS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span style={{ color: '#7aa2d4', fontSize: 12 }}>Eje Y:</span>
                                    <select value={corrY} onChange={e => setCorrY(e.target.value)} style={{
                                        background: '#1e3a5f', color: '#e2e8f0', border: '1px solid #2d4a7a',
                                        borderRadius: 6, padding: '5px 10px', fontSize: 12,
                                    }}>
                                        {PARAMETROS.filter(p => p.key !== corrX).map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {!loading && corrData && (
                            <div>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                                    <StatCard label="Pares cruzados" value={corrData.n} color="#6ee7b7" />
                                    <StatCard label="R² Pearson" value={corrData.r2?.toFixed(3)}
                                        color={corrData.r2 >= 0.7 ? '#22c55e' : corrData.r2 >= 0.4 ? '#f59e0b' : '#ef4444'}
                                        sub={corrData.r2 >= 0.7 ? 'Correlación fuerte' : corrData.r2 >= 0.4 ? 'Correlación moderada' : 'Correlación débil'} />
                                </div>

                                <CorrelacionChart
                                    data={corrData.puntos}
                                    labelX={corrData.labelX}
                                    labelY={corrData.labelY}
                                    r2={corrData.r2}
                                />

                                {/* Matriz de correlación conceptual */}
                                <div style={{ marginTop: 24 }}>
                                    <div style={{ color: '#7aa2d4', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                                        GUÍA DE CORRELACIONES CLÍNICAS RELEVANTES — CAR-T
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                                        {[
                                            { par: 'Viabilidad → VCN', rel: 'Negativa esperada', color: '#ef4444' },
                                            { par: 'VCN → % CAR+', rel: 'Positiva (transducción)', color: '#22c55e' },
                                            { par: 'IFN-γ → % CAR+', rel: 'Positiva (potencia)', color: '#22c55e' },
                                            { par: 'pH → Viabilidad', rel: 'Positiva fuerte', color: '#6ee7b7' },
                                        ].map(item => (
                                            <div key={item.par} style={{
                                                background: '#0f1e3a', border: '1px solid #2d4a7a', borderRadius: 8,
                                                padding: '8px 12px',
                                            }}>
                                                <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{item.par}</div>
                                                <div style={{ color: item.color, fontSize: 11, marginTop: 2 }}>{item.rel}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
