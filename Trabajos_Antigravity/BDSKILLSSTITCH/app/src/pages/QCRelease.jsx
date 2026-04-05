import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:3001/api';

// ─── Datos mock del panel QC Release ─────────────────────────────────────────
// (En producción vendrían de /api/qc-release/:loteId)
const mockLotes = [
    { id: 1, lote_id: 'CART-2026-0038', paciente: 'Alejandro Muñoz', producto: 'CAR-T CD19', estado_global: 'aprobado' },
    { id: 2, lote_id: 'CART-2026-0039', paciente: 'Isabel Torres', producto: 'CAR-T CD19', estado_global: 'aprobado' },
    { id: 4, lote_id: 'CART-2026-0041', paciente: 'Carmen Jiménez', producto: 'CAR-T CD19', estado_global: 'pendiente' },
    { id: 7, lote_id: 'CART-2026-0044', paciente: 'Isabel Torres', producto: 'CAR-T BCMA', estado_global: 'rechazado' },
];

const mockRelease = {
    1: {
        identidad: { pct_car: 68.4, pct_cd3: 95.2, pct_cd4: 42.1, pct_cd8: 53.8, ratio_cd4_cd8: 0.78, celulas_viables: 245.6, viabilidad: 88.3 },
        potencia: { et_ratio: '1:1', via_target: 45.2, ifn_gamma: 1245, tnf_alpha: 342, il2: 89 },
        fisico: { apariencia: 'Translucente sin agregados', ph: 7.1, osmo: 285, endotox: 0.12, vcn: 2.3, rcl: 'negativo', esterilidad: 'negativo', micoplasma: 'negativo' },
        firmas: { analista: true, supervisor: true, qp: false },
    },
    2: {
        identidad: { pct_car: 72.1, pct_cd3: 97.0, pct_cd4: 45.0, pct_cd8: 52.0, ratio_cd4_cd8: 0.87, celulas_viables: 310.2, viabilidad: 92.5 },
        potencia: { et_ratio: '1:1', via_target: 38.5, ifn_gamma: 1560, tnf_alpha: 410, il2: 105 },
        fisico: { apariencia: 'Translucente sin agregados', ph: 7.2, osmo: 291, endotox: 0.08, vcn: 1.8, rcl: 'negativo', esterilidad: 'negativo', micoplasma: 'negativo' },
        firmas: { analista: true, supervisor: true, qp: true },
    },
    4: {
        identidad: { pct_car: 51.0, pct_cd3: 93.5, pct_cd4: 48.0, pct_cd8: 45.5, ratio_cd4_cd8: 1.05, celulas_viables: 180.0, viabilidad: 82.1 },
        potencia: { et_ratio: '1:1', via_target: 62.0, ifn_gamma: 890, tnf_alpha: 210, il2: 62 },
        fisico: { apariencia: 'Translucente sin agregados', ph: 7.0, osmo: 278, endotox: 0.22, vcn: 3.1, rcl: 'pendiente', esterilidad: 'pendiente', micoplasma: 'pendiente' },
        firmas: { analista: true, supervisor: false, qp: false },
    },
    7: {
        identidad: { pct_car: 38.2, pct_cd3: 88.0, pct_cd4: 35.0, pct_cd8: 53.0, ratio_cd4_cd8: 0.66, celulas_viables: 98.5, viabilidad: 55.2 },
        potencia: { et_ratio: '1:1', via_target: 78.3, ifn_gamma: 420, tnf_alpha: 110, il2: 28 },
        fisico: { apariencia: 'Con agregados', ph: 6.2, osmo: 310, endotox: 0.68, vcn: 6.1, rcl: 'negativo', esterilidad: 'negativo', micoplasma: 'negativo' },
        firmas: { analista: true, supervisor: true, qp: false },
    },
};

function passIcon(pass) {
    return pass
        ? <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
        : <XCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />;
}

function ResultRow({ label, value, spec, pass }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1, fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80, textAlign: 'right' }}>{spec}</div>
            {passIcon(pass)}
        </div>
    );
}

function FirmaBadge({ label, signed }) {
    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: signed ? 'var(--success-bg)' : 'var(--bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${signed ? 'var(--success)' : 'var(--border)'}`,
            }}>
                {signed ? <CheckCircle size={18} style={{ color: 'var(--success)' }} /> : <Clock size={18} style={{ color: 'var(--text-muted)' }} />}
            </div>
            <span style={{ fontSize: 11, color: signed ? 'var(--success)' : 'var(--text-muted)', textAlign: 'center' }}>{label}</span>
        </div>
    );
}

export default function QCRelease() {
    const [selectedId, setSelectedId] = useState(1);
    const lote = mockLotes.find(l => l.id === selectedId);
    const data = mockRelease[selectedId];
    const navigate = useNavigate();

    const estadoColor = { aprobado: 'var(--success)', rechazado: 'var(--danger)', pendiente: 'var(--warning)' };

    return (
        <div className="animate-in">
            {/* Selector de lote */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <label style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Lote:</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedId}
                                onChange={e => setSelectedId(Number(e.target.value))}
                                style={{
                                    background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8,
                                    color: 'var(--text-primary)', padding: '8px 32px 8px 12px', fontSize: 13,
                                    appearance: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                                }}
                            >
                                {mockLotes.map(l => (
                                    <option key={l.id} value={l.id}>{l.lote_id} — {l.paciente}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text-muted)' }}>Producto:</span> <strong>{lote.producto}</strong></span>
                        <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text-muted)' }}>Paciente:</span> <strong>{lote.paciente}</strong></span>
                        <span className={`badge badge-${lote.estado_global === 'aprobado' ? 'success' : lote.estado_global === 'rechazado' ? 'danger' : 'warning'}`}
                            style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
                            {lote.estado_global}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3 columnas QC */}
            <div className="grid-3" style={{ gap: 16 }}>

                {/* IDENTIDAD CELULAR */}
                <div className="card">
                    <div className="card-header"><span className="card-title">🔬 Identidad Celular</span></div>
                    <ResultRow label="% CAR+" value={`${data.identidad.pct_car}%`} spec="Valor prod-específico" pass={data.identidad.pct_car >= 40} />
                    <ResultRow label="% CD3+ (pureza T)" value={`${data.identidad.pct_cd3}%`} spec="Spec ≥80%" pass={data.identidad.pct_cd3 >= 80} />
                    <ResultRow label="% CD4+" value={`${data.identidad.pct_cd4}%`} spec="Informativo" pass={true} />
                    <ResultRow label="% CD8+" value={`${data.identidad.pct_cd8}%`} spec="Informativo" pass={true} />
                    <ResultRow label="Ratio CD4:CD8" value={data.identidad.ratio_cd4_cd8.toFixed(2)} spec="Informativo" pass={true} />
                    <ResultRow label="Células viables" value={`${data.identidad.celulas_viables}M`} spec="≥ dosis mínima" pass={data.identidad.celulas_viables >= 100} />
                    <ResultRow label="Viabilidad" value={`${data.identidad.viabilidad}%`} spec="Spec ≥70%" pass={data.identidad.viabilidad >= 70} />
                </div>

                {/* POTENCIA */}
                <div className="card">
                    <div className="card-header"><span className="card-title">⚡ Potencia</span></div>
                    <ResultRow label="Citotoxicidad E:T" value={`${data.identidad.pct_car}% — ${data.potencia.et_ratio}`} spec="" pass={true} />
                    <ResultRow label="Viabilidad target" value={`${data.potencia.via_target}%`} spec="Spec ≤70%" pass={data.potencia.via_target <= 70} />
                    <div style={{ margin: '12px 0 8px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>CITOQUINAS (pg/mL)</div>
                    <ResultRow label="IFN-γ" value={`${data.potencia.ifn_gamma} pg/mL`} spec="Detectable" pass={data.potencia.ifn_gamma > 100} />
                    <ResultRow label="TNF-α" value={`${data.potencia.tnf_alpha} pg/mL`} spec="Detectable" pass={data.potencia.tnf_alpha > 50} />
                    <ResultRow label="IL-2" value={`${data.potencia.il2} pg/mL`} spec="Detectable" pass={data.potencia.il2 > 20} />
                    {/* Mini bar chart cytokines */}
                    <div style={{ marginTop: 16 }}>
                        {[['IFN-γ', data.potencia.ifn_gamma, 2000, '#3B82F6'], ['TNF-α', data.potencia.tnf_alpha, 2000, '#F59E0B'], ['IL-2', data.potencia.il2, 2000, '#22C55E']].map(([n, v, max, c]) => (
                            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 11, width: 45, color: 'var(--text-muted)' }}>{n}</span>
                                <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(v / max * 100, 100)}%`, height: '100%', background: c, borderRadius: 3, transition: 'width 0.6s' }} />
                                </div>
                                <span style={{ fontSize: 11, width: 50, textAlign: 'right' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FÍSICO-QUÍMICO + SEGURIDAD */}
                <div className="card">
                    <div className="card-header"><span className="card-title">🧪 Físico-Químico + Seguridad</span></div>
                    <ResultRow label="Apariencia" value={data.fisico.apariencia} spec="Sin agregados" pass={data.fisico.apariencia.includes('sin') || data.fisico.apariencia.includes('Translucente')} />
                    <ResultRow label="pH" value={data.fisico.ph} spec="6.0–7.5" pass={data.fisico.ph >= 6.0 && data.fisico.ph <= 7.5} />
                    <ResultRow label="Osmolalidad" value={`${data.fisico.osmo} mOsm/kg`} spec="280–320" pass={data.fisico.osmo >= 280 && data.fisico.osmo <= 320} />
                    <ResultRow label="Endotoxinas" value={`${data.fisico.endotox} EU/mL`} spec="≤0.5 EU/mL" pass={data.fisico.endotox <= 0.5} />
                    <ResultRow label="VCN" value={`${data.fisico.vcn} cop/genoma`} spec="≤5 copias" pass={data.fisico.vcn <= 5} />
                    <ResultRow label="RCL/RCR" value={data.fisico.rcl.toUpperCase()} spec="Negativo" pass={data.fisico.rcl === 'negativo'} />
                    <ResultRow label="Esterilidad" value={data.fisico.esterilidad.toUpperCase()} spec="Negativo" pass={data.fisico.esterilidad === 'negativo'} />
                    <ResultRow label="Micoplasma" value={data.fisico.micoplasma.toUpperCase()} spec="Negativo" pass={data.fisico.micoplasma === 'negativo'} />
                </div>
            </div>

            {/* Firmas electrónicas */}
            <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header"><span className="card-title">✍️ Cadena de Firmas GMP</span></div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flex: 1, gap: 24, justifyContent: 'center' }}>
                        <FirmaBadge label="QC Analyst" signed={data.firmas.analista} />
                        <div style={{ width: 40, height: 2, background: data.firmas.supervisor ? 'var(--success)' : 'var(--border)', alignSelf: 'center', marginTop: -8 }} />
                        <FirmaBadge label="QC Supervisor" signed={data.firmas.supervisor} />
                        <div style={{ width: 40, height: 2, background: data.firmas.qp ? 'var(--success)' : 'var(--border)', alignSelf: 'center', marginTop: -8 }} />
                        <FirmaBadge label="Qualified Person" signed={data.firmas.qp} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/firmas')}>Ver Firmas</button>
                        {!data.firmas.qp && (
                            <button className="btn btn-primary btn-sm">Aprobar Liberación (QP Sign)</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
