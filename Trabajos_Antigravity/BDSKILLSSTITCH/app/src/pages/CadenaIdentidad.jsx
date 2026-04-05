import { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, Thermometer, User, ChevronDown } from 'lucide-react';

const mockLotes = [
    { id: 1, lote_id: 'CART-2026-0038', paciente: 'Alejandro Muñoz', producto: 'CAR-T CD19' },
    { id: 2, lote_id: 'CART-2026-0039', paciente: 'Isabel Torres', producto: 'CAR-T CD19' },
    { id: 4, lote_id: 'CART-2026-0041', paciente: 'Carmen Jiménez', producto: 'CAR-T CD19' },
];

const mockCOI = {
    1: {
        isbt: 'ES-0001-2026-00381',
        identifiers: [
            { label: 'Nombre completo', value: 'Alejandro Muñoz García' },
            { label: 'Fecha nacimiento', value: '14/03/1978' },
            { label: 'Nº Historia', value: 'HCL-2026-00123' },
            { label: 'DIN', value: 'ES001000000001' },
            { label: 'Código SEC (EU)', value: 'ES-MDS-001-2026-00381-10' },
        ],
        eventos: [
            { tipo: 'Recolección Aféresis', fecha: '10/01/2026 09:30', lugar: 'Hospital La Clínica', entrega: 'Dr. J. Martínez', recibe: 'Enf. Aféresis', temp: '4°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Recepción en Fabricación', fecha: '10/01/2026 14:20', lugar: 'Sala GMP ISO-7', entrega: 'Courier CelluCare', recibe: 'Ana Ruiz (QC)', temp: '4°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Criopreservación', fecha: '24/01/2026 16:00', lugar: 'Sala Crío B', entrega: 'Carlos López', recibe: 'María Santos', temp: '-196°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Almacenamiento LN₂', fecha: '24/01/2026 17:30', lugar: 'Tanque CRYO-003 B-12', entrega: 'María Santos', recibe: 'Luis Pérez', temp: '-196°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Envío a Hospital', fecha: 'Pendiente', lugar: 'Dry-shipper DS-042', entrega: '—', recibe: '—', temp: '—', estado: 'pendiente', inspeccion: '—' },
            { tipo: 'Entrega en Cama Paciente', fecha: 'Pendiente', lugar: 'Hospital Universitario', entrega: '—', recibe: '—', temp: '—', estado: 'pendiente', inspeccion: '—' },
        ],
    },
    2: {
        isbt: 'ES-0001-2026-00391',
        identifiers: [
            { label: 'Nombre completo', value: 'Isabel Torres Vidal' },
            { label: 'Fecha nacimiento', value: '22/07/1965' },
            { label: 'Nº Historia', value: 'HCL-2026-00118' },
            { label: 'DIN', value: 'ES001000000002' },
            { label: 'Código SEC (EU)', value: 'ES-MDS-001-2026-00391-10' },
        ],
        eventos: [
            { tipo: 'Recolección Aféresis', fecha: '15/01/2026 08:00', lugar: 'Hospital La Clínica', entrega: 'Dr. A. García', recibe: 'Enf. Aféresis', temp: '4°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Recepción en Fabricación', fecha: '15/01/2026 13:10', lugar: 'Sala GMP ISO-7', entrega: 'Courier CelluCare', recibe: 'Ana Ruiz (QC)', temp: '4°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Criopreservación', fecha: '28/01/2026 15:30', lugar: 'Sala Crío B', entrega: 'Carlos López', recibe: 'María Santos', temp: '-196°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Almacenamiento LN₂', fecha: '28/01/2026 16:45', lugar: 'Tanque CRYO-003 A-07', entrega: 'María Santos', recibe: 'Luis Pérez', temp: '-196°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Envío a Hospital', fecha: '02/02/2026 10:00', lugar: 'Dry-shipper DS-038', entrega: 'Luis Pérez', recibe: 'Enf. Oncología', temp: '-150°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Entrega en Cama Paciente', fecha: '02/02/2026 14:20', lugar: 'H. Universitario 5B', entrega: 'Enf. Oncología', recibe: 'Dr. R. Sánchez', temp: '—', estado: 'completado', inspeccion: 'Íntegro' },
        ],
    },
    4: {
        isbt: 'ES-0001-2026-00411',
        identifiers: [
            { label: 'Nombre completo', value: 'Carmen Jiménez López' },
            { label: 'Fecha nacimiento', value: '08/11/1980' },
            { label: 'Nº Historia', value: 'HCL-2026-00131' },
            { label: 'DIN', value: 'ES001000000004' },
            { label: 'Código SEC (EU)', value: 'ES-MDS-001-2026-00411-10' },
        ],
        eventos: [
            { tipo: 'Recolección Aféresis', fecha: '05/02/2026 10:00', lugar: 'Hospital La Clínica', entrega: 'Dr. J. Martínez', recibe: 'Enf. Aféresis', temp: '4°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Recepción en Fabricación', fecha: '05/02/2026 15:30', lugar: 'Sala GMP ISO-7', entrega: 'Courier CelluCare', recibe: 'Ana Ruiz (QC)', temp: '4°C', estado: 'completado', inspeccion: 'Íntegro' },
            { tipo: 'Criopreservación', fecha: 'Pendiente', lugar: '—', entrega: '—', recibe: '—', temp: '—', estado: 'pendiente', inspeccion: '—' },
            { tipo: 'Almacenamiento LN₂', fecha: 'Pendiente', lugar: '—', entrega: '—', recibe: '—', temp: '—', estado: 'pendiente', inspeccion: '—' },
            { tipo: 'Envío a Hospital', fecha: 'Pendiente', lugar: '—', entrega: '—', recibe: '—', temp: '—', estado: 'pendiente', inspeccion: '—' },
            { tipo: 'Entrega en Cama Paciente', fecha: 'Pendiente', lugar: '—', entrega: '—', recibe: '—', temp: '—', estado: 'pendiente', inspeccion: '—' },
        ],
    },
};

function EventNode({ ev, index, isLast }) {
    const done = ev.estado === 'completado';
    const color = done ? 'var(--success)' : 'var(--text-muted)';
    return (
        <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
            {/* Línea vertical */}
            {!isLast && (
                <div style={{ position: 'absolute', left: 19, top: 40, bottom: -8, width: 2, background: done ? 'var(--success)' : 'var(--border)', opacity: 0.5, zIndex: 0 }} />
            )}
            {/* Nodo */}
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: done ? 'var(--success-bg)' : 'var(--bg-tertiary)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                {done ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : <Clock size={16} style={{ color: 'var(--text-muted)' }} />}
            </div>
            {/* Contenido */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 24 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{ev.tipo}</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 6 }}>{ev.fecha} {ev.lugar !== '—' && `• ${ev.lugar}`}</div>
                {done && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <User size={10} /> {ev.entrega} → {ev.recibe}
                        </span>
                        {ev.temp !== '—' && (
                            <span style={{ fontSize: 11, background: 'var(--info-bg)', padding: '3px 8px', borderRadius: 4, color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Thermometer size={10} /> {ev.temp}
                            </span>
                        )}
                        <span style={{ fontSize: 11, background: 'var(--success-bg)', padding: '3px 8px', borderRadius: 4, color: 'var(--success)' }}>✓ {ev.inspeccion}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CadenaIdentidad() {
    const [selectedId, setSelectedId] = useState(1);
    const lote = mockLotes.find(l => l.id === selectedId);
    const data = mockCOI[selectedId];
    const completados = data.eventos.filter(e => e.estado === 'completado').length;
    const total = data.eventos.length;

    return (
        <div className="animate-in">
            {/* Selector */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Lote:</label>
                    <div style={{ position: 'relative' }}>
                        <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 32px 8px 12px', fontSize: 13, appearance: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                            {mockLotes.map(l => <option key={l.id} value={l.id}>{l.lote_id} — {l.paciente}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>
                    <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text-muted)' }}>Código ISBT-128:</span> <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{data.isbt}</strong></span>
                    <span className="badge badge-success" style={{ fontSize: 11 }}>Sin Discrepancias</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
                {/* Timeline */}
                <div className="card">
                    <div className="card-header"><span className="card-title">📍 Timeline COI/COC</span></div>
                    <div style={{ padding: '8px 0' }}>
                        {data.eventos.map((ev, i) => (
                            <EventNode key={i} ev={ev} index={i} isLast={i === data.eventos.length - 1} />
                        ))}
                    </div>
                </div>

                {/* Panel derecho */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Integridad */}
                    <div className="card">
                        <div className="card-header"><span className="card-title">Integridad COI</span></div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>
                            {completados}/{total}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>eventos completados</div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(completados / total) * 100}%`, background: completados === total ? 'var(--success)' : 'var(--accent)' }} />
                        </div>
                    </div>

                    {/* Identificadores cruzados */}
                    <div className="card" style={{ flex: 1 }}>
                        <div className="card-header"><span className="card-title">Identificadores Cruzados</span></div>
                        {data.identifiers.map((id, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{id.label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{id.value}</span>
                                    <CheckCircle size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Alertas */}
                    <div className="card">
                        <div className="card-header"><span className="card-title">Estado</span></div>
                        <div className="empty-state" style={{ padding: '12px 0' }}>
                            <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                            <p style={{ fontSize: 12, margin: '4px 0 0' }}>Sin discrepancias COI/COC</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
