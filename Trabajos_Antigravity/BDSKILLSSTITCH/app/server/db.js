import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'cart_lab.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const database = getDb();

  const tableCheck = database.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'"
  ).get();

  if (tableCheck) {
    console.log('✓ Database already initialized');
    return database;
  }

  console.log('⏳ Initializing database schema...');

  const schema = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('qc_analyst','qc_supervisor','qualified_person','admin','readonly')),
      activo INTEGER NOT NULL DEFAULT 1,
      ultimo_acceso TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      fecha_nacimiento TEXT NOT NULL,
      numero_historia TEXT NOT NULL UNIQUE,
      diagnostico TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS lotes_produccion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lote_id TEXT NOT NULL UNIQUE,
      id_paciente INTEGER NOT NULL,
      id_analista_responsable INTEGER NOT NULL,
      tipo_producto TEXT NOT NULL CHECK(tipo_producto IN ('CAR-T_CD19','CAR-T_BCMA','CAR-T_CD22','otro')),
      estado TEXT NOT NULL DEFAULT 'en_proceso' CHECK(estado IN ('en_proceso','qc_pendiente','aprobado','rechazado','en_hold','enviado')),
      fecha_inicio TEXT NOT NULL,
      fecha_fin_estimada TEXT,
      fecha_fin_real TEXT,
      viabilidad_final REAL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_paciente) REFERENCES pacientes(id),
      FOREIGN KEY (id_analista_responsable) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS etapas_proceso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      orden INTEGER NOT NULL,
      descripcion TEXT,
      ref_sop TEXT,
      duracion_estimada_horas INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lote_etapas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,
      id_etapa INTEGER NOT NULL,
      id_analista INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','en_progreso','completada','en_hold')),
      progreso_pct REAL NOT NULL DEFAULT 0,
      fecha_inicio TEXT,
      fecha_fin TEXT,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(id_lote, id_etapa),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_etapa) REFERENCES etapas_proceso(id),
      FOREIGN KEY (id_analista) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_etapa INTEGER NOT NULL,
      descripcion TEXT NOT NULL,
      orden INTEGER NOT NULL,
      obligatorio INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_etapa) REFERENCES etapas_proceso(id)
    );

    CREATE TABLE IF NOT EXISTS lote_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote_etapa INTEGER NOT NULL,
      id_checklist_item INTEGER NOT NULL,
      completado INTEGER NOT NULL DEFAULT 0,
      id_usuario INTEGER,
      fecha_completado TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(id_lote_etapa, id_checklist_item),
      FOREIGN KEY (id_lote_etapa) REFERENCES lote_etapas(id),
      FOREIGN KEY (id_checklist_item) REFERENCES checklist_items(id),
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS muestras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_muestra TEXT NOT NULL UNIQUE,
      id_paciente INTEGER NOT NULL,
      id_lote INTEGER,
      tipo_muestra TEXT NOT NULL CHECK(tipo_muestra IN ('aferesis','sangre_periferica','producto_intermedio','producto_final','retencion')),
      fecha_recoleccion TEXT NOT NULL,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_paciente) REFERENCES pacientes(id),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id)
    );

    CREATE TABLE IF NOT EXISTS parametros_qc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      unidad TEXT NOT NULL,
      spec_min REAL,
      spec_max REAL,
      metodo_analitico TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reactivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      fabricante TEXT NOT NULL,
      catalogo TEXT,
      unidad_medida TEXT NOT NULL,
      stock_minimo INTEGER NOT NULL DEFAULT 5,
      condicion_almacenamiento TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lotes_reactivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_lote TEXT NOT NULL,
      id_reactivo INTEGER NOT NULL,
      fecha_recepcion TEXT NOT NULL,
      fecha_caducidad TEXT NOT NULL,
      stock_actual INTEGER NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'disponible' CHECK(estado IN ('disponible','agotado','caducado','cuarentena')),
      certificado_analisis TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_reactivo) REFERENCES reactivos(id)
    );

    CREATE TABLE IF NOT EXISTS resultados_qc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_muestra INTEGER NOT NULL,
      id_lote INTEGER NOT NULL,
      id_parametro INTEGER NOT NULL,
      id_analista INTEGER NOT NULL,
      id_lote_reactivo INTEGER,
      valor REAL NOT NULL,
      resultado TEXT NOT NULL DEFAULT 'pendiente' CHECK(resultado IN ('PASS','FAIL','OOS','pendiente')),
      observaciones TEXT,
      fecha_analisis TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_muestra) REFERENCES muestras(id),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_parametro) REFERENCES parametros_qc(id),
      FOREIGN KEY (id_analista) REFERENCES usuarios(id),
      FOREIGN KEY (id_lote_reactivo) REFERENCES lotes_reactivos(id)
    );

    CREATE TABLE IF NOT EXISTS salas_limpias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      clasificacion TEXT NOT NULL CHECK(clasificacion IN ('ISO_5','ISO_7','ISO_8','no_clasificada')),
      estado TEXT NOT NULL DEFAULT 'operativa' CHECK(estado IN ('operativa','mantenimiento','fuera_servicio')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS equipos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('incubadora','bsc_hood','centrifuga','crioalmacenamiento','sensor_ambiental','otro')),
      ubicacion TEXT,
      id_sala INTEGER,
      numero_serie TEXT UNIQUE,
      estado_operativo TEXT NOT NULL DEFAULT 'operativo' CHECK(estado_operativo IN ('operativo','mantenimiento','alarma','fuera_servicio')),
      ultima_calibracion TEXT,
      proxima_calibracion TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_sala) REFERENCES salas_limpias(id)
    );

    CREATE TABLE IF NOT EXISTS lecturas_ambientales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_equipo INTEGER NOT NULL,
      id_sala INTEGER NOT NULL,
      temperatura REAL,
      co2_pct REAL,
      humedad_pct REAL,
      particulas INTEGER,
      timestamp_lectura TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_equipo) REFERENCES equipos(id),
      FOREIGN KEY (id_sala) REFERENCES salas_limpias(id)
    );

    CREATE TABLE IF NOT EXISTS alertas_qc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      severidad TEXT NOT NULL CHECK(severidad IN ('info','warning','critical')),
      mensaje TEXT NOT NULL,
      origen TEXT NOT NULL CHECK(origen IN ('ambiental','equipo','qc_resultado','inventario','sistema')),
      id_equipo INTEGER,
      id_lote INTEGER,
      estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa','reconocida','resuelta')),
      id_usuario_ack INTEGER,
      fecha_ack TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_equipo) REFERENCES equipos(id),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_usuario_ack) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS firmas_electronicas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,
      id_usuario INTEGER NOT NULL,
      tipo_firma TEXT NOT NULL CHECK(tipo_firma IN ('qc_analyst','qc_supervisor','qualified_person')),
      decision TEXT NOT NULL CHECK(decision IN ('aprobado','rechazado','revision_solicitada')),
      comentarios TEXT,
      hash_firma TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      fecha_firma TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(id_lote, tipo_firma),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER,
      accion TEXT NOT NULL CHECK(accion IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','SIGN','EXPORT')),
      tabla_afectada TEXT NOT NULL,
      registro_id INTEGER,
      datos_anteriores TEXT,
      datos_nuevos TEXT,
      ip_address TEXT,
      fecha TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
    );

    -- Tabla 18: Historial de chat con IA (Gemini)
    -- Almacena todas las conversaciones por sesión y pantalla
    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      page_context TEXT NOT NULL DEFAULT 'general',
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      tokens_used INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Índice para búsqueda por sesión (consulta frecuente)
    CREATE INDEX IF NOT EXISTS idx_chat_session ON ai_chat_history(session_id, created_at);
  `;

  database.exec(schema);
  console.log('✓ Schema created successfully (18 tables)');
  return database;
}

// Migración: añadir tabla ai_chat_history si ya existe la DB
export function migrateAiChat(database) {
  const exists = database.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='ai_chat_history'"
  ).get();
  if (!exists) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        page_context TEXT NOT NULL DEFAULT 'general',
        role TEXT NOT NULL CHECK(role IN ('user','assistant')),
        content TEXT NOT NULL,
        tokens_used INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_chat_session ON ai_chat_history(session_id, created_at);
    `);
    console.log('✓ Migración: tabla ai_chat_history creada');
  }
}

// ─── Migración V2: 6 nuevas tablas GMP (basadas en análisis NotebookLM) ──────
export function migrateV2(database) {
  const tables = [
    'pruebas_identidad_celular',
    'pruebas_potencia',
    'qc_fisicoquimico',
    'cadena_identidad_custodia',
    'registros_criogenicos',
    'eventos_adversos_clinicos',
  ];

  const allExist = tables.every(t =>
    database.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}'`).get()
  );

  if (allExist) {
    console.log('✓ Tablas V2 ya existen (tablas 19-24)');
    return;
  }

  console.log('⏳ Migrando BD a V2 (tablas 19-24)...');

  database.exec(`
    -- ─── Tabla 19: Identidad celular por citometría de flujo ────────────────
    CREATE TABLE IF NOT EXISTS pruebas_identidad_celular (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,
      etapa TEXT NOT NULL CHECK(etapa IN ('aferesis','seleccion','activacion','transduccion','expansion','producto_final')),
      pct_car_positivo REAL,               -- % células CAR+ (identidad)
      pct_cd3 REAL,                        -- % CD3+ pureza T-cell (spec ≥80%)
      pct_cd4 REAL,                        -- % CD4+
      pct_cd8 REAL,                        -- % CD8+
      ratio_cd4_cd8 REAL,                  -- Calculado CD4/CD8
      conteo_celulas_viables INTEGER,      -- Total células viables
      viabilidad REAL,                     -- % viabilidad (spec ≥70%)
      metodo TEXT NOT NULL DEFAULT 'flow_cytometry' CHECK(metodo IN ('flow_cytometry','trypan_blue','vi_cell')),
      resultado TEXT NOT NULL DEFAULT 'pendiente' CHECK(resultado IN ('PASS','FAIL','pendiente')),
      id_analista INTEGER NOT NULL,
      observaciones TEXT,
      fecha_analisis TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_analista) REFERENCES usuarios(id)
    );

    -- ─── Tabla 20: Pruebas de potencia (citotoxicidad y citoquinas) ─────────
    CREATE TABLE IF NOT EXISTS pruebas_potencia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,
      tipo_ensayo TEXT NOT NULL CHECK(tipo_ensayo IN ('citotoxicidad','produccion_citoquinas','ambos')),
      ratio_et TEXT CHECK(ratio_et IN ('1:1','5:1','10:1')),    -- E:T ratio
      viabilidad_target_pct REAL,          -- Spec: ≤70% viabilidad células tumorales
      ifn_gamma_pgml REAL,                 -- IFN-γ pg/mL
      tnf_alpha_pgml REAL,                 -- TNF-α pg/mL
      il2_pgml REAL,                       -- IL-2 pg/mL
      linea_celular_target TEXT,           -- línea tumoral usada (e.g. NALM-6 para CD19)
      resultado TEXT NOT NULL DEFAULT 'pendiente' CHECK(resultado IN ('PASS','FAIL','pendiente')),
      id_analista INTEGER NOT NULL,
      observaciones TEXT,
      fecha_analisis TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_analista) REFERENCES usuarios(id)
    );

    -- ─── Tabla 21: QC físico-químico del producto final ─────────────────────
    CREATE TABLE IF NOT EXISTS qc_fisicoquimico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,
      apariencia TEXT CHECK(apariencia IN ('translucente_sin_agregados','turbio','con_agregados','hemolizado')),
      apariencia_pass INTEGER DEFAULT 0,
      ph REAL,                             -- Spec: 6.0 - 7.5
      osmolalidad_mosm REAL,               -- Spec: 280 - 320 mOsm/kg (fisiológico)
      endotoxinas_eu_ml REAL,              -- Spec: ≤ 0.5 EU/mL (LAL test)
      vcn_copias_genoma REAL,              -- Vector Copy Number (spec: ≤5 copias, qPCR)
      rcl_resultado TEXT CHECK(rcl_resultado IN ('negativo','positivo','pendiente')), -- Replication-Competent Lentivirus
      micoplasma TEXT CHECK(micoplasma IN ('negativo','positivo','pendiente')),
      esterilidad_bacteria TEXT CHECK(esterilidad_bacteria IN ('negativo','positivo','pendiente')),
      esterilidad_hongos TEXT CHECK(esterilidad_hongos IN ('negativo','positivo','pendiente')),
      virus_adventicios TEXT CHECK(virus_adventicios IN ('negativo','positivo','pendiente')), -- EBV, HBV, HCV, HIV
      resultado_global TEXT NOT NULL DEFAULT 'pendiente' CHECK(resultado_global IN ('PASS','FAIL','pendiente')),
      id_analista INTEGER NOT NULL,
      observaciones TEXT,
      fecha_analisis TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_analista) REFERENCES usuarios(id)
    );

    -- ─── Tabla 22: Cadena de Identidad y Custodia (COI/COC) ─────────────────
    CREATE TABLE IF NOT EXISTS cadena_identidad_custodia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,
      tipo_evento TEXT NOT NULL CHECK(tipo_evento IN (
        'recepcion_aferesis','transfer_fabricacion','inicio_criopreservacion',
        'almacenamiento_ln2','envio_hospital','entrega_cama','descongelacion'
      )),
      id_usuario_entrega INTEGER NOT NULL,  -- Persona que entrega (2-person rule)
      id_usuario_recibe INTEGER NOT NULL,   -- Persona que recibe
      codigo_identificacion TEXT,           -- ISBT-128 / Código SEC europeo
      temperatura_log TEXT,                 -- JSON: [{timestamp, temp_c}]
      contenedor TEXT,                      -- Dry-shipper ID, Dewar ID, etc.
      posicion_almacenamiento TEXT,         -- Rack/posición si aplica
      inspeccion_visual TEXT NOT NULL DEFAULT 'integro' 
        CHECK(inspeccion_visual IN ('integro','dañado','incompleto','no_aplica')),
      observaciones TEXT,
      fecha_evento TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_usuario_entrega) REFERENCES usuarios(id),
      FOREIGN KEY (id_usuario_recibe) REFERENCES usuarios(id)
    );

    -- ─── Tabla 23: Registros de criopreservación ────────────────────────────
    CREATE TABLE IF NOT EXISTS registros_criogenicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,
      tipo_evento TEXT NOT NULL CHECK(tipo_evento IN ('congelacion','almacenamiento','descongelacion','transferencia')),
      rampa_congelacion TEXT,               -- JSON: [{temp_c, tiempo_min}] para controlled-rate freezer
      temp_almacenamiento REAL,             -- °C (LN₂ vapor: -150 a -196°C)
      id_tanque_ln2 TEXT,                   -- Identificador del tanque criogénico
      posicion_rack TEXT,                   -- Localización física (rack, caja, posición)
      volumen_ml REAL,                      -- Volumen del producto (mL)
      numero_viales INTEGER,                -- Cantidad de viales criopreservados
      crioprotector TEXT DEFAULT 'DMSO_10pct', -- Agente crioprotector empleado
      observaciones TEXT,
      id_analista INTEGER NOT NULL,
      fecha_evento TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_analista) REFERENCES usuarios(id)
    );

    -- ─── Tabla 24: Eventos adversos clínicos post-infusión ──────────────────
    CREATE TABLE IF NOT EXISTS eventos_adversos_clinicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,
      id_paciente INTEGER NOT NULL,
      tipo_evento TEXT NOT NULL CHECK(tipo_evento IN ('crs','icans','infeccion','recaida','citopenia','otro')),
      grado INTEGER CHECK(grado BETWEEN 1 AND 4), -- Escala ASTCT para CRS / CTCAE
      ice_score INTEGER CHECK(ice_score BETWEEN 0 AND 10), -- ICE score para ICANS (10=normal)
      dia_inicio_post_infusion INTEGER NOT NULL,    -- Día D+ de inicio
      duracion_dias INTEGER,
      tratamiento TEXT,                     -- tocilizumab, corticoides, soporte, otro
      citoquinas_json TEXT,                 -- JSON: {il6, ifn_gamma, il1ra, tnf_alpha, crp, ferritina}
      requirio_uci INTEGER NOT NULL DEFAULT 0, -- Ingreso UCI: 1/0
      resuelto INTEGER NOT NULL DEFAULT 0,
      id_medico_responsable INTEGER,
      reportado_farmacovigilancia INTEGER NOT NULL DEFAULT 0,
      observaciones TEXT,
      fecha_evento TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id),
      FOREIGN KEY (id_paciente) REFERENCES pacientes(id),
      FOREIGN KEY (id_medico_responsable) REFERENCES usuarios(id)
    );

    -- Índices de búsqueda frecuente
    CREATE INDEX IF NOT EXISTS idx_identidad_lote ON pruebas_identidad_celular(id_lote, etapa);
    CREATE INDEX IF NOT EXISTS idx_potencia_lote ON pruebas_potencia(id_lote);
    CREATE INDEX IF NOT EXISTS idx_fisicoquimico_lote ON qc_fisicoquimico(id_lote);
    CREATE INDEX IF NOT EXISTS idx_coi_lote ON cadena_identidad_custodia(id_lote, tipo_evento);
    CREATE INDEX IF NOT EXISTS idx_criopreservacion_lote ON registros_criogenicos(id_lote);
    CREATE INDEX IF NOT EXISTS idx_eventos_adversos_paciente ON eventos_adversos_clinicos(id_paciente, tipo_evento);
  `);

  console.log('✓ Migración V2 completada: 6 tablas GMP añadidas (tablas 19-24)');
  console.log('  → pruebas_identidad_celular, pruebas_potencia, qc_fisicoquimico');
  console.log('  → cadena_identidad_custodia, registros_criogenicos, eventos_adversos_clinicos');
}

// ─── Migración V3: Estadística Avanzada QC (tablas 25-26) ────────────────────
export function migrateV3(database) {
  const tables = ['estadisticas_proceso', 'observaciones_spc'];

  const allExist = tables.every(t =>
    database.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}'`).get()
  );

  if (allExist) {
    console.log('✓ Tablas V3 ya existen (tablas 25-26)');
    return;
  }

  console.log('⏳ Migrando BD a V3 (tablas 25-26 — Estadística Avanzada)...');

  database.exec(`
    -- ─── Tabla 25: Métricas estadísticas por parámetro y período ────────────
    CREATE TABLE IF NOT EXISTS estadisticas_proceso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parametro TEXT NOT NULL,            -- 'viabilidad', 'pct_car', 'vcn', 'ifn_gamma', etc.
      periodo TEXT NOT NULL,              -- 'all', '2026-01', '2026-Q1', etc.
      n INTEGER NOT NULL DEFAULT 0,       -- Número de observaciones
      media REAL,                         -- Media aritmética
      desv_std REAL,                      -- Desviación estándar
      cv_pct REAL,                        -- Coeficiente de variación %
      min_val REAL,
      max_val REAL,
      q1 REAL,                            -- Percentil 25
      mediana REAL,                       -- Percentil 50
      q3 REAL,                            -- Percentil 75
      cp REAL,                            -- Capacidad del proceso
      cpk REAL,                           -- Capacidad centrada (min Cpk)
      n_fuera_spec INTEGER DEFAULT 0,     -- Lotes que no cumplen spec
      ucl REAL,                           -- Upper Control Limit (X̄ + 3σ)
      lcl REAL,                           -- Lower Control Limit (X̄ - 3σ)
      spec_min REAL,                      -- Especificación mínima
      spec_max REAL,                      -- Especificación máxima
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(parametro, periodo)
    );

    -- ─── Tabla 26: Observaciones individuales para SPC Charts ───────────────
    CREATE TABLE IF NOT EXISTS observaciones_spc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_lote INTEGER NOT NULL,           -- FK lotes_produccion.id
      parametro TEXT NOT NULL,            -- Parámetro medido
      valor REAL NOT NULL,                -- Valor observado
      media_movil REAL,                   -- Media acumulada hasta ese lote
      sigma REAL,                         -- Sigma acumulada
      ucl REAL,                           -- UCL calculado para ese momento
      lcl REAL,                           -- LCL calculado para ese momento
      es_outlier INTEGER NOT NULL DEFAULT 0,  -- 1 si supera UCL/LCL
      regla_violada TEXT,                 -- '1-of-1', '2-of-3', '4-of-5', 'nelson'
      fecha_medicion TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (id_lote) REFERENCES lotes_produccion(id)
    );

    -- Índices para consultas frecuentes de estadísticas
    CREATE INDEX IF NOT EXISTS idx_estadisticas_param ON estadisticas_proceso(parametro, periodo);
    CREATE INDEX IF NOT EXISTS idx_spc_parametro ON observaciones_spc(parametro, fecha_medicion);
    CREATE INDEX IF NOT EXISTS idx_spc_lote ON observaciones_spc(id_lote);
  `);

  console.log('✓ Migración V3 completada: 2 tablas estadísticas añadidas (tablas 25-26)');
  console.log('  → estadisticas_proceso, observaciones_spc');
}
