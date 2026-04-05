import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from './db.js';

const GEMINI_API_KEY = 'AIzaSyCJlTjQlDNnu9tMo7UYsenkIG8nr8u45fs';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `Eres ARIA (Asistente de Revisión e Inteligencia Analítica), un asistente especializado integrado en el sistema de Control de Calidad CAR-T Lab QC Microbiología.

Tu especialización:
- Terapias celulares CAR-T (CD19, BCMA, CD22)
- Normativas GMP, FDA 21 CFR Part 11, EMA GMP Guidelines
- Control de calidad microbiológico en medicamentos de terapia avanzada (ATMPs)
- Interpretación de resultados QC: viabilidad celular, pureza CD3+, esterilidad, endotoxinas, micoplasma, vector copy number
- Gestión de lotes de producción, workflow y firmas electrónicas
- Análisis de riesgo en producción CAR-T

Reglas de comportamiento:
- Responde SIEMPRE en español
- Sé conciso y directo (máx 3 párrafos por respuesta)
- Cita datos específicos cuando los tengas en el contexto
- Si detectas anomalías en los datos del contexto, resáltalas con ⚠️
- Usa terminología técnica de laboratorio (GMP, SOP, OOS, etc.)
- NUNCA inventes datos que no estén en el contexto proporcionado
- Cuando des recomendaciones de acción, precédalas con 📋

Formato de respuesta:
- Usa **negrita** para términos clave
- Usa listas con guiones para múltiples puntos
- Mantén un tono profesional pero accesible`;

// Genera el contexto dinámico según la pantalla activa
export async function buildPageContext(pageContext) {
    const db = getDb();
    const ctx = { page: pageContext, data: {} };

    try {
        if (pageContext === 'dashboard' || pageContext === 'general') {
            ctx.data.stats = {
                totalLotes: db.prepare('SELECT COUNT(*) as c FROM lotes_produccion').get().c,
                lotesEnProceso: db.prepare("SELECT COUNT(*) as c FROM lotes_produccion WHERE estado IN ('en_proceso','qc_pendiente')").get().c,
                alertasActivas: db.prepare("SELECT COUNT(*) as c FROM alertas_qc WHERE estado='activa'").get().c,
                avgViabilidad: db.prepare("SELECT ROUND(AVG(viabilidad_final),1) as v FROM lotes_produccion WHERE viabilidad_final IS NOT NULL").get().v,
            };
            ctx.data.lotesRiesgo = db.prepare(
                "SELECT lote_id, estado, tipo_producto, ROUND(viabilidad_final,1) as viabilidad FROM lotes_produccion WHERE estado IN ('en_hold','rechazado') OR (estado='en_proceso' AND date('now') > date(fecha_fin_estimada)) ORDER BY estado"
            ).all();
            ctx.data.alertasCriticas = db.prepare(
                "SELECT mensaje, severidad, origen FROM alertas_qc WHERE estado='activa' ORDER BY CASE severidad WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END LIMIT 5"
            ).all();
        }

        if (pageContext === 'workflow') {
            ctx.data.etapasActivas = db.prepare(
                `SELECT lp.lote_id, ep.nombre as etapa, le.estado, le.progreso_pct, p.nombre||' '||p.apellido as paciente
         FROM lote_etapas le JOIN lotes_produccion lp ON lp.id=le.id_lote JOIN etapas_proceso ep ON ep.id=le.id_etapa
         JOIN pacientes p ON p.id=lp.id_paciente WHERE le.estado IN ('en_progreso','en_hold') ORDER BY ep.orden`
            ).all();
        }

        if (pageContext === 'monitor') {
            ctx.data.ultimasLecturas = db.prepare(
                `SELECT sl.nombre as sala, la.temperatura, la.co2_pct, la.humedad_pct, la.timestamp_lectura
         FROM lecturas_ambientales la JOIN salas_limpias sl ON sl.id=la.id_sala
         WHERE la.id IN (SELECT MAX(id) FROM lecturas_ambientales GROUP BY id_sala)`
            ).all();
            ctx.data.equiposEnFalla = db.prepare(
                "SELECT nombre, estado_operativo, ubicacion FROM equipos WHERE estado_operativo != 'operativo'"
            ).all();
        }

        if (pageContext === 'inventario') {
            ctx.data.stockBajo = db.prepare(
                `SELECT r.nombre, SUM(CASE WHEN lr.estado='disponible' THEN lr.stock_actual ELSE 0 END) as stock, r.stock_minimo, r.unidad_medida
         FROM reactivos r LEFT JOIN lotes_reactivos lr ON lr.id_reactivo=r.id GROUP BY r.id
         HAVING stock <= r.stock_minimo ORDER BY stock`
            ).all();
            ctx.data.caducados = db.prepare(
                "SELECT r.nombre, lr.numero_lote, lr.fecha_caducidad FROM lotes_reactivos lr JOIN reactivos r ON r.id=lr.id_reactivo WHERE lr.estado='caducado'"
            ).all();
        }

        if (pageContext === 'firmas') {
            ctx.data.lotesPendientesFirma = db.prepare(
                `SELECT lp.lote_id, lp.estado, p.nombre||' '||p.apellido as paciente,
         COUNT(fe.id) as firmas_completadas FROM lotes_produccion lp JOIN pacientes p ON p.id=lp.id_paciente
         LEFT JOIN firmas_electronicas fe ON fe.id_lote=lp.id WHERE lp.estado='qc_pendiente' GROUP BY lp.id`
            ).all();
        }

        if (pageContext === 'analiticas') {
            ctx.data.kpis = {
                totalLotes: db.prepare('SELECT COUNT(*) as c FROM lotes_produccion').get().c,
                firstPassYield: db.prepare(`SELECT ROUND(CAST(SUM(CASE WHEN estado='aprobado' THEN 1 ELSE 0 END) AS REAL)/NULLIF(SUM(CASE WHEN estado IN ('aprobado','rechazado') THEN 1 ELSE 0 END),0)*100,1) as v FROM lotes_produccion`).get().v,
                avgViabilidad: db.prepare("SELECT ROUND(AVG(viabilidad_final),1) as v FROM lotes_produccion WHERE viabilidad_final IS NOT NULL").get().v,
            };
        }

        if (pageContext === 'formulario-qc') {
            ctx.data.parametros = db.prepare('SELECT nombre, unidad, spec_min, spec_max FROM parametros_qc WHERE activo=1').all();
            ctx.data.ultimosResultados = db.prepare(
                `SELECT pq.nombre as parametro, rq.valor, rq.resultado, rq.fecha_analisis
         FROM resultados_qc rq JOIN parametros_qc pq ON pq.id=rq.id_parametro ORDER BY rq.created_at DESC LIMIT 10`
            ).all();
        }
    } catch (e) {
        console.error('Error building context:', e.message);
    }

    return ctx;
}

// Envía mensaje a Gemini con contexto dinámico de DB
export async function chatWithGemini(message, pageContext, history = []) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const contextData = await buildPageContext(pageContext);

    const contextBlock = `
=== DATOS EN TIEMPO REAL DEL SISTEMA (${new Date().toLocaleString('es-ES')}) ===
Pantalla activa: ${pageContext}
${JSON.stringify(contextData.data, null, 2)}
=== FIN DE DATOS ===
`;

    // Gemini usa 'model' en lugar de 'assistant'
    const geminiHistory = history.slice(-10).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + contextBlock }] },
            { role: 'model', parts: [{ text: 'Entendido. Soy ARIA, tu asistente CAR-T Lab. Tengo acceso a los datos en tiempo real del sistema. ¿En qué puedo ayudarte?' }] },
            ...geminiHistory
        ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return {
        reply: response,
        tokensUsed: result.response.usageMetadata?.totalTokenCount || null
    };
}
