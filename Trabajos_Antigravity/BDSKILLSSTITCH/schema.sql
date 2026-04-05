-- ============================================
-- DATABASE: qc_microbiologia_cart
-- Motor: MySQL 8.0+ / PostgreSQL 14+
-- Generado por: Antigravity Database Skill
-- Fecha: 2026-02-21
-- Proyecto: CAR-T Lab QC Microbiología
-- ============================================

CREATE DATABASE IF NOT EXISTS qc_microbiologia_cart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE qc_microbiologia_cart;

-- ============================================
-- 1. USUARIOS (autenticación y roles)
-- ============================================
CREATE TABLE usuarios (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  uuid            CHAR(36) NOT NULL UNIQUE,
  nombre          VARCHAR(100) NOT NULL,
  apellido        VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL          COMMENT 'Hash bcrypt — NUNCA texto plano',
  rol             ENUM('qc_analyst','qc_supervisor','qualified_person','admin','readonly')
                  NOT NULL,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso   DATETIME NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Gestión de acceso y roles — CFR 21 Part 11';

-- ============================================
-- 2. PACIENTES
-- ============================================
CREATE TABLE pacientes (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  uuid              CHAR(36) NOT NULL UNIQUE,
  nombre            VARCHAR(100) NOT NULL,
  apellido          VARCHAR(100) NOT NULL,
  fecha_nacimiento  DATE NOT NULL,
  numero_historia   VARCHAR(50) NOT NULL UNIQUE   COMMENT 'Nº de historia clínica',
  diagnostico       VARCHAR(255) NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL                  COMMENT 'Soft delete'
) ENGINE=InnoDB COMMENT='Pacientes que reciben terapia CAR-T';

-- ============================================
-- 3. LOTES_PRODUCCION (entidad central)
-- ============================================
CREATE TABLE lotes_produccion (
  id                       INT PRIMARY KEY AUTO_INCREMENT,
  lote_id                  VARCHAR(30) NOT NULL UNIQUE  COMMENT 'Ej: CART-2026-0042',
  id_paciente              INT NOT NULL,
  id_analista_responsable  INT NOT NULL,
  tipo_producto            ENUM('CAR-T_CD19','CAR-T_BCMA','CAR-T_CD22','otro')
                           NOT NULL,
  estado                   ENUM('en_proceso','qc_pendiente','aprobado','rechazado','en_hold','enviado')
                           NOT NULL DEFAULT 'en_proceso',
  fecha_inicio             DATE NOT NULL,
  fecha_fin_estimada       DATE NULL,
  fecha_fin_real           DATE NULL,
  viabilidad_final         DECIMAL(5,2) NULL           COMMENT '% viabilidad (0-100)',
  created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (id_paciente)
    REFERENCES pacientes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_analista_responsable)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Lotes de fabricación CAR-T';

CREATE INDEX idx_lotes_estado    ON lotes_produccion(estado);
CREATE INDEX idx_lotes_paciente  ON lotes_produccion(id_paciente);
CREATE INDEX idx_lotes_fechas    ON lotes_produccion(fecha_inicio, fecha_fin_real);

-- ============================================
-- 4. ETAPAS_PROCESO (catálogo)
-- ============================================
CREATE TABLE etapas_proceso (
  id                      INT PRIMARY KEY AUTO_INCREMENT,
  nombre                  VARCHAR(80) NOT NULL UNIQUE,
  orden                   INT NOT NULL             COMMENT 'Orden secuencial 1-6',
  descripcion             TEXT NULL,
  ref_sop                 VARCHAR(50) NULL         COMMENT 'Ej: SOP-CART-004',
  duracion_estimada_horas INT NULL,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Catálogo de etapas de fabricación CAR-T';

-- Datos iniciales
INSERT INTO etapas_proceso (nombre, orden, ref_sop, duracion_estimada_horas) VALUES
  ('Apheresis',    1, 'SOP-CART-001', 6),
  ('Activation',   2, 'SOP-CART-002', 48),
  ('Transduction', 3, 'SOP-CART-003', 24),
  ('Expansion',    4, 'SOP-CART-004', 240),
  ('Harvest',      5, 'SOP-CART-005', 8),
  ('QC Release',   6, 'SOP-CART-006', 72);

-- ============================================
-- 5. LOTE_ETAPAS (progreso del workflow)
-- ============================================
CREATE TABLE lote_etapas (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  id_lote         INT NOT NULL,
  id_etapa        INT NOT NULL,
  id_analista     INT NOT NULL,
  estado          ENUM('pendiente','en_progreso','completada','en_hold')
                  NOT NULL DEFAULT 'pendiente',
  progreso_pct    DECIMAL(5,2) NOT NULL DEFAULT 0.00  COMMENT '0-100',
  fecha_inicio    DATETIME NULL,
  fecha_fin       DATETIME NULL,
  observaciones   TEXT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_lote_etapa (id_lote, id_etapa),

  FOREIGN KEY (id_lote)
    REFERENCES lotes_produccion(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_etapa)
    REFERENCES etapas_proceso(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_analista)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Progreso de cada lote por etapa (Workflow screen)';

CREATE INDEX idx_le_lote_etapa ON lote_etapas(id_lote, id_etapa);

-- ============================================
-- 6. CHECKLIST_ITEMS (catálogo por etapa)
-- ============================================
CREATE TABLE checklist_items (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  id_etapa      INT NOT NULL,
  descripcion   VARCHAR(255) NOT NULL,
  orden         INT NOT NULL,
  obligatorio   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_etapa)
    REFERENCES etapas_proceso(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Ítems del checklist por etapa';

-- ============================================
-- 7. LOTE_CHECKLIST (estado por lote-etapa)
-- ============================================
CREATE TABLE lote_checklist (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  id_lote_etapa       INT NOT NULL,
  id_checklist_item   INT NOT NULL,
  completado          BOOLEAN NOT NULL DEFAULT FALSE,
  id_usuario          INT NULL,
  fecha_completado    DATETIME NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_lote_checklist (id_lote_etapa, id_checklist_item),

  FOREIGN KEY (id_lote_etapa)
    REFERENCES lote_etapas(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_checklist_item)
    REFERENCES checklist_items(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Estado de checklist por lote-etapa';

-- ============================================
-- 8. MUESTRAS
-- ============================================
CREATE TABLE muestras (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  codigo_muestra      VARCHAR(50) NOT NULL UNIQUE   COMMENT 'Código de trazabilidad',
  id_paciente         INT NOT NULL,
  id_lote             INT NULL,
  tipo_muestra        ENUM('aferesis','sangre_periferica','producto_intermedio','producto_final','retencion')
                      NOT NULL,
  fecha_recoleccion   DATETIME NOT NULL,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (id_paciente)
    REFERENCES pacientes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_lote)
    REFERENCES lotes_produccion(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Muestras biológicas';

CREATE INDEX idx_muestras_paciente ON muestras(id_paciente);
CREATE INDEX idx_muestras_lote     ON muestras(id_lote);
CREATE INDEX idx_muestras_fecha    ON muestras(fecha_recoleccion);

-- ============================================
-- 9. PARAMETROS_QC (catálogo)
-- ============================================
CREATE TABLE parametros_qc (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  nombre            VARCHAR(100) NOT NULL UNIQUE,
  unidad            VARCHAR(30) NOT NULL,
  spec_min          DECIMAL(10,4) NULL              COMMENT 'Especificación mínima',
  spec_max          DECIMAL(10,4) NULL              COMMENT 'Especificación máxima',
  metodo_analitico  VARCHAR(100) NULL               COMMENT 'Método/técnica de análisis',
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Catálogo de parámetros de control de calidad';

-- Datos iniciales (pantalla Firma Electrónica)
INSERT INTO parametros_qc (nombre, unidad, spec_min, spec_max, metodo_analitico) VALUES
  ('Viability',           '%',          70.0000, 100.0000, 'Flow Cytometry - 7-AAD'),
  ('CD3+ Purity',         '%',          80.0000, 100.0000, 'Flow Cytometry - CD3-FITC'),
  ('Sterility',           'CFU/mL',     NULL,    0.0000,   'USP <71> Direct Inoculation'),
  ('Endotoxin',           'EU/mL',      NULL,    5.0000,   'LAL Kinetic Turbidimetric'),
  ('Mycoplasma',          'copies/mL',  NULL,    0.0000,   'qPCR - MycoAlert'),
  ('Vector Copy Number',  'copies/cell', NULL,   5.0000,   'ddPCR'),
  ('Potency',             '%',          20.0000, NULL,     'Cytotoxicity Assay - Cr51');

-- ============================================
-- 10. REACTIVOS (catálogo)
-- ============================================
CREATE TABLE reactivos (
  id                       INT PRIMARY KEY AUTO_INCREMENT,
  nombre                   VARCHAR(150) NOT NULL UNIQUE,
  fabricante               VARCHAR(100) NOT NULL,
  catalogo                 VARCHAR(50) NULL          COMMENT 'Nº de catálogo del fabricante',
  unidad_medida            VARCHAR(20) NOT NULL,
  stock_minimo             INT NOT NULL DEFAULT 5    COMMENT 'Umbral de alerta',
  condicion_almacenamiento VARCHAR(100) NULL         COMMENT 'Ej: 2-8°C, -20°C',
  activo                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Catálogo de reactivos del laboratorio';

-- ============================================
-- 11. LOTES_REACTIVOS
-- ============================================
CREATE TABLE lotes_reactivos (
  id                    INT PRIMARY KEY AUTO_INCREMENT,
  numero_lote           VARCHAR(50) NOT NULL,
  id_reactivo           INT NOT NULL,
  fecha_recepcion       DATE NOT NULL,
  fecha_caducidad       DATE NOT NULL,
  stock_actual          INT NOT NULL DEFAULT 0,
  estado                ENUM('disponible','agotado','caducado','cuarentena')
                        NOT NULL DEFAULT 'disponible',
  certificado_analisis  VARCHAR(255) NULL            COMMENT 'Ruta o URL al CoA',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (id_reactivo)
    REFERENCES reactivos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Lotes individuales de reactivos con stock y caducidad';

CREATE INDEX idx_lr_reactivo  ON lotes_reactivos(id_reactivo);
CREATE INDEX idx_lr_caducidad ON lotes_reactivos(fecha_caducidad);
CREATE INDEX idx_lr_estado    ON lotes_reactivos(estado);

-- ============================================
-- 12. SALAS_LIMPIAS
-- ============================================
CREATE TABLE salas_limpias (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nombre          VARCHAR(80) NOT NULL UNIQUE,
  clasificacion   ENUM('ISO_5','ISO_7','ISO_8','no_clasificada')
                  NOT NULL,
  estado          ENUM('operativa','mantenimiento','fuera_servicio')
                  NOT NULL DEFAULT 'operativa',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Salas limpias del laboratorio';

-- ============================================
-- 13. EQUIPOS
-- ============================================
CREATE TABLE equipos (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  nombre               VARCHAR(100) NOT NULL,
  tipo                 ENUM('incubadora','bsc_hood','centrifuga','crioalmacenamiento','sensor_ambiental','otro')
                       NOT NULL,
  ubicacion            VARCHAR(100) NULL,
  id_sala              INT NULL,
  numero_serie         VARCHAR(100) UNIQUE,
  estado_operativo     ENUM('operativo','mantenimiento','alarma','fuera_servicio')
                       NOT NULL DEFAULT 'operativo',
  ultima_calibracion   DATE NULL,
  proxima_calibracion  DATE NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (id_sala)
    REFERENCES salas_limpias(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Equipos del laboratorio (Monitor de Sistema)';

-- ============================================
-- 14. RESULTADOS_QC
-- ============================================
CREATE TABLE resultados_qc (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  id_muestra        INT NOT NULL,
  id_lote           INT NOT NULL,
  id_parametro      INT NOT NULL,
  id_analista       INT NOT NULL,
  id_lote_reactivo  INT NULL,
  valor             DECIMAL(10,4) NOT NULL,
  resultado         ENUM('PASS','FAIL','OOS','pendiente')
                    NOT NULL DEFAULT 'pendiente',
  observaciones     TEXT NULL,
  fecha_analisis    DATETIME NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (id_muestra)
    REFERENCES muestras(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_lote)
    REFERENCES lotes_produccion(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_parametro)
    REFERENCES parametros_qc(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_analista)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_lote_reactivo)
    REFERENCES lotes_reactivos(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Resultados de análisis de calidad';

CREATE INDEX idx_rqc_lote      ON resultados_qc(id_lote);
CREATE INDEX idx_rqc_muestra   ON resultados_qc(id_muestra);
CREATE INDEX idx_rqc_resultado ON resultados_qc(resultado);
CREATE INDEX idx_rqc_fecha     ON resultados_qc(fecha_analisis);
CREATE INDEX idx_rqc_analista  ON resultados_qc(id_analista);

-- ============================================
-- 15. LECTURAS_AMBIENTALES (alto volumen)
-- ============================================
CREATE TABLE lecturas_ambientales (
  id                 BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_equipo          INT NOT NULL,
  id_sala            INT NOT NULL,
  temperatura        DECIMAL(5,2) NULL              COMMENT '°C',
  co2_pct            DECIMAL(5,2) NULL              COMMENT 'CO₂ %',
  humedad_pct        DECIMAL(5,2) NULL              COMMENT 'Humedad relativa %',
  particulas         INT NULL                       COMMENT 'Partículas /m³',
  timestamp_lectura  DATETIME NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_equipo)
    REFERENCES equipos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_sala)
    REFERENCES salas_limpias(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registros de sensores ambientales — particionar por timestamp en producción';

CREATE INDEX idx_la_timestamp ON lecturas_ambientales(timestamp_lectura);
CREATE INDEX idx_la_sala      ON lecturas_ambientales(id_sala, timestamp_lectura);
CREATE INDEX idx_la_equipo    ON lecturas_ambientales(id_equipo);

-- ============================================
-- 16. ALERTAS_QC
-- ============================================
CREATE TABLE alertas_qc (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  severidad        ENUM('info','warning','critical') NOT NULL,
  mensaje          VARCHAR(500) NOT NULL,
  origen           ENUM('ambiental','equipo','qc_resultado','inventario','sistema')
                   NOT NULL,
  id_equipo        INT NULL,
  id_lote          INT NULL,
  estado           ENUM('activa','reconocida','resuelta')
                   NOT NULL DEFAULT 'activa',
  id_usuario_ack   INT NULL                         COMMENT 'Quién reconoció la alerta',
  fecha_ack        DATETIME NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_equipo)
    REFERENCES equipos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (id_lote)
    REFERENCES lotes_produccion(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario_ack)
    REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Alertas del sistema con severidad y trazabilidad';

CREATE INDEX idx_alertas_estado    ON alertas_qc(estado);
CREATE INDEX idx_alertas_severidad ON alertas_qc(severidad, estado);
CREATE INDEX idx_alertas_fecha     ON alertas_qc(created_at);

-- ============================================
-- 17. FIRMAS_ELECTRONICAS (CFR 21 Part 11)
-- ============================================
CREATE TABLE firmas_electronicas (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  id_lote       INT NOT NULL,
  id_usuario    INT NOT NULL,
  tipo_firma    ENUM('qc_analyst','qc_supervisor','qualified_person')
                NOT NULL,
  decision      ENUM('aprobado','rechazado','revision_solicitada')
                NOT NULL,
  comentarios   TEXT NULL,
  hash_firma    VARCHAR(128) NOT NULL              COMMENT 'SHA-512 hash',
  ip_address    VARCHAR(45) NOT NULL,
  user_agent    VARCHAR(255) NULL,
  fecha_firma   DATETIME NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_firma_lote_rol (id_lote, tipo_firma),

  FOREIGN KEY (id_lote)
    REFERENCES lotes_produccion(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Firmas digitales — CFR 21 Part 11';

CREATE INDEX idx_firmas_lote    ON firmas_electronicas(id_lote);
CREATE INDEX idx_firmas_usuario ON firmas_electronicas(id_usuario);

-- ============================================
-- 18. AUDIT_LOG (CFR 21 Part 11)
-- ============================================
CREATE TABLE audit_log (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_usuario        INT NULL,
  accion            ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','SIGN','EXPORT')
                    NOT NULL,
  tabla_afectada    VARCHAR(80) NOT NULL,
  registro_id       INT NULL,
  datos_anteriores  JSON NULL                       COMMENT 'Estado anterior (para UPDATEs)',
  datos_nuevos      JSON NULL                       COMMENT 'Estado nuevo',
  ip_address        VARCHAR(45) NULL,
  fecha             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registro de auditoría completo — CFR 21 Part 11';

CREATE INDEX idx_audit_fecha ON audit_log(fecha);
CREATE INDEX idx_audit_tabla ON audit_log(tabla_afectada, registro_id);
CREATE INDEX idx_audit_user  ON audit_log(id_usuario);

-- ============================================
-- RESUMEN DE TABLAS CREADAS: 17
-- ============================================
-- 1.  usuarios
-- 2.  pacientes
-- 3.  lotes_produccion
-- 4.  etapas_proceso          (+ datos iniciales)
-- 5.  lote_etapas
-- 6.  checklist_items
-- 7.  lote_checklist
-- 8.  muestras
-- 9.  parametros_qc           (+ datos iniciales)
-- 10. reactivos
-- 11. lotes_reactivos
-- 12. salas_limpias
-- 13. equipos
-- 14. resultados_qc
-- 15. lecturas_ambientales
-- 16. alertas_qc
-- 17. firmas_electronicas
-- 18. audit_log
-- ============================================
