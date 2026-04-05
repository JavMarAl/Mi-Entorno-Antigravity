import express from 'express';
import cors from 'cors';
import { initDb, migrateAiChat, migrateV2, migrateV3 } from './db.js';
import { seed } from './seed.js';
import { chatWithGemini } from './gemini.js';

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

const db = initDb();
seed();
migrateAiChat(db);
migrateV2(db);
migrateV3(db);

// --- DASHBOARD ---
app.get('/api/dashboard', (req, res) => {
  const stats = {
    totalLotes: db.prepare('SELECT COUNT(*) as c FROM lotes_produccion').get().c,
    lotesEnProceso: db.prepare("SELECT COUNT(*) as c FROM lotes_produccion WHERE estado IN ('en_proceso','qc_pendiente')").get().c,
    lotesAprobados: db.prepare("SELECT COUNT(*) as c FROM lotes_produccion WHERE estado='aprobado'").get().c,
    lotesRechazados: db.prepare("SELECT COUNT(*) as c FROM lotes_produccion WHERE estado='rechazado'").get().c,
    lotesEnHold: db.prepare("SELECT COUNT(*) as c FROM lotes_produccion WHERE estado='en_hold'").get().c,
    avgViability: db.prepare("SELECT ROUND(AVG(viabilidad_final),1) as v FROM lotes_produccion WHERE viabilidad_final IS NOT NULL").get().v,
    alertasActivas: db.prepare("SELECT COUNT(*) as c FROM alertas_qc WHERE estado='activa'").get().c,
    reactivosBajoStock: 2
  };
  const lotesRecientes = db.prepare(`SELECT lp.*,p.nombre||' '||p.apellido as paciente_nombre,u.nombre||' '||u.apellido as analista_nombre
    FROM lotes_produccion lp JOIN pacientes p ON p.id=lp.id_paciente JOIN usuarios u ON u.id=lp.id_analista_responsable ORDER BY lp.fecha_inicio DESC LIMIT 10`).all();
  const alertas = db.prepare(`SELECT a.*,e.nombre as equipo_nombre,lp.lote_id FROM alertas_qc a LEFT JOIN equipos e ON e.id=a.id_equipo
    LEFT JOIN lotes_produccion lp ON lp.id=a.id_lote WHERE a.estado='activa' ORDER BY CASE a.severidad WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END`).all();
  res.json({ stats, lotesRecientes, alertas });
});

// --- LOTES ---
app.get('/api/lotes', (req, res) => {
  res.json(db.prepare(`SELECT lp.*,p.nombre||' '||p.apellido as paciente_nombre,u.nombre||' '||u.apellido as analista_nombre
    FROM lotes_produccion lp JOIN pacientes p ON p.id=lp.id_paciente JOIN usuarios u ON u.id=lp.id_analista_responsable ORDER BY lp.fecha_inicio DESC`).all());
});

app.get('/api/lotes/:id', (req, res) => {
  const lote = db.prepare(`SELECT lp.*,p.nombre||' '||p.apellido as paciente_nombre,p.numero_historia,p.diagnostico,
    u.nombre||' '||u.apellido as analista_nombre FROM lotes_produccion lp JOIN pacientes p ON p.id=lp.id_paciente
    JOIN usuarios u ON u.id=lp.id_analista_responsable WHERE lp.id=?`).get(req.params.id);
  if (!lote) return res.status(404).json({ error: 'Not found' });
  const resultados = db.prepare(`SELECT rq.*,pq.nombre as parametro_nombre,pq.unidad,pq.spec_min,pq.spec_max,
    u.nombre||' '||u.apellido as analista_nombre FROM resultados_qc rq JOIN parametros_qc pq ON pq.id=rq.id_parametro
    JOIN usuarios u ON u.id=rq.id_analista WHERE rq.id_lote=? ORDER BY rq.fecha_analisis`).all(req.params.id);
  const firmas = db.prepare(`SELECT fe.*,u.nombre||' '||u.apellido as firmante_nombre,u.rol FROM firmas_electronicas fe
    JOIN usuarios u ON u.id=fe.id_usuario WHERE fe.id_lote=? ORDER BY fe.fecha_firma`).all(req.params.id);
  const etapas = db.prepare(`SELECT le.*,ep.nombre as etapa_nombre,ep.orden,ep.ref_sop,u.nombre||' '||u.apellido as analista_nombre
    FROM lote_etapas le JOIN etapas_proceso ep ON ep.id=le.id_etapa JOIN usuarios u ON u.id=le.id_analista
    WHERE le.id_lote=? ORDER BY ep.orden`).all(req.params.id);
  res.json({ ...lote, resultados, firmas, etapas });
});

app.post('/api/lotes', (req, res) => {
  const { lote_id, id_paciente, id_analista_responsable, tipo_producto, fecha_inicio, fecha_fin_estimada } = req.body;
  try {
    const r = db.prepare('INSERT INTO lotes_produccion (lote_id,id_paciente,id_analista_responsable,tipo_producto,fecha_inicio,fecha_fin_estimada) VALUES (?,?,?,?,?,?)')
      .run(lote_id, id_paciente, id_analista_responsable, tipo_producto, fecha_inicio, fecha_fin_estimada);
    res.json({ id: r.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/lotes/:id', (req, res) => {
  const { estado, viabilidad_final } = req.body;
  db.prepare(`UPDATE lotes_produccion SET estado=COALESCE(?,estado),viabilidad_final=COALESCE(?,viabilidad_final),updated_at=datetime('now') WHERE id=?`)
    .run(estado || null, viabilidad_final || null, req.params.id);
  res.json({ ok: true });
});

// --- WORKFLOW ---
app.get('/api/workflow', (req, res) => {
  const etapas = db.prepare('SELECT * FROM etapas_proceso ORDER BY orden').all();
  const loteEtapas = db.prepare(`SELECT le.*,ep.nombre as etapa_nombre,ep.orden,lp.lote_id,p.nombre||' '||p.apellido as paciente_nombre,
    u.nombre||' '||u.apellido as analista_nombre FROM lote_etapas le JOIN etapas_proceso ep ON ep.id=le.id_etapa
    JOIN lotes_produccion lp ON lp.id=le.id_lote JOIN pacientes p ON p.id=lp.id_paciente JOIN usuarios u ON u.id=le.id_analista
    WHERE lp.estado IN ('en_proceso','qc_pendiente','en_hold') ORDER BY ep.orden`).all();
  res.json({ etapas, loteEtapas });
});

app.get('/api/workflow/:loteId/checklist/:etapaId', (req, res) => {
  const le = db.prepare('SELECT id FROM lote_etapas WHERE id_lote=? AND id_etapa=?').get(req.params.loteId, req.params.etapaId);
  if (!le) return res.json([]);
  res.json(db.prepare(`SELECT ci.*,COALESCE(lc.completado,0) as completado,lc.fecha_completado,u.nombre||' '||u.apellido as completado_por
    FROM checklist_items ci LEFT JOIN lote_checklist lc ON lc.id_checklist_item=ci.id AND lc.id_lote_etapa=?
    LEFT JOIN usuarios u ON u.id=lc.id_usuario WHERE ci.id_etapa=? ORDER BY ci.orden`).all(le.id, req.params.etapaId));
});

app.post('/api/workflow/checklist/toggle', (req, res) => {
  const { id_lote, id_etapa, id_checklist_item, completado } = req.body;
  const le = db.prepare('SELECT id FROM lote_etapas WHERE id_lote=? AND id_etapa=?').get(id_lote, id_etapa);
  if (!le) return res.status(404).json({ error: 'Not found' });
  db.prepare(`INSERT INTO lote_checklist (id_lote_etapa,id_checklist_item,completado,id_usuario,fecha_completado) VALUES (?,?,?,1,datetime('now'))
    ON CONFLICT(id_lote_etapa,id_checklist_item) DO UPDATE SET completado=?,fecha_completado=datetime('now'),id_usuario=1`)
    .run(le.id, id_checklist_item, completado ? 1 : 0, completado ? 1 : 0);
  res.json({ ok: true });
});

// --- RESULTADOS ---
app.post('/api/resultados', (req, res) => {
  const { id_muestra, id_lote, id_parametro, id_analista, valor, resultado, fecha_analisis } = req.body;
  try {
    const r = db.prepare('INSERT INTO resultados_qc (id_muestra,id_lote,id_parametro,id_analista,valor,resultado,fecha_analisis) VALUES (?,?,?,?,?,?,?)')
      .run(id_muestra, id_lote, id_parametro, id_analista, valor, resultado, fecha_analisis);
    res.json({ id: r.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// --- MONITOR ---
app.get('/api/monitor', (req, res) => {
  const equipos = db.prepare('SELECT e.*,sl.nombre as sala_nombre FROM equipos e LEFT JOIN salas_limpias sl ON sl.id=e.id_sala ORDER BY e.tipo,e.nombre').all();
  const salas = db.prepare('SELECT * FROM salas_limpias ORDER BY nombre').all();
  const ultimasLecturas = db.prepare(`SELECT la.*,sl.nombre as sala_nombre FROM lecturas_ambientales la JOIN salas_limpias sl ON sl.id=la.id_sala
    WHERE la.id IN (SELECT MAX(id) FROM lecturas_ambientales GROUP BY id_sala)`).all();
  const historial = db.prepare('SELECT la.*,sl.nombre as sala_nombre FROM lecturas_ambientales la JOIN salas_limpias sl ON sl.id=la.id_sala ORDER BY la.timestamp_lectura').all();
  const alertas = db.prepare(`SELECT a.*,e.nombre as equipo_nombre FROM alertas_qc a LEFT JOIN equipos e ON e.id=a.id_equipo
    WHERE a.origen IN ('ambiental','equipo') ORDER BY a.created_at DESC LIMIT 20`).all();
  res.json({ equipos, salas, ultimasLecturas, historial, alertas });
});

// --- INVENTARIO ---
app.get('/api/inventario', (req, res) => {
  const reactivos = db.prepare(`SELECT r.*,SUM(CASE WHEN lr.estado='disponible' THEN lr.stock_actual ELSE 0 END) as stock_total,
    COUNT(lr.id) as total_lotes,MIN(CASE WHEN lr.estado='disponible' THEN lr.fecha_caducidad END) as proxima_caducidad
    FROM reactivos r LEFT JOIN lotes_reactivos lr ON lr.id_reactivo=r.id GROUP BY r.id ORDER BY r.nombre`).all();
  const lotes = db.prepare('SELECT lr.*,r.nombre as reactivo_nombre FROM lotes_reactivos lr JOIN reactivos r ON r.id=lr.id_reactivo ORDER BY lr.fecha_caducidad').all();
  res.json({ reactivos, lotes });
});

// --- FIRMAS ---
app.get('/api/firmas/:loteId', (req, res) => {
  const lote = db.prepare(`SELECT lp.*,p.nombre||' '||p.apellido as paciente_nombre FROM lotes_produccion lp
    JOIN pacientes p ON p.id=lp.id_paciente WHERE lp.id=?`).get(req.params.loteId);
  if (!lote) return res.status(404).json({ error: 'Not found' });
  const resultados = db.prepare(`SELECT rq.*,pq.nombre as parametro_nombre,pq.unidad,pq.spec_min,pq.spec_max FROM resultados_qc rq
    JOIN parametros_qc pq ON pq.id=rq.id_parametro WHERE rq.id_lote=? ORDER BY pq.id`).all(req.params.loteId);
  const firmas = db.prepare(`SELECT fe.*,u.nombre||' '||u.apellido as firmante_nombre,u.rol FROM firmas_electronicas fe
    JOIN usuarios u ON u.id=fe.id_usuario WHERE fe.id_lote=? ORDER BY CASE fe.tipo_firma WHEN 'qc_analyst' THEN 1 WHEN 'qc_supervisor' THEN 2 ELSE 3 END`).all(req.params.loteId);
  res.json({ lote, resultados, firmas });
});

app.post('/api/firmas', (req, res) => {
  const { id_lote, id_usuario, tipo_firma, decision } = req.body;
  try {
    db.prepare(`INSERT INTO firmas_electronicas (id_lote,id_usuario,tipo_firma,decision,hash_firma,ip_address,fecha_firma) VALUES (?,?,?,?,?,?,datetime('now'))`)
      .run(id_lote, id_usuario, tipo_firma, decision, 'sha512_' + Math.random().toString(36).slice(2), '127.0.0.1');
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// --- ANALYTICS (legacy) ---
app.get('/api/analytics', (req, res) => {
  const kpis = {
    totalLotes: db.prepare('SELECT COUNT(*) as c FROM lotes_produccion').get().c,
    avgViability: db.prepare("SELECT ROUND(AVG(viabilidad_final),1) as v FROM lotes_produccion WHERE viabilidad_final IS NOT NULL").get().v,
    firstPassYield: db.prepare(`SELECT ROUND(CAST(SUM(CASE WHEN estado='aprobado' THEN 1 ELSE 0 END) AS REAL)/
      NULLIF(SUM(CASE WHEN estado IN ('aprobado','rechazado') THEN 1 ELSE 0 END),0)*100,1) as v FROM lotes_produccion`).get().v,
    avgTimeToRelease: null
  };
  const viabilidadPorLote = db.prepare("SELECT lote_id,viabilidad_final as viabilidad,estado FROM lotes_produccion WHERE viabilidad_final IS NOT NULL ORDER BY fecha_inicio").all();
  const lotesPorEstado = db.prepare('SELECT estado,COUNT(*) as count FROM lotes_produccion GROUP BY estado').all();
  const topAnalistas = db.prepare(`SELECT u.nombre||' '||u.apellido as nombre,u.rol,COUNT(DISTINCT rq.id_lote) as lotes_completados,
    ROUND(AVG(CASE WHEN pq.nombre='Viability' THEN rq.valor END),1) as avg_viabilidad,
    ROUND(CAST(SUM(CASE WHEN rq.resultado='PASS' THEN 1 ELSE 0 END) AS REAL)/COUNT(*)*100,1) as pass_rate
    FROM resultados_qc rq JOIN usuarios u ON u.id=rq.id_analista JOIN parametros_qc pq ON pq.id=rq.id_parametro GROUP BY u.id ORDER BY pass_rate DESC`).all();
  res.json({ kpis, viabilidadPorLote, lotesPorEstado, topAnalistas });
});

// ─── ESTADÍSTICAS AVANZADAS ────────────────────────────────────────────────────

// Helper: calcula estadísticas de un array de números
function calcStats(values, specMin, specMax) {
  if (!values.length) return null;
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const std = Math.sqrt(variance);
  const q1 = sorted[Math.floor(n * 0.25)];
  const mediana = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const ucl = mean + 3 * std;
  const lcl = mean - 3 * std;
  const cv_pct = mean !== 0 ? (std / mean) * 100 : 0;
  // Cp, Cpk (solo si hay specs)
  let cp = null, cpk = null;
  if (specMin != null && specMax != null && std > 0) {
    cp = (specMax - specMin) / (6 * std);
    const cpkU = (specMax - mean) / (3 * std);
    const cpkL = (mean - specMin) / (3 * std);
    cpk = Math.min(cpkU, cpkL);
  }
  const n_fuera_spec = values.filter(v =>
    (specMin != null && v < specMin) || (specMax != null && v > specMax)
  ).length;
  return {
    n, media: mean, desv_std: std, cv_pct, min_val: sorted[0], max_val: sorted[n - 1],
    q1, mediana, q3, ucl, lcl, cp, cpk, n_fuera_spec, spec_min: specMin, spec_max: specMax
  };
}

// Definición de parámetros y sus specs
const PARAM_SPECS = {
  viabilidad: { specMin: 70, specMax: 100, label: 'Viabilidad (%)', source: 'lotes', field: 'viabilidad_final' },
  pct_car: { specMin: 15, specMax: 100, label: '% CAR+ (%)', source: 'identidad', field: 'pct_car_positivo' },
  pct_cd3: { specMin: 80, specMax: 100, label: '% CD3+ (%)', source: 'identidad', field: 'pct_cd3' },
  ratio_cd4cd8: { specMin: null, specMax: null, label: 'Ratio CD4:CD8', source: 'identidad', field: 'ratio_cd4_cd8' },
  ifn_gamma: { specMin: 200, specMax: null, label: 'IFN-γ (pg/mL)', source: 'potencia', field: 'ifn_gamma_pgml' },
  vcn: { specMin: 0, specMax: 5, label: 'VCN (copias/genoma)', source: 'fisicoquimico', field: 'vcn_copias_genoma' },
  ph: { specMin: 6.0, specMax: 7.5, label: 'pH', source: 'fisicoquimico', field: 'ph' },
};

function getParamValues(parametro) {
  const spec = PARAM_SPECS[parametro];
  if (!spec) return { values: [], specMin: null, specMax: null, label: parametro, lotes: [] };
  let rows = [];
  if (spec.source === 'lotes') {
    rows = db.prepare(`SELECT lp.lote_id, lp.${spec.field} as valor, lp.fecha_inicio as fecha
      FROM lotes_produccion lp WHERE lp.${spec.field} IS NOT NULL ORDER BY lp.fecha_inicio`).all();
  } else if (spec.source === 'identidad') {
    rows = db.prepare(`SELECT lp.lote_id, pic.${spec.field} as valor, pic.fecha_analisis as fecha
      FROM pruebas_identidad_celular pic JOIN lotes_produccion lp ON lp.id=pic.id_lote
      WHERE pic.${spec.field} IS NOT NULL ORDER BY pic.fecha_analisis`).all();
  } else if (spec.source === 'potencia') {
    rows = db.prepare(`SELECT lp.lote_id, pp.${spec.field} as valor, pp.fecha_analisis as fecha
      FROM pruebas_potencia pp JOIN lotes_produccion lp ON lp.id=pp.id_lote
      WHERE pp.${spec.field} IS NOT NULL ORDER BY pp.fecha_analisis`).all();
  } else if (spec.source === 'fisicoquimico') {
    rows = db.prepare(`SELECT lp.lote_id, qf.${spec.field} as valor, qf.fecha_analisis as fecha
      FROM qc_fisicoquimico qf JOIN lotes_produccion lp ON lp.id=qf.id_lote
      WHERE qf.${spec.field} IS NOT NULL ORDER BY qf.fecha_analisis`).all();
  }
  return { values: rows.map(r => r.valor), specMin: spec.specMin, specMax: spec.specMax, label: spec.label, lotes: rows };
}

// GET /api/estadisticas/spc/:parametro — datos SPC con UCL/LCL
app.get('/api/estadisticas/spc/:parametro', (req, res) => {
  const { parametro } = req.params;
  const { values, specMin, specMax, label, lotes } = getParamValues(parametro);
  if (!values.length) return res.json({ parametro, label, puntos: [], stats: null });

  const stats = calcStats(values, specMin, specMax);
  // Construir serie con media móvil y UCL/LCL acumulados
  let puntos = [];
  let suma = 0, sumaCuad = 0;
  for (let i = 0; i < lotes.length; i++) {
    const v = lotes[i].valor;
    suma += v; sumaCuad += v * v;
    const n = i + 1;
    const mean_i = suma / n;
    const std_i = n > 1 ? Math.sqrt((sumaCuad - n * mean_i * mean_i) / (n - 1)) : 0;
    const ucl_i = mean_i + 3 * std_i;
    const lcl_i = mean_i - 3 * std_i;
    puntos.push({
      lote_id: lotes[i].lote_id, fecha: lotes[i].fecha, valor: v,
      media_movil: +mean_i.toFixed(2), ucl: +ucl_i.toFixed(2), lcl: +lcl_i.toFixed(2),
      spec_min: specMin, spec_max: specMax,
      es_outlier: v > ucl_i || v < lcl_i ? 1 : 0
    });
  }
  res.json({ parametro, label, puntos, stats, spec_min: specMin, spec_max: specMax });
});

// GET /api/estadisticas/capacidad/:parametro — Cp, Cpk y distribución
app.get('/api/estadisticas/capacidad/:parametro', (req, res) => {
  const { parametro } = req.params;
  const { values, specMin, specMax, label } = getParamValues(parametro);
  if (!values.length) return res.json({ parametro, label, stats: null, histograma: [] });

  const stats = calcStats(values, specMin, specMax);
  // Histograma: 8 bins
  const bins = 8;
  const min = stats.min_val, max = stats.max_val, range = max - min || 1;
  const binSize = range / bins;
  const histograma = Array.from({ length: bins }, (_, i) => ({
    rango: `${(min + i * binSize).toFixed(1)}–${(min + (i + 1) * binSize).toFixed(1)}`,
    count: values.filter(v => v >= min + i * binSize && v < min + (i + 1) * binSize).length
  }));
  res.json({ parametro, label, stats, histograma, spec_min: specMin, spec_max: specMax });
});

// GET /api/estadisticas/distribucion/:parametro — box-whisker por analista
app.get('/api/estadisticas/distribucion/:parametro', (req, res) => {
  const { parametro } = req.params;
  const { values, specMin, specMax, label } = getParamValues(parametro);
  const stats = calcStats(values, specMin, specMax);

  // Box-whisker por mes
  const { lotes } = getParamValues(parametro);
  const byMonth = {};
  lotes.forEach(r => {
    const mes = r.fecha ? r.fecha.substring(0, 7) : 'N/A';
    if (!byMonth[mes]) byMonth[mes] = [];
    byMonth[mes].push(r.valor);
  });
  const seriesMeses = Object.entries(byMonth).map(([mes, vals]) => {
    const s = calcStats(vals, specMin, specMax);
    return { grupo: mes, ...s };
  });
  res.json({ parametro, label, globalStats: stats, seriesMeses, spec_min: specMin, spec_max: specMax });
});

// GET /api/estadisticas/correlacion?x=viabilidad&y=pct_car — scatter con R²
app.get('/api/estadisticas/correlacion', (req, res) => {
  const { x = 'viabilidad', y = 'pct_car' } = req.query;
  const dataX = getParamValues(x);
  const dataY = getParamValues(y);

  // Cruzar por lote_id
  const xMap = {};
  dataX.lotes.forEach(r => { xMap[r.lote_id] = r.valor; });
  const puntos = dataY.lotes
    .filter(r => xMap[r.lote_id] != null)
    .map(r => ({ lote_id: r.lote_id, x: xMap[r.lote_id], y: r.valor }));

  let r2 = null;
  if (puntos.length > 1) {
    const xs = puntos.map(p => p.x);
    const ys = puntos.map(p => p.y);
    const n = puntos.length;
    const mx = xs.reduce((s, v) => s + v, 0) / n;
    const my = ys.reduce((s, v) => s + v, 0) / n;
    const cov = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0) / n;
    const sdx = Math.sqrt(xs.reduce((s, v) => s + Math.pow(v - mx, 2), 0) / n);
    const sdy = Math.sqrt(ys.reduce((s, v) => s + Math.pow(v - my, 2), 0) / n);
    const r = sdx && sdy ? cov / (sdx * sdy) : 0;
    r2 = +(r * r).toFixed(4);
  }

  res.json({
    x, y, labelX: dataX.label, labelY: dataY.label,
    puntos, r2, n: puntos.length
  });
});

// GET /api/estadisticas/resumen — todos los parámetros de un vistazo
app.get('/api/estadisticas/resumen', (req, res) => {
  const resumen = Object.entries(PARAM_SPECS).map(([key, spec]) => {
    const { values, specMin, specMax } = getParamValues(key);
    const stats = calcStats(values, specMin, specMax);
    return { parametro: key, label: spec.label, ...stats };
  });
  res.json(resumen);
});

// --- LOOKUPS ---
app.get('/api/pacientes', (req, res) => res.json(db.prepare('SELECT * FROM pacientes WHERE deleted_at IS NULL ORDER BY apellido').all()));
app.get('/api/usuarios', (req, res) => res.json(db.prepare('SELECT id,uuid,nombre,apellido,email,rol,activo FROM usuarios ORDER BY nombre').all()));
app.get('/api/parametros', (req, res) => res.json(db.prepare('SELECT * FROM parametros_qc WHERE activo=1 ORDER BY id').all()));
app.get('/api/muestras', (req, res) => res.json(db.prepare(`SELECT m.*,p.nombre||' '||p.apellido as paciente_nombre,lp.lote_id
  FROM muestras m JOIN pacientes p ON p.id=m.id_paciente LEFT JOIN lotes_produccion lp ON lp.id=m.id_lote ORDER BY m.fecha_recoleccion DESC`).all()));

app.patch('/api/alertas/:id/ack', (req, res) => {
  db.prepare(`UPDATE alertas_qc SET estado='reconocida',id_usuario_ack=1,fecha_ack=datetime('now') WHERE id=?`).run(req.params.id);
  res.json({ ok: true });
});

// --- IA CHAT (Gemini) ---
app.post('/api/ai/chat', async (req, res) => {
  const { message, pageContext = 'general', sessionId, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });

  try {
    const { reply, tokensUsed } = await chatWithGemini(message, pageContext, history);

    // Guardar en ai_chat_history (user + assistant)
    const saveMsg = db.prepare(
      'INSERT INTO ai_chat_history (session_id, page_context, role, content, tokens_used) VALUES (?,?,?,?,?)'
    );
    const insertMany = db.transaction(() => {
      saveMsg.run(sessionId, pageContext, 'user', message, null);
      saveMsg.run(sessionId, pageContext, 'assistant', reply, tokensUsed);
    });
    insertMany();

    res.json({ reply, tokensUsed, sessionId });
  } catch (e) {
    console.error('Gemini error:', e.message);
    res.status(500).json({ error: 'Error comunicándose con Gemini: ' + e.message });
  }
});

// Historial de chat por sesión
app.get('/api/ai/history/:sessionId', (req, res) => {
  const msgs = db.prepare(
    'SELECT role, content, page_context, created_at FROM ai_chat_history WHERE session_id=? ORDER BY created_at'
  ).all(req.params.sessionId);
  res.json(msgs);
});

app.listen(PORT, () => console.log(`\n🧬 CAR-T Lab API → http://localhost:${PORT}\n`));
