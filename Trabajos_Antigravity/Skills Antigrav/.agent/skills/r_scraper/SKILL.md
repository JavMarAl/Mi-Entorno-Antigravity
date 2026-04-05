---
name: r_scraper_skill
description: Descarga tutoriales de R de StatisticsGlobe y crea un manual Word y un índice.
---

# R Programming Scraper

Usa esta skill cuando el usuario pida "crear el manual de R", "bajar la documentación de R" o "scrapear statisticsglobe".

## Cómo funciona
Esta skill ejecuta un script de Python que entra a la web, copia los tutoriales y genera dos archivos Word.

## Instrucciones para el Agente
1. Ejecuta el script `scraper.py` ubicado en esta misma carpeta.
2. Espera a que termine (puede tardar unos minutos).
3. Confirma al usuario cuando los archivos `Manual_R_Completo.docx` y `Indice_R.docx` estén listos.