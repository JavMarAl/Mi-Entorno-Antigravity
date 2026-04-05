import os
import math
import re
import time
import requests
from bs4 import BeautifulSoup

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Preformatted, Spacer, PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_LEFT

OUT_DIR = 'Fuentes_Python_NotebookLM'
BASE_URL  = 'https://docs.python.org/3/library/'
INDEX_URL = BASE_URL + 'index.html'
SECTIONS_PER_CHUNK = 45

os.makedirs(OUT_DIR, exist_ok=True)

# ────────────────────────────
#  Estilos
# ────────────────────────────
styles = getSampleStyleSheet()

style_h1 = ParagraphStyle('H1', parent=styles['Heading1'],
    fontSize=18, spaceAfter=10, textColor=colors.HexColor('#1a1a2e'),
    borderPad=4)

style_h2 = ParagraphStyle('H2', parent=styles['Heading2'],
    fontSize=13, spaceAfter=6, textColor=colors.HexColor('#16213e'))

style_h3 = ParagraphStyle('H3', parent=styles['Heading3'],
    fontSize=11, spaceAfter=4, textColor=colors.HexColor('#0f3460'))

style_body = ParagraphStyle('Body', parent=styles['Normal'],
    fontSize=9.5, leading=14, spaceAfter=6, alignment=TA_LEFT)

style_code = ParagraphStyle('Code', fontName='Courier',
    fontSize=8, leading=11, backColor=colors.HexColor('#f5f5f5'),
    textColor=colors.HexColor('#111111'), borderPad=6, spaceAfter=8,
    wordWrap='CJK')

style_note = ParagraphStyle('Note', parent=styles['Normal'],
    fontSize=9, backColor=colors.HexColor('#fff3cd'),
    leftIndent=12, rightIndent=12, borderPad=6, spaceAfter=6)

style_warning = ParagraphStyle('Warning', parent=styles['Normal'],
    fontSize=9, backColor=colors.HexColor('#f8d7da'),
    leftIndent=12, rightIndent=12, borderPad=6, spaceAfter=6)


# ────────────────────────────
#  Scrapers
# ────────────────────────────

def get_modules_list():
    print(f"[INDEX] Descargando lista de módulos...")
    resp = requests.get(INDEX_URL, timeout=15)
    resp.encoding = 'utf-8'
    soup = BeautifulSoup(resp.text, 'lxml')
    body = soup.find('div', class_='body')
    if not body:
        body = soup.find('article')
    links = body.select('a.reference.internal')
    
    modules, seen = [], set()
    for link in links:
        href = link.get('href', '')
        if not href or '#' in href or not href.endswith('.html'):
            continue
        if href in seen:
            continue
        seen.add(href)
        title = link.get_text(strip=True)
        if not title:
            title = href.replace('.html', '').capitalize()
        modules.append({'url': BASE_URL + href, 'title': title, 'href': href})
    
    print(f"  → {len(modules)} módulos encontrados.")
    return modules


def escape_para(text):
    """Escapa caracteres problemáticos para ReportLab Paragraph"""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text


def node_to_elements(node, story):
    """Convierte nodos BeautifulSoup a elementos ReportLab."""
    if not hasattr(node, 'children'):
        return
        
    for child in node.children:
        if not hasattr(child, 'name') or child.name is None:
            # Texto suelto — lo ignoramos (se procesa como parte del padre)
            continue
        
        tag = child.name.lower()
        
        if tag in ('h1', 'h2'):
            text = escape_para(child.get_text(strip=True))
            if text:
                story.append(Spacer(1, 0.3*cm))
                story.append(Paragraph(text, style_h1 if tag == 'h1' else style_h2))
                
        elif tag in ('h3', 'h4', 'h5', 'h6'):
            text = escape_para(child.get_text(strip=True))
            if text:
                story.append(Paragraph(text, style_h3))
                
        elif tag == 'p':
            text = escape_para(child.get_text(strip=True))
            if text:
                story.append(Paragraph(text, style_body))
                
        elif tag in ('pre', 'code') and child.parent.name != 'pre':
            text = child.get_text()
            if text.strip():
                # Limitamos la longitud para no desbordar la página
                lines = text.split('\n')[:80]
                truncated = '\n'.join(lines)
                story.append(Preformatted(truncated, style_code))
                
        elif tag == 'div' and 'note' in child.get('class', []):
            text = escape_para(child.get_text(strip=True)[:600])
            if text:
                story.append(Paragraph(f"💡 Nota: {text}", style_note))
                
        elif tag == 'div' and 'warning' in child.get('class', []):
            text = escape_para(child.get_text(strip=True)[:600])
            if text:
                story.append(Paragraph(f"⚠️ Advertencia: {text}", style_warning))
                
        elif tag == 'dl':
            for dt in child.find_all('dt'):
                term = escape_para(dt.get_text(strip=True)[:300])
                if term:
                    story.append(Paragraph(f"<b>{term}</b>", style_body))
            for dd in child.find_all('dd'):
                desc = escape_para(dd.get_text(strip=True)[:500])
                if desc:
                    story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;{desc}", style_body))
                    
        elif tag in ('ul', 'ol'):
            for li in child.find_all('li', recursive=False):
                text = escape_para(li.get_text(strip=True)[:400])
                if text:
                    story.append(Paragraph(f"• {text}", style_body))
                    
        elif tag == 'table':
            # Para tablas solo enviamos el texto plano
            text = escape_para(child.get_text(separator=' | ', strip=True)[:800])
            if text:
                story.append(Paragraph(text, style_code))
                
        else:
            # Procesar hijos recursivamente para divs y secciones
            node_to_elements(child, story)


def fetch_and_convert(url, title):
    """Descarga el módulo y devuelve una lista de flowables."""
    story = []
    try:
        resp = requests.get(url, timeout=12)
        resp.encoding = 'utf-8'
        soup = BeautifulSoup(resp.text, 'lxml')
        body = soup.find('div', class_='body')
        if not body:
            body = soup.find('article')
        
        if not body:
            story.append(Paragraph(escape_para(title), style_h1))
            story.append(Paragraph("(Sin contenido disponible)", style_body))
            return story
            
        # Limpiar navegación y elementos innecesarios
        for rm in body.find_all(['script', 'style']):
            rm.decompose()
        for rm in body.find_all(class_=['headerlink', 'sphinxsidebar', 'related', 'footer']):
            rm.decompose()

        node_to_elements(body, story)
        
        if not story:
            story.append(Paragraph(escape_para(title), style_h1))
            story.append(Paragraph("(Módulo sin descripción detallada)", style_body))
            
    except Exception as e:
        story.append(Paragraph(escape_para(title), style_h1))
        story.append(Paragraph(f"Error de descarga: {escape_para(str(e))}", style_body))
    
    return story


# ────────────────────────────
#  Generador de PDF por tomo
# ────────────────────────────

def generate_tomo(modules_chunk, chunk_num, total_chunks):
    pdf_path = os.path.join(OUT_DIR, f"Python_Lib_Tomo_{chunk_num}.pdf")
    print(f"\n{'='*60}")
    print(f"TOMO {chunk_num}/{total_chunks} -- {len(modules_chunk)} módulos --> {pdf_path}")
    print(f"{'='*60}")
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )
    
    story = []
    # Portada del tomo
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph(f"Python 3 — Biblioteca Estándar", style_h1))
    story.append(Paragraph(f"Tomo {chunk_num} de {total_chunks}", style_h2))
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1a1a2e')))
    story.append(Spacer(1, 0.5*cm))
    
    # Índice del tomo
    story.append(Paragraph("Contenido de este tomo:", style_h3))
    for i, m in enumerate(modules_chunk, 1):
        story.append(Paragraph(f"{i}. {escape_para(m['title'])}", style_body))
    story.append(PageBreak())
    
    for i, mod in enumerate(modules_chunk, 1):
        print(f"  [{i:02d}/{len(modules_chunk)}] {mod['title'][:60]} ...", end=' ', flush=True)
        
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cccccc')))
        mod_story = fetch_and_convert(mod['url'], mod['title'])
        story.extend(mod_story)
        story.append(PageBreak())
        
        print("OK")
        time.sleep(0.25)
    
    doc.build(story)
    size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
    print(f"✅ Tomo {chunk_num} listo → {size_mb:.1f} MB")


# ────────────────────────────
#  Main
# ────────────────────────────

def main():
    modules = get_modules_list()
    total = len(modules)
    total_chunks = math.ceil(total / SECTIONS_PER_CHUNK)
    print(f"\n{total} módulos → {total_chunks} tomos PDF en '{OUT_DIR}'\n")
    
    for i in range(total_chunks):
        start = i * SECTIONS_PER_CHUNK
        end   = start + SECTIONS_PER_CHUNK
        generate_tomo(modules[start:end], i + 1, total_chunks)
    
    print(f"\n🎉 ¡COMPLETADO! {total_chunks} PDFs listos en '{OUT_DIR}'")

if __name__ == '__main__':
    main()
