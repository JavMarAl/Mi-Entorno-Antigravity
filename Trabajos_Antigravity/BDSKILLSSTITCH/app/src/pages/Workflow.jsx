import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Pause, Play } from 'lucide-react';

const API = 'http://localhost:3001/api';

const etapaColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function Workflow() {
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState(1);
    const [checklist, setChecklist] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);

    useEffect(() => {
        fetch(`${API}/workflow`).then(r => r.json()).then(setData).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedLote && activeTab) {
            fetch(`${API}/workflow/${selectedLote}/checklist/${activeTab}`)
                .then(r => r.json()).then(setChecklist).catch(() => setChecklist([]));
        }
    }, [selectedLote, activeTab]);

    const toggleChecklist = async (itemId, completed) => {
        await fetch(`${API}/workflow/checklist/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_lote: selectedLote, id_etapa: activeTab, id_checklist_item: itemId, completado: !completed })
        });
        const res = await fetch(`${API}/workflow/${selectedLote}/checklist/${activeTab}`);
        setChecklist(await res.json());
    };

    if (!data) return <div className="empty-state">Cargando workflow...</div>;

    const activeLotes = data.loteEtapas.filter(le => le.id_etapa === activeTab);
    const activeEtapa = data.etapas.find(e => e.id === activeTab);

    return (
        <div className="animate-in">
            {/* Stage tabs */}
            <div className="tabs">
                {data.etapas.map((e, i) => (
                    <button key={e.id} className={`tab ${activeTab === e.id ? 'active' : ''}`} onClick={() => { setActiveTab(e.id); setSelectedLote(null); setChecklist([]); }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: etapaColors[i], marginRight: 6 }}></span>
                        {e.nombre}
                    </button>
                ))}
            </div>

            <div className="grid-3">
                {/* Stage info */}
                <div className="card">
                    <div className="card-header"><span className="card-title">Detalle de Etapa</span></div>
                    {activeEtapa && (
                        <>
                            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{activeEtapa.nombre}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{activeEtapa.descripcion}</div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>SOP:</span> <span style={{ fontWeight: 600 }}>{activeEtapa.ref_sop}</span></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Duración est.:</span> <span style={{ fontWeight: 600 }}>{activeEtapa.duracion_estimada_horas}h</span></div>
                            </div>
                            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                Lotes en esta etapa: <strong style={{ color: 'var(--accent)' }}>{activeLotes.length}</strong>
                            </div>
                        </>
                    )}
                </div>

                {/* Active lots in this stage */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Lotes Activos</span>
                        <span className="badge badge-info">{activeLotes.length}</span>
                    </div>
                    {activeLotes.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>Lote</th><th>Paciente</th><th>Estado</th><th>Progreso</th></tr></thead>
                            <tbody>
                                {activeLotes.map(le => (
                                    <tr key={le.id} onClick={() => setSelectedLote(le.id_lote)} style={{ cursor: 'pointer', background: selectedLote === le.id_lote ? 'rgba(19,91,236,0.08)' : 'transparent' }}>
                                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{le.lote_id}</td>
                                        <td>{le.paciente_nombre}</td>
                                        <td>
                                            {le.estado === 'completada' ? <span className="badge badge-success"><CheckCircle size={10} /> Completada</span> :
                                                le.estado === 'en_progreso' ? <span className="badge badge-info"><Play size={10} /> En progreso</span> :
                                                    le.estado === 'en_hold' ? <span className="badge badge-warning"><Pause size={10} /> En hold</span> :
                                                        <span className="badge badge-neutral"><Circle size={10} /> Pendiente</span>}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress-bar" style={{ flex: 1 }}>
                                                    <div className="progress-fill" style={{ width: `${le.progreso_pct}%`, background: le.progreso_pct === 100 ? 'var(--success)' : 'var(--accent)' }} />
                                                </div>
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 32 }}>{le.progreso_pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state" style={{ padding: 20 }}>No hay lotes en esta etapa</div>}
                </div>

                {/* Checklist */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Checklist</span>
                        {checklist.length > 0 && <span className="badge badge-neutral">{checklist.filter(c => c.completado).length}/{checklist.length}</span>}
                    </div>
                    {selectedLote && checklist.length > 0 ? (
                        <>
                            <div className="progress-bar" style={{ marginBottom: 16 }}>
                                <div className="progress-fill" style={{ width: `${(checklist.filter(c => c.completado).length / checklist.length * 100)}%`, background: 'var(--success)' }} />
                            </div>
                            {checklist.map(item => (
                                <div key={item.id} className="checklist-item" onClick={() => toggleChecklist(item.id, item.completado)}>
                                    <div className={`checklist-checkbox ${item.completado ? 'checked' : ''}`}>
                                        {item.completado && <CheckCircle size={12} style={{ color: 'white' }} />}
                                    </div>
                                    <span className={`checklist-text ${item.completado ? 'checked' : ''}`}>{item.descripcion}</span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="empty-state" style={{ padding: 20 }}>
                            {selectedLote ? 'Sin items de checklist' : 'Seleccione un lote'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
