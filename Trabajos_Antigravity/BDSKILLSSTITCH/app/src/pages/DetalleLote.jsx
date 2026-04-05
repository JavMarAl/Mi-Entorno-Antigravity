import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const API = 'http://localhost:3001/api';

const estadoBadge = { en_proceso: 'badge-info', qc_pendiente: 'badge-warning', aprobado: 'badge-success', rechazado: 'badge-danger', en_hold: 'badge-warning', enviado: 'badge-success' };
const estadoLabel = { en_proceso: 'En Proceso', qc_pendiente: 'QC Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado', en_hold: 'En Hold', enviado: 'Enviado' };

export default function DetalleLote() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lote, setLote] = useState(null);

    useEffect(() => {
        fetch(`${API}/lotes/${id}`).then(r => r.json()).then(setLote).catch(console.error);
    }, [id]);

    if (!lote) return <div className="empty-state">Cargando lote...</div>;

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Volver</button>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{lote.lote_id}</h2>
                <span className={`badge ${estadoBadge[lote.estado]}`}>{estadoLabel[lote.estado]}</span>
            </div>

            {/* Info Cards */}
            <div className="kpi-grid" style={{ marginBottom: 24 }}>
                <div className="kpi-card">
                    <span className="kpi-label">Paciente</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{lote.paciente_nombre}</span>
                    <span className="kpi-sub">{lote.numero_historia} — {lote.diagnostico}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Producto</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{lote.tipo_producto.replace('CAR-T_', 'CAR-T ')}</span>
                    <span className="kpi-sub">Analista: {lote.analista_nombre}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Viabilidad Final</span>
                    <span className="kpi-value" style={{ color: lote.viabilidad_final >= 70 ? 'var(--success)' : lote.viabilidad_final ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {lote.viabilidad_final ? `${lote.viabilidad_final}%` : '—'}
                    </span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Fechas</span>
                    <span style={{ fontSize: 13 }}>Inicio: {lote.fecha_inicio}</span>
                    <span className="kpi-sub">Est: {lote.fecha_fin_estimada || '—'}</span>
                </div>
            </div>

            <div className="grid-55-45">
                {/* QC Results */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Resultados QC</span>
                        <span className="badge badge-neutral">{lote.resultados?.length || 0} parámetros</span>
                    </div>
                    {lote.resultados?.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>Parámetro</th><th>Valor</th><th>Spec</th><th>Resultado</th><th>Analista</th></tr></thead>
                            <tbody>
                                {lote.resultados.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600 }}>{r.parametro_nombre}</td>
                                        <td>{r.valor} {r.unidad}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {r.spec_min !== null ? `≥${r.spec_min}` : ''}{r.spec_min !== null && r.spec_max !== null ? ' · ' : ''}{r.spec_max !== null ? `≤${r.spec_max}` : ''}
                                        </td>
                                        <td>
                                            <span className={`badge ${r.resultado === 'PASS' ? 'badge-success' : r.resultado === 'FAIL' ? 'badge-danger' : 'badge-warning'}`}>
                                                {r.resultado}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.analista_nombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state">Sin resultados QC registrados</div>}
                </div>

                {/* Workflow + Signatures */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Process Timeline */}
                    {lote.etapas?.length > 0 && (
                        <div className="card">
                            <div className="card-header"><span className="card-title">Progreso de Fabricación</span></div>
                            <div className="timeline">
                                {lote.etapas.map(e => (
                                    <div key={e.id} className={`timeline-step ${e.estado === 'completada' ? 'completed' : ''}`}>
                                        <div className={`timeline-dot ${e.estado === 'completada' ? 'completed' : e.estado === 'en_progreso' ? 'active' : ''}`}>
                                            {e.estado === 'completada' ? <CheckCircle size={14} /> : e.orden}
                                        </div>
                                        <span className="timeline-label">{e.etapa_nombre}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="card">
                        <div className="card-header"><span className="card-title">Cadena de Aprobación</span></div>
                        <div className="approval-chain">
                            {['qc_analyst', 'qc_supervisor', 'qualified_person'].map(tipo => {
                                const firma = lote.firmas?.find(f => f.tipo_firma === tipo);
                                return (
                                    <div key={tipo} className="approval-step">
                                        <div className={`approval-dot ${firma ? 'signed' : 'pending'}`}>
                                            {firma ? <CheckCircle size={14} style={{ color: 'var(--success)' }} /> : <Clock size={14} style={{ color: 'var(--warning)' }} />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                {tipo === 'qc_analyst' ? 'QC Analyst' : tipo === 'qc_supervisor' ? 'QC Supervisor' : 'Qualified Person'}
                                            </div>
                                            {firma ? (
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {firma.firmante_nombre} — {firma.fecha_firma} — <span style={{ color: 'var(--success)' }}>{firma.decision}</span>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 12, color: 'var(--warning)' }}>Pendiente</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {lote.estado === 'qc_pendiente' && (
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/firmas')}>
                                <FileText size={14} /> Ir a Firmar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
