import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Clock } from 'lucide-react';

const API = 'http://localhost:3001/api';

export default function Inventario() {
    const [data, setData] = useState(null);
    const [selectedReactivo, setSelectedReactivo] = useState(null);

    useEffect(() => {
        fetch(`${API}/inventario`).then(r => r.json()).then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="empty-state">Cargando inventario...</div>;

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="animate-in">
            {/* KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label"><Package size={12} /> Reactivos</span>
                    <span className="kpi-value">{data.reactivos.length}</span>
                    <span className="kpi-sub">{data.reactivos.filter(r => r.activo).length} activos</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Lotes Registrados</span>
                    <span className="kpi-value">{data.lotes.length}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label"><AlertTriangle size={12} /> Stock Bajo</span>
                    <span className="kpi-value" style={{ color: 'var(--warning)' }}>
                        {data.reactivos.filter(r => r.stock_total !== null && r.stock_total <= r.stock_minimo).length}
                    </span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label"><Clock size={12} /> Caducados</span>
                    <span className="kpi-value" style={{ color: 'var(--danger)' }}>
                        {data.lotes.filter(l => l.estado === 'caducado').length}
                    </span>
                </div>
            </div>

            <div className="grid-55-45">
                <div className="card">
                    <div className="card-header"><span className="card-title">Catálogo de Reactivos</span></div>
                    <table className="data-table">
                        <thead><tr><th>Reactivo</th><th>Fabricante</th><th>Stock</th><th>Estado</th><th>Próx. Caducidad</th></tr></thead>
                        <tbody>
                            {data.reactivos.map(r => {
                                const isLow = r.stock_total !== null && r.stock_total <= r.stock_minimo;
                                const expSoon = r.proxima_caducidad && r.proxima_caducidad <= today;
                                return (
                                    <tr key={r.id} onClick={() => setSelectedReactivo(r.id)} style={{ cursor: 'pointer', background: selectedReactivo === r.id ? 'rgba(19,91,236,0.08)' : 'transparent' }}>
                                        <td style={{ fontWeight: 600 }}>{r.nombre}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{r.fabricante}</td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text-primary)' }}>
                                                {r.stock_total ?? 0} {r.unidad_medida}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>min: {r.stock_minimo}</span>
                                        </td>
                                        <td>
                                            {isLow ? <span className="badge badge-danger">Stock Bajo</span> :
                                                expSoon ? <span className="badge badge-warning">Caducando</span> :
                                                    <span className="badge badge-success">OK</span>}
                                        </td>
                                        <td style={{ fontSize: 12, color: expSoon ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                            {r.proxima_caducidad || '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <div className="card-header"><span className="card-title">Lotes de Reactivo</span></div>
                    <table className="data-table">
                        <thead><tr><th>Lote</th><th>Reactivo</th><th>Stock</th><th>Caducidad</th><th>Estado</th></tr></thead>
                        <tbody>
                            {data.lotes
                                .filter(l => !selectedReactivo || l.id_reactivo === selectedReactivo)
                                .map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 600, fontSize: 12 }}>{l.numero_lote}</td>
                                        <td style={{ fontSize: 12 }}>{l.reactivo_nombre}</td>
                                        <td style={{ fontWeight: 600 }}>{l.stock_actual}</td>
                                        <td style={{ fontSize: 12, color: l.fecha_caducidad <= today ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                            {l.fecha_caducidad}
                                        </td>
                                        <td>
                                            <span className={`badge ${l.estado === 'disponible' ? 'badge-success' : l.estado === 'caducado' ? 'badge-danger' : 'badge-warning'}`}>
                                                {l.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
