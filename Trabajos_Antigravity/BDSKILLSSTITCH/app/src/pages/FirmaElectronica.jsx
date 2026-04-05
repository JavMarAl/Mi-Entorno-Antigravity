import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, FileText, Shield } from 'lucide-react';

const API = 'http://localhost:3001/api';

export default function FirmaElectronica() {
    const [lotes, setLotes] = useState([]);
    const [selected, setSelected] = useState(null);
    const [data, setData] = useState(null);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetch(`${API}/lotes`).then(r => r.json()).then(l => {
            setLotes(l.filter(x => x.estado === 'qc_pendiente' || x.estado === 'aprobado'));
        });
    }, []);

    useEffect(() => {
        if (selected) {
            fetch(`${API}/firmas/${selected}`).then(r => r.json()).then(setData);
        }
    }, [selected]);

    const firmar = async (tipo, decision) => {
        const userMap = { qc_analyst: 1, qc_supervisor: 2, qualified_person: 3 };
        const res = await fetch(`${API}/firmas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_lote: selected, id_usuario: userMap[tipo], tipo_firma: tipo, decision })
        });
        if (res.ok) {
            setMsg(`✅ Firma ${tipo.replace(/_/g, ' ')} registrada: ${decision}`);
            fetch(`${API}/firmas/${selected}`).then(r => r.json()).then(setData);
            setTimeout(() => setMsg(''), 3000);
        } else {
            const err = await res.json();
            setMsg(`❌ ${err.error}`);
        }
    };

    const firmaTypes = [
        { key: 'qc_analyst', label: 'QC Analyst', icon: FileText },
        { key: 'qc_supervisor', label: 'QC Supervisor', icon: Shield },
        { key: 'qualified_person', label: 'Qualified Person', icon: Shield },
    ];

    return (
        <div className="animate-in">
            <div className="grid-55-45">
                {/* Left: Lot selector + QC Results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card">
                        <div className="card-header"><span className="card-title">Seleccionar Lote</span></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {lotes.length === 0 && <div className="empty-state">No hay lotes pendientes de firma</div>}
                            {lotes.map(l => (
                                <div key={l.id} onClick={() => setSelected(l.id)} style={{
                                    padding: 12, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                    background: selected === l.id ? 'rgba(19,91,236,0.12)' : 'var(--bg-tertiary)',
                                    border: selected === l.id ? '1px solid var(--accent)' : '1px solid transparent',
                                    display: 'flex', alignItems: 'center', gap: 12, transition: 'var(--transition)'
                                }}>
                                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{l.lote_id}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.paciente_nombre}</span>
                                    <span className={`badge ${l.estado === 'qc_pendiente' ? 'badge-warning' : 'badge-success'}`} style={{ marginLeft: 'auto' }}>
                                        {l.estado === 'qc_pendiente' ? 'Pendiente' : 'Aprobado'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {data && (
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Parámetros QC — {data.lote.lote_id}</span>
                                <span className="badge badge-info">{data.resultados.length} parámetros</span>
                            </div>
                            <table className="data-table">
                                <thead><tr><th>Parámetro</th><th>Resultado</th><th>Spec</th><th>Estado</th></tr></thead>
                                <tbody>
                                    {data.resultados.map(r => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600 }}>{r.parametro_nombre}</td>
                                            <td>{r.valor} {r.unidad}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {r.spec_min != null ? `≥${r.spec_min}` : ''}{r.spec_min != null && r.spec_max != null ? ' · ' : ''}{r.spec_max != null ? `≤${r.spec_max}` : ''}
                                            </td>
                                            <td><span className={`badge ${r.resultado === 'PASS' ? 'badge-success' : 'badge-danger'}`}>{r.resultado}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right: Approval chain */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card">
                        <div className="card-header"><span className="card-title">Cadena de Aprobación</span></div>
                        {!data ? <div className="empty-state">Seleccione un lote</div> : (
                            <div className="approval-chain">
                                {firmaTypes.map(({ key, label, icon: Icon }) => {
                                    const firma = data.firmas.find(f => f.tipo_firma === key);
                                    return (
                                        <div key={key} className="approval-step">
                                            <div className={`approval-dot ${firma ? 'signed' : 'pending'}`}>
                                                {firma ? <CheckCircle size={14} style={{ color: 'var(--success)' }} /> : <Clock size={14} style={{ color: 'var(--warning)' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                                                {firma ? (
                                                    <>
                                                        <div style={{ fontSize: 12, color: 'var(--success)' }}>{firma.firmante_nombre}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{firma.fecha_firma}</div>
                                                    </>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                                        <button className="btn btn-success btn-sm" onClick={() => firmar(key, 'aprobado')}>
                                                            <CheckCircle size={12} /> Aprobar
                                                        </button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => firmar(key, 'rechazado')}>
                                                            <XCircle size={12} /> Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {msg && <div style={{ marginTop: 12, fontSize: 13, padding: 8, borderRadius: 'var(--radius-xs)', background: 'var(--bg-tertiary)' }}>{msg}</div>}
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(19,91,236,0.08), rgba(99,102,241,0.05))' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <Shield size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            <strong>CFR 21 Part 11 Compliance</strong><br />
                            Las firmas electrónicas incluyen hash SHA-512, marca temporal, dirección IP y son inmutables una vez registradas. El audit trail completo se registra en la tabla <code>audit_log</code>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
