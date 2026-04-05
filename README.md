# Metaanalista 🔬

**Plataforma de automatización de revisiones sistemáticas y metaanálisis**

Inspirada en la UX de K-Dense, orientada a investigadores médicos.

## Stack Tecnológico
- **Frontend**: Google Stitch
- **Backend**: Python 3.10+ (Antigravity)
- **Skills**: `literature-review`, `scientific-schematics`, `pubmed-database`
- **Análisis**: `pandas`, `scipy`, `statsmodels`

## Estructura
```
Metaanalista/
├── frontend/          # UI generada con Stitch
├── backend/           # Lógica Antigravity (Python)
├── scripts/           # Scripts científicos de las Skills
├── data/              # Datos de proyectos y búsquedas
├── config/            # Configuración MCP y agentes
└── output/            # PDFs, diagramas PRISMA generados
```

## Módulos
1. **PICO Dashboard** - Captura y estructura la pregunta de investigación
2. **Motor de Búsqueda** - PubMed, bioRxiv, Semantic Scholar (via literature-review)
3. **Panel de Cribado PRISMA** - Aceptar/rechazar artículos + diagrama automático
4. **Extracción y Calidad** - Cochrane, Newcastle-Ottawa
5. **Gestor de Publicaciones** - Verificación DOI + exportación PDF

## Inicio Rápido
```bash
pip install -r requirements.txt
python backend/main.py
```
