import { useState, useEffect } from 'react';
import { Save, Plus } from 'lucide-react';

const API = 'http://localhost:3001/api';

export default function FormularioQC() {
    const [lotes, setLotes] = useState([]);
    const [muestras, setMuestras] = useState([]);
    const [parametros, setParametros] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id_muestra: '', id_lote: '', id_parametro: '', id_analista: '1', valor: '', fecha_analisis: new Date().toISOString().slice(0, 16) });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        Promise.all([
            fetch(`${API}/lotes`).then(r => r.json()),
            fetch(`${API}/muestras`).then(r => r.json()),
            fetch(`${API}/parametros`).then(r => r.json()),
            fetch(`${API}/usuarios`).then(r => r.json()),
        ]).then(([l, m, p, u]) => { setLotes(l); setMuestras(m); setParametros(p); setUsuarios(u); });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const param = parametros.find(p => p.id == form.id_parametro);
        let resultado = 'pendiente';
        if (param) {
            const val = parseFloat(form.valor);
            const minOk = param.spec_min === null || val >= param.spec_min;
            const maxOk = param.spec_max === null || val <= param.spec_max;
            resultado = (minOk && maxOk) ? 'PASS' : 'FAIL';
        }
        try {
            const res = await fetch(`${API}/resultados`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, resultado, fecha_analisis: form.fecha_analisis.replace('T', ' ') })
            });
            if (res.ok) {
                setMsg(`✅ Resultado registrado: ${resultado}`);
                setForm(f => ({ ...f, valor: '' }));
                setTimeout(() => setMsg(''), 3000);
            } else {
                const err = await res.json();
                setMsg(`❌ Error: ${err.error}`);
            }
        } catch (err) { setMsg(`❌ Error de conexión`); }
    };

    return (
        <div className="animate-in">
            <div className="grid-55-45">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Registrar Resultado QC</span>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="input-label">Lote de Producción</label>
                                <select className="input-field" value={form.id_lote} onChange={e => setForm(f => ({ ...f, id_lote: e.target.value }))} required>
                                    <option value="">Seleccionar lote...</option>
                                    {lotes.map(l => <option key={l.id} value={l.id}>{l.lote_id} — {l.paciente_nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="input-label">Muestra</label>
                                <select className="input-field" value={form.id_muestra} onChange={e => setForm(f => ({ ...f, id_muestra: e.target.value }))} required>
                                    <option value="">Seleccionar muestra...</option>
                                    {muestras.filter(m => !form.id_lote || m.id_lote == form.id_lote || !m.id_lote).map(m => (
                                        <option key={m.id} value={m.id}>{m.codigo_muestra} ({m.tipo_muestra})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="input-label">Parámetro QC</label>
                                <select className="input-field" value={form.id_parametro} onChange={e => setForm(f => ({ ...f, id_parametro: e.target.value }))} required>
                                    <option value="">Seleccionar parámetro...</option>
                                    {parametros.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="input-label">Analista</label>
                                <select className="input-field" value={form.id_analista} onChange={e => setForm(f => ({ ...f, id_analista: e.target.value }))} required>
                                    {usuarios.filter(u => u.rol !== 'readonly').map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.rol})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="input-label">Valor del Resultado</label>
                                <input className="input-field" type="number" step="0.0001" value={form.valor}
                                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="Ingrese el valor..." required />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Fecha y Hora del Análisis</label>
                                <input className="input-field" type="datetime-local" value={form.fecha_analisis}
                                    onChange={e => setForm(f => ({ ...f, fecha_analisis: e.target.value }))} required />
                            </div>
                        </div>
                        {form.id_parametro && (() => {
                            const p = parametros.find(x => x.id == form.id_parametro);
                            if (!p) return null;
                            return (
                                <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                                    <strong>Especificaciones:</strong> {p.spec_min !== null ? `Min: ${p.spec_min} ${p.unidad}` : ''} {p.spec_max !== null ? `Max: ${p.spec_max} ${p.unidad}` : ''}
                                    {' | '}<strong>Método:</strong> {p.metodo_analitico}
                                </div>
                            );
                        })()}
                        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                            <button type="submit" className="btn btn-primary"><Save size={14} /> Registrar Resultado</button>
                            {msg && <span style={{ fontSize: 13 }}>{msg}</span>}
                        </div>
                    </form>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Parámetros de Referencia</span>
                    </div>
                    <table className="data-table">
                        <thead><tr><th>Parámetro</th><th>Unidad</th><th>Min</th><th>Max</th></tr></thead>
                        <tbody>
                            {parametros.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                                    <td>{p.unidad}</td>
                                    <td>{p.spec_min ?? '—'}</td>
                                    <td>{p.spec_max ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
