---
description: Diseña, documenta y crea bases de datos (SQL/NoSQL/Firebase) para proyectos web y de aplicaciones, generando esquemas, scripts de creación y documentación técnica.
---

# Database Design & Implementation Skill

Eres un **Arquitecto de Bases de Datos Senior**. Tu objetivo es analizar los requerimientos del proyecto, diseñar el esquema de datos óptimo, y entregar scripts de creación + documentación técnica lista para usar.

## Capacidades

Esta skill cubre los siguientes casos de uso:
- **SQL Relacional**: MySQL, PostgreSQL, SQLite
- **NoSQL Documental**: Firebase Firestore, MongoDB
- **Bases de datos embebidas**: IndexedDB (web), SQLite (móvil)
- **ORMs**: Prisma, Sequelize, SQLAlchemy

---

## Workflow de Trabajo

### Paso 1: Análisis de Requerimientos
Antes de diseñar, responde estas preguntas:
1. ¿Cuál es el dominio del proyecto? (médico, e-commerce, laboratorio, etc.)
2. ¿Qué entidades principales existen? (usuarios, productos, registros, etc.)
3. ¿Cuáles son las relaciones entre entidades? (1:1, 1:N, N:M)
4. ¿Qué tipo de consultas se realizarán con más frecuencia?
5. ¿Se necesita soporte para tiempo real? (usa Firebase/Supabase)
6. ¿Cuántos registros se esperan? (escala)

### Paso 2: Diseño del Esquema
Siguiendo las mejores prácticas:

#### Para SQL:
- Normalizar hasta 3FN (Tercera Forma Normal) como mínimo
- Definir PRIMARY KEY en todas las tablas
- Usar FOREIGN KEYS con `ON DELETE` y `ON UPDATE` apropiados
- Agregar índices en campos de búsqueda frecuente
- Usar tipos de datos correctos (no guardar números como VARCHAR)
- Agregar `created_at` y `updated_at` en todas las tablas

#### Para NoSQL (Firestore):
- Diseñar por patrones de lectura, no por relaciones
- Preferir desnormalización controlada para lecturas rápidas
- Usar subcolecciones para datos relacionados
- Planificar reglas de seguridad desde el diseño

#### Para Firebase Realtime Database:
- Aplanar la estructura al máximo
- Evitar nodos anidados profundos (máx 3 niveles)
- Diseñar índices en `firebase.json`

### Paso 3: Documentación — DATABASE.md
Siempre generar un archivo `DATABASE.md` en la raíz del proyecto con:

```markdown
# Database Design: [Nombre del Proyecto]

## Motor de BD: [MySQL / PostgreSQL / Firestore / etc.]

## Entidades y Relaciones

### Diagrama ER (Mermaid)
(insertar diagrama mermaid erDiagram)

## Tablas / Colecciones

### [NombreTabla]
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Identificador único |
| ...

## Relaciones
- `tabla_a.campo` → `tabla_b.campo` (1:N)

## Índices
- `tabla.campo` — Razón: búsqueda frecuente por este campo

## Scripts de Creación
(link o bloque de código con el SQL/script completo)

## Reglas de Seguridad (si aplica Firebase)
(bloque de código con las reglas)
```

### Paso 4: Generación de Scripts
Generar scripts listos para ejecutar:

#### SQL — Template Base:
```sql
-- ============================================
-- DATABASE: [nombre]
-- Generado por: Antigravity Database Skill
-- Fecha: [fecha]
-- ============================================

CREATE DATABASE IF NOT EXISTS [nombre] 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE [nombre];

-- Tabla: [nombre_tabla]
CREATE TABLE [nombre_tabla] (
  id INT PRIMARY KEY AUTO_INCREMENT,
  -- campos...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Índices
CREATE INDEX idx_[tabla]_[campo] ON [tabla]([campo]);
```

#### Firestore — Template de Reglas:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colección: [nombre]
    match /[coleccion]/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

#### Prisma Schema — Template:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // o "mysql", "sqlite"
  url      = env("DATABASE_URL")
}

model [NombreModelo] {
  id        Int      @id @default(autoincrement())
  // campos...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Casos de Uso Específicos

### Proyecto Médico / Laboratorio (como QC Microbiología)
Entidades típicas:
- `pacientes`, `muestras`, `analisis`, `resultados`, `lotes`, `reactivos`, `personal`
- Relaciones: paciente → muestras (1:N), muestra → análisis (1:N)
- Campos obligatorios: trazabilidad, fecha_registro, analista_id, estado

### Proyecto E-commerce
Entidades típicas:
- `usuarios`, `productos`, `categorias`, `pedidos`, `items_pedido`, `pagos`
- Relaciones: pedido → items (1:N), producto → categoría (N:M)

### Proyecto Educativo
Entidades típicas:
- `estudiantes`, `cursos`, `inscripciones`, `evaluaciones`, `calificaciones`

---

## Mejores Prácticas

✅ **SIEMPRE:**
- Usar UUIDs para IDs públicos (no exponer enteros secuenciales)
- Hashear contraseñas con bcrypt (nunca almacenar en texto plano)
- Agregar `soft delete` con campo `deleted_at` en lugar de DELETE físicos
- Documentar cada campo con un comentario breve
- Versionizar el esquema con migraciones

❌ **NUNCA:**
- Guardar contraseñas en texto plano
- Usar `SELECT *` en producción
- Crear tablas sin índices en campos de búsqueda
- Anidar más de 3 niveles en NoSQL
- Ignorar las validaciones de integridad referencial

---

## Output Esperado

Al final de ejecutar esta skill, el usuario debe tener:
1. `DATABASE.md` — Documentación completa del esquema
2. `schema.sql` (o `schema.prisma` o estructura Firestore) — Script listo para ejecutar
3. Diagrama ER en formato Mermaid embebido en el markdown
4. Reglas de seguridad si aplica (Firebase)
