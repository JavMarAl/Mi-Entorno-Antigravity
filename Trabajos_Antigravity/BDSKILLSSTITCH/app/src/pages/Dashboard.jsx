import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

const API = 'http://localhost:3001/api';

const estadoBadge = {
    en_proceso: 'badge-info',
    qc_pendiente: 'badge-warning',
    aprobado: 'badge-success',
    rechazado: 'badge-danger',
    en_hold: 'badge-warning',
    enviado: 'badge-success',
};
const estadoLabel = {
    en_proceso: 'En Proceso',
    qc_pendiente: 'QC Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    en_hold: 'En Hold',
    enviado: 'Enviado',
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API}/dashboard`).then(r => r.json()).then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="empty-state">Cargando dashboard...</div>;

    const { stats, lotesRecientes, alertas } = data;

    return (
        <div className="animate-in">
            <div className="kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label">Lotes Totales</span>
                    <span className="kpi-value">{stats.totalLotes}</span>
                    <span className="kpi-sub">{stats.lotesEnProceso} en proceso</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Viabilidad Promedio</span>
                    <span className="kpi-value" style={{ color: 'var(--success)' }}>{stats.avgViability}%</span>
                    <span className="kpi-sub">Especificación: ≥70%</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Aprobados / Rechazados</span>
                    <span className="kpi-value">{stats.lotesAprobados}<span style={{ color: 'var(--text-muted)', fontSize: 18 }}> / {stats.lotesRechazados}</span></span>
                    <span className="kpi-sub">{stats.lotesEnHold} en hold</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Alertas Activas</span>
                    <span className="kpi-value" style={{ color: alertas.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{stats.alertasActivas}</span>
                    <span className="kpi-sub">{stats.reactivosBajoStock} reactivos bajo stock</span>
                </div>
            </div>

            <div className="grid-60-40">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Lotes Recientes</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/formulario')}>+ Nuevo</button>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Lote ID</th>
                                <th>Paciente</th>
                                <th>Producto</th>
                                <th>Estado</th>
                                <th>Viabilidad</th>
                                <th>Inicio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lotesRecientes.map(l => (
                                <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/lote/${l.id}`)}>
                                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{l.lote_id}</td>
                                    <td>{l.paciente_nombre}</td>
                                    <td>{l.tipo_producto.replace('CAR-T_', '')}</td>
                                    <td><span className={`badge ${estadoBadge[l.estado]}`}>{estadoLabel[l.estado]}</span></td>
                                    <td>{l.viabilidad_final ? `${l.viabilidad_final}%` : '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{l.fecha_inicio}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Alertas Activas</span>
                        <span className="badge badge-danger">{alertas.length}</span>
                    </div>
                    {alertas.length === 0 ? (
                        <div className="empty-state"><CheckCircle size={24} style={{ color: 'var(--success)' }} /><p>Sin alertas activas</p></div>
                    ) : (
                        alertas.map(a => (
                            <div key={a.id} className="alert-row">
                                <div className="alert-icon" style={{
                                    background: a.severidad === 'critical' ? 'var(--danger-bg)' : a.severidad === 'warning' ? 'var(--warning-bg)' : 'var(--info-bg)'
                                }}>
                                    {a.severidad === 'critical' ? <XCircle size={14} style={{ color: 'var(--danger)' }} /> :
                                        a.severidad === 'warning' ? <AlertTriangle size={14} style={{ color: 'var(--warning)' }} /> :
                                            <Activity size={14} style={{ color: 'var(--info)' }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13 }}>{a.mensaje}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {a.equipo_nombre || a.lote_id || a.origen}
                                    </div>
                                </div>
                                <span className={`badge ${a.severidad === 'critical' ? 'badge-danger' : 'badge-warning'}`}>
                                    {a.severidad}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
