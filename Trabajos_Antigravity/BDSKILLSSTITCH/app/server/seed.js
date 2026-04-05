import { getDb } from './db.js';

export function seed() {
  const db = getDb();
  const c = db.prepare('SELECT COUNT(*) as c FROM usuarios').get();
  if (c.c > 0) { console.log('✓ Already seeded'); seedV2Data(db); return; }
  console.log('⏳ Seeding...');
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO usuarios (uuid,nombre,apellido,email,password_hash,rol) VALUES
      ('u1','María','García López','maria@cartlab.org','$2b$h1','qc_analyst'),
      ('u2','Carlos','Rodríguez','carlos@cartlab.org','$2b$h2','qc_supervisor'),
      ('u3','Elena','Fernández','elena@cartlab.org','$2b$h3','qualified_person'),
      ('u4','Javier','Moreno','javier@cartlab.org','$2b$h4','qc_analyst'),
      ('u5','Ana','López','ana@cartlab.org','$2b$h5','admin')`).run();
    db.prepare(`INSERT INTO pacientes (uuid,nombre,apellido,fecha_nacimiento,numero_historia,diagnostico) VALUES
      ('p1','Alejandro','Muñoz','1978-03-15','HC-2026-0001','DLBCL R/R'),
      ('p2','Isabel','Torres','1985-07-22','HC-2026-0002','LLA-B refractaria'),
      ('p3','Miguel','Santos','1992-11-08','HC-2026-0003','Mieloma múltiple'),
      ('p4','Carmen','Jiménez','1970-01-30','HC-2026-0004','Linfoma folicular'),
      ('p5','Roberto','Hernández','1988-09-12','HC-2026-0005','DLBCL primario')`).run();
    db.prepare(`INSERT INTO lotes_produccion (lote_id,id_paciente,id_analista_responsable,tipo_producto,estado,fecha_inicio,fecha_fin_estimada,viabilidad_final) VALUES
      ('CART-2026-0038',1,1,'CAR-T_CD19','aprobado','2026-01-10','2026-01-28',92.5),
      ('CART-2026-0039',2,1,'CAR-T_CD19','aprobado','2026-01-15','2026-02-02',88.3),
      ('CART-2026-0040',3,4,'CAR-T_BCMA','en_proceso','2026-02-01','2026-02-19',NULL),
      ('CART-2026-0041',4,1,'CAR-T_CD19','qc_pendiente','2026-02-05','2026-02-23',85.7),
      ('CART-2026-0042',5,4,'CAR-T_CD19','en_proceso','2026-02-10','2026-02-28',NULL),
      ('CART-2026-0043',1,1,'CAR-T_CD22','en_hold','2026-02-12','2026-03-02',NULL),
      ('CART-2026-0044',2,4,'CAR-T_BCMA','rechazado','2026-01-20','2026-02-07',55.2),
      ('CART-2026-0045',3,1,'CAR-T_CD19','en_proceso','2026-02-18','2026-03-08',NULL)`).run();
    seedEtapas(db); seedChecklistAndQC(db); seedReactivosAndMonitor(db);
  });
  tx();
  console.log('✓ Seeded');
  seedV2Data(db);
}

function seedEtapas(db) {
  db.prepare(`INSERT INTO etapas_proceso (nombre,orden,descripcion,ref_sop,duracion_estimada_horas) VALUES
    ('Apheresis',1,'Recolección leucocitos','SOP-001',6),('Activation',2,'Activación T cells','SOP-002',48),
    ('Transduction',3,'Transducción lentiviral','SOP-003',24),('Expansion',4,'Expansión celular','SOP-004',240),
    ('Harvest',5,'Cosecha y formulación','SOP-005',8),('QC Release',6,'Control calidad','SOP-006',72)`).run();
  db.prepare(`INSERT INTO lote_etapas (id_lote,id_etapa,id_analista,estado,progreso_pct,fecha_inicio,fecha_fin) VALUES
    (3,1,4,'completada',100,'2026-02-01','2026-02-01'),(3,2,4,'completada',100,'2026-02-02','2026-02-04'),
    (3,3,4,'completada',100,'2026-02-04','2026-02-05'),(3,4,1,'en_progreso',65,'2026-02-05',NULL),
    (3,5,1,'pendiente',0,NULL,NULL),(3,6,1,'pendiente',0,NULL,NULL),
    (5,1,4,'completada',100,'2026-02-10','2026-02-10'),(5,2,4,'en_progreso',40,'2026-02-11',NULL),
    (5,3,4,'pendiente',0,NULL,NULL),(5,4,1,'pendiente',0,NULL,NULL),
    (5,5,1,'pendiente',0,NULL,NULL),(5,6,1,'pendiente',0,NULL,NULL),
    (8,1,1,'en_progreso',30,'2026-02-18',NULL),(8,2,1,'pendiente',0,NULL,NULL),
    (8,3,1,'pendiente',0,NULL,NULL),(8,4,1,'pendiente',0,NULL,NULL),
    (8,5,1,'pendiente',0,NULL,NULL),(8,6,1,'pendiente',0,NULL,NULL)`).run();
  const items = [
    [1, 'Verificar identidad paciente', 1], [1, 'Comprobar consentimiento', 2], [1, 'Calibrar equipo aféresis', 3], [1, 'Registrar volumen', 4],
    [2, 'Preparar medio cultivo', 1], [2, 'Añadir anti-CD3/CD28', 2], [2, 'Inocular células', 3], [2, 'Recuento celular inicial', 4],
    [3, 'Descongelar vector', 1], [3, 'Calcular MOI', 2], [3, 'Añadir vector', 3], [3, 'Registrar volumen vector', 4],
    [4, 'Control viabilidad diaria', 1], [4, 'Alimentar cultivo 48h', 2], [4, 'Registrar expansión', 3], [4, 'Verificar contaminación', 4],
    [5, 'Preparar lavado', 1], [5, 'Centrifugar', 2], [5, 'Formular producto', 3], [5, 'Muestras retención', 4],
    [6, 'Viabilidad 7-AAD', 1], [6, 'Pureza CD3+', 2], [6, 'Esterilidad USP', 3], [6, 'Endotoxinas LAL', 4],
    [6, 'Micoplasma qPCR', 5], [6, 'Vector copy ddPCR', 6], [6, 'Ensayo potencia', 7]
  ];
  const ins = db.prepare('INSERT INTO checklist_items (id_etapa,descripcion,orden) VALUES (?,?,?)');
  items.forEach(i => ins.run(...i));
}

function seedChecklistAndQC(db) {
  db.prepare(`INSERT INTO parametros_qc (nombre,unidad,spec_min,spec_max,metodo_analitico) VALUES
    ('Viability','%',70,100,'7-AAD'),('CD3+ Purity','%',80,100,'CD3-FITC'),
    ('Sterility','CFU/mL',NULL,0,'USP 71'),('Endotoxin','EU/mL',NULL,5,'LAL'),
    ('Mycoplasma','copies/mL',NULL,0,'qPCR'),('Vector Copy Number','copies/cell',NULL,5,'ddPCR'),
    ('Potency','%',20,NULL,'Cr51')`).run();
  db.prepare(`INSERT INTO muestras (codigo_muestra,id_paciente,id_lote,tipo_muestra,fecha_recoleccion) VALUES
    ('MUE-001',1,1,'aferesis','2026-01-10'),('MUE-002',1,1,'producto_final','2026-01-26'),
    ('MUE-003',2,2,'aferesis','2026-01-15'),('MUE-004',2,2,'producto_final','2026-02-01'),
    ('MUE-005',3,3,'aferesis','2026-02-01'),('MUE-006',3,3,'producto_intermedio','2026-02-14'),
    ('MUE-007',4,4,'producto_final','2026-02-20'),('MUE-008',5,5,'aferesis','2026-02-10'),
    ('MUE-009',2,7,'producto_final','2026-02-05'),('MUE-010',1,1,'retencion','2026-01-26')`).run();
  const qcData = [
    [2, 1, 92.5, 'PASS'], [2, 1, 95.2, 'PASS'], [2, 1, 0, 'PASS'], [2, 1, 1.2, 'PASS'], [2, 1, 0, 'PASS'], [2, 1, 2.3, 'PASS'], [2, 1, 45, 'PASS'],
    [4, 2, 88.3, 'PASS'], [4, 2, 91.8, 'PASS'], [4, 2, 0, 'PASS'], [4, 2, 2.8, 'PASS'], [4, 2, 0, 'PASS'], [4, 2, 3.1, 'PASS'], [4, 2, 38.5, 'PASS'],
    [7, 4, 85.7, 'PASS'], [7, 4, 89.4, 'PASS'], [7, 4, 0, 'PASS'], [7, 4, 3.9, 'PASS'], [7, 4, 0, 'PASS'], [7, 4, 4.8, 'PASS'], [7, 4, 28.5, 'PASS'],
    [9, 7, 55.2, 'FAIL'], [9, 7, 72.1, 'FAIL'], [9, 7, 0, 'PASS'], [9, 7, 8.5, 'FAIL'], [9, 7, 0, 'PASS'], [9, 7, 6.2, 'FAIL'], [9, 7, 12, 'FAIL']
  ];
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const insQC = db.prepare('INSERT INTO resultados_qc (id_muestra,id_lote,id_parametro,id_analista,valor,resultado,fecha_analisis) VALUES (?,?,?,?,?,?,?)');
  let paramId = 1;
  qcData.forEach((r) => { insQC.run(r[0], r[1], paramId, r[1] === 7 ? 1 : r[1] === 4 ? 4 : 1, r[2], r[3], now); paramId = (paramId % 7) + 1; });
}

function seedReactivosAndMonitor(db) {
  db.prepare(`INSERT INTO reactivos (nombre,fabricante,catalogo,unidad_medida,stock_minimo,condicion_almacenamiento) VALUES
    ('Anti-CD3/CD28 Dynabeads','Thermo Fisher','11141D','mL',3,'2-8C'),
    ('IL-2 Recombinante','Miltenyi','130-097','ug',5,'-20C'),
    ('Medio X-VIVO 15','Lonza','BE02-060F','L',2,'2-8C'),
    ('Vector Lentiviral CAR','In-house','VL-CD19','mL',1,'-80C'),
    ('7-AAD Viability Dye','BD','559925','mL',2,'2-8C'),
    ('Anti-CD3 FITC','BD','555332','test',10,'2-8C'),
    ('LAL Reagent Water','Lonza','W110','mL',5,'15-25C'),
    ('PBS 1X Sterile','Gibco','10010023','L',3,'15-25C')`).run();
  db.prepare(`INSERT INTO lotes_reactivos (numero_lote,id_reactivo,fecha_recepcion,fecha_caducidad,stock_actual,estado) VALUES
    ('TF-A001',1,'2025-10-15','2026-04-15',8,'disponible'),('TF-A002',1,'2025-12-01','2026-06-01',12,'disponible'),
    ('MT-B001',2,'2025-11-20','2026-05-20',3,'disponible'),('LZ-C001',3,'2025-09-01','2026-03-01',1,'disponible'),
    ('IH-D001',4,'2026-01-10','2026-07-10',5,'disponible'),('BD-E001',5,'2025-08-15','2026-02-15',2,'disponible'),
    ('BD-F001',6,'2025-10-01','2026-04-01',15,'disponible'),('LZ-G001',7,'2025-07-01','2026-01-01',0,'caducado'),
    ('GI-H001',8,'2026-01-20','2027-01-20',10,'disponible')`).run();
  db.prepare(`INSERT INTO salas_limpias (nombre,clasificacion,estado) VALUES
    ('Sala A - Procesamiento GMP','ISO_7','operativa'),('Sala B - Cultivo Celular','ISO_5','operativa'),
    ('Sala C - Formulación','ISO_5','operativa'),('Sala D - QC Micro','ISO_7','operativa'),
    ('Sala E - Almacenamiento','ISO_8','mantenimiento')`).run();
  db.prepare(`INSERT INTO equipos (nombre,tipo,ubicacion,id_sala,numero_serie,estado_operativo,ultima_calibracion,proxima_calibracion) VALUES
    ('Incubator 1','incubadora','Pos 1',2,'INC-001','operativo','2026-01-15','2026-07-15'),
    ('Incubator 2','incubadora','Pos 2',2,'INC-002','operativo','2026-01-15','2026-07-15'),
    ('BSC Hood 1','bsc_hood','Pos 1',1,'BSC-001','operativo','2026-02-01','2026-08-01'),
    ('BSC Hood 2','bsc_hood','Pos 1',3,'BSC-002','mantenimiento','2025-12-01','2026-06-01'),
    ('Centrifuge','centrifuga','Pos 3',1,'CTF-001','operativo','2026-01-20','2026-07-20'),
    ('CryoStorage','crioalmacenamiento','Pos 1',5,'CRY-001','operativo','2026-02-10','2026-08-10'),
    ('Sensor Sala A','sensor_ambiental','Sala A',1,'SEN-001','operativo','2026-02-15','2026-08-15'),
    ('Sensor Sala B','sensor_ambiental','Sala B',2,'SEN-002','operativo','2026-02-15','2026-08-15')`).run();
  const il = db.prepare('INSERT INTO lecturas_ambientales (id_equipo,id_sala,temperatura,co2_pct,humedad_pct,particulas,timestamp_lectura) VALUES (?,?,?,?,?,?,?)');
  const now = Date.now();
  for (let h = 23; h >= 0; h--) {
    const ts = new Date(now - h * 3600000).toISOString().replace('T', ' ').slice(0, 19);
    il.run(7, 1, 21 + Math.random() * 2 - 1, 0.04 + Math.random() * 0.01, 45 + Math.random() * 10, ~~(100 + Math.random() * 200), ts);
    il.run(8, 2, 37 + Math.random() * 0.5 - 0.25, 5 + Math.random() * 0.3, 90 + Math.random() * 5, ~~(10 + Math.random() * 50), ts);
  }
  db.prepare(`INSERT INTO alertas_qc (severidad,mensaje,origen,id_equipo,id_lote,estado) VALUES
    ('critical','Temp Incubadora 2 fuera de rango','equipo',2,NULL,'reconocida'),
    ('warning','Stock bajo: Anti-CD3/CD28','inventario',NULL,NULL,'activa'),
    ('critical','Lote CART-0044 RECHAZADO','qc_resultado',NULL,7,'resuelta'),
    ('info','Calibración BSC Hood 2 vencida','equipo',4,NULL,'activa'),
    ('warning','Lote reactivo LAL caducado','inventario',NULL,NULL,'activa'),
    ('critical','Humedad Sala E fuera spec','ambiental',NULL,NULL,'activa'),
    ('info','Lote CART-0045 iniciado','sistema',NULL,8,'resuelta')`).run();
  db.prepare(`INSERT INTO firmas_electronicas (id_lote,id_usuario,tipo_firma,decision,hash_firma,ip_address,fecha_firma) VALUES
    (1,1,'qc_analyst','aprobado','sha512_a1','192.168.1.10','2026-01-28 09:00'),
    (1,2,'qc_supervisor','aprobado','sha512_a2','192.168.1.11','2026-01-28 11:00'),
    (1,3,'qualified_person','aprobado','sha512_a3','192.168.1.12','2026-01-28 14:00'),
    (2,1,'qc_analyst','aprobado','sha512_b1','192.168.1.10','2026-02-02 09:30'),
    (2,2,'qc_supervisor','aprobado','sha512_b2','192.168.1.11','2026-02-02 11:30'),
    (2,3,'qualified_person','aprobado','sha512_b3','192.168.1.12','2026-02-02 15:00'),
    (4,4,'qc_analyst','aprobado','sha512_c1','192.168.1.13','2026-02-21 14:00')`).run();
}

// ─── Datos de prueba para tablas V2 (estadísticas avanzadas) ─────────────────
function seedV2Data(db) {
  // Verificar si ya existen datos
  const existsIdentidad = db.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='pruebas_identidad_celular'").get().c;
  if (existsIdentidad === 0) return;

  const count = db.prepare('SELECT COUNT(*) as c FROM pruebas_identidad_celular').get().c;
  if (count > 0) { console.log('✓ V2 data already seeded'); return; }

  console.log('⏳ Seeding datos V2 (identidad, potencia, fisicoquímico)...');

  // Pruebas identidad celular — 8 lotes (id 1-8), etapa producto_final
  const insIdentidad = db.prepare(`INSERT INTO pruebas_identidad_celular 
    (id_lote,etapa,pct_car_positivo,pct_cd3,pct_cd4,pct_cd8,ratio_cd4_cd8,
     conteo_celulas_viables,viabilidad,metodo,resultado,id_analista,fecha_analisis) VALUES 
    (?,?,?,?,?,?,?,?,?,'flow_cytometry',?,1,?)`);

  const identidadRows = [
    [1, 'producto_final', 42.3, 95.2, 58.1, 41.9, 1.39, 420000000, 92.5, 'PASS', '2026-01-27'],
    [2, 'producto_final', 38.7, 91.8, 52.4, 47.6, 1.10, 380000000, 88.3, 'PASS', '2026-02-01'],
    [3, 'expansion', 35.2, 88.4, 49.3, 50.7, 0.97, 310000000, 84.1, 'PASS', '2026-02-14'],
    [4, 'producto_final', 41.6, 93.1, 55.8, 44.2, 1.26, 395000000, 85.7, 'PASS', '2026-02-20'],
    [5, 'expansion', 28.4, 85.6, 43.7, 56.3, 0.78, 270000000, 79.2, 'PASS', '2026-02-18'],
    [6, 'expansion', 31.8, 89.3, 47.9, 52.1, 0.92, 290000000, 77.6, 'PASS', '2026-02-19'],
    [7, 'producto_final', 18.5, 72.4, 38.2, 61.8, 0.62, 180000000, 55.2, 'FAIL', '2026-02-06'],
    [8, 'expansion', 33.9, 87.2, 51.1, 48.9, 1.04, 340000000, 82.3, 'PASS', '2026-02-20'],
  ];
  identidadRows.forEach(r => insIdentidad.run(...r));

  // Pruebas potencia — lotes con producto final
  const insPotencia = db.prepare(`INSERT INTO pruebas_potencia 
    (id_lote,tipo_ensayo,ratio_et,viabilidad_target_pct,ifn_gamma_pgml,tnf_alpha_pgml,
     il2_pgml,linea_celular_target,resultado,id_analista,fecha_analisis) VALUES 
    (?,?,?,?,?,?,?,?,?,1,?)`);

  const potenciaRows = [
    [1, 'ambos', '1:1', 28.4, 482.3, 310.7, 145.2, 'NALM-6', 'PASS', '2026-01-27'],
    [2, 'ambos', '1:1', 35.1, 398.5, 278.4, 122.6, 'NALM-6', 'PASS', '2026-02-01'],
    [4, 'ambos', '1:1', 42.7, 312.8, 241.9, 98.7, 'NALM-6', 'PASS', '2026-02-20'],
    [7, 'ambos', '1:1', 72.3, 145.2, 112.4, 48.3, 'NALM-6', 'FAIL', '2026-02-06'],
  ];
  potenciaRows.forEach(r => insPotencia.run(...r));

  // QC Fisicoquímico — lotes con producto final
  const insFisico = db.prepare(`INSERT INTO qc_fisicoquimico 
    (id_lote,apariencia,apariencia_pass,ph,osmolalidad_mosm,endotoxinas_eu_ml,
     vcn_copias_genoma,rcl_resultado,micoplasma,esterilidad_bacteria,esterilidad_hongos,
     virus_adventicios,resultado_global,id_analista,fecha_analisis) VALUES 
    (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`);

  const fisicoRows = [
    [1, 'translucente_sin_agregados', 1, 7.1, 295, 0.12, 2.3, 'negativo', 'negativo', 'negativo', 'negativo', 'negativo', 'PASS', '2026-01-27'],
    [2, 'translucente_sin_agregados', 1, 7.0, 302, 0.21, 3.1, 'negativo', 'negativo', 'negativo', 'negativo', 'negativo', 'PASS', '2026-02-01'],
    [4, 'translucente_sin_agregados', 1, 7.2, 288, 0.18, 1.8, 'negativo', 'negativo', 'negativo', 'negativo', 'negativo', 'PASS', '2026-02-20'],
    [7, 'turbio', 0, 6.4, 312, 0.45, 5.8, 'negativo', 'negativo', 'negativo', 'negativo', 'negativo', 'FAIL', '2026-02-06'],
  ];
  fisicoRows.forEach(r => insFisico.run(...r));

  console.log('✓ Datos V2 sembrados (8 identidad, 4 potencia, 4 fisicoquímico)');
}
