import requests
from bs4 import BeautifulSoup
import os
import sys
import time

BASE_URL = 'https://docs.python.org/3/library/'
INDEX_URL = BASE_URL + 'index.html'

def get_soup(url):
    print(f"Descargando {url} ...", flush=True)
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    # Para evitar errores raros de codificación, forzamos utf-8 si es necesario
    resp.encoding = 'utf-8'
    return BeautifulSoup(resp.text, 'html.parser')

def extract_main_content(soup):
    # La parte principal del documento en Sphinx
    body = soup.find('div', class_='body')
    if not body:
        # Algunos temas modernos de sphinx usan article
        body = soup.find('article')
    
    if not body:
        return None

    # Eliminar navegadores si están dentro de body (por suerte sphinx suele dejarlos fuera)
    # pero podemos asegurarnos quitando elementos no deseados de la clase headerlink
    for headerlink in body.find_all('a', class_='headerlink'):
        headerlink.decompose()
    
    return body

def main():
    print("Iniciando generación de manual...")
    print(f"Obteniendo índice principal de {INDEX_URL}")
    index_soup = get_soup(INDEX_URL)
    
    # En la página de índice, las secciones de la librería estándar están en .toctree-wrapper ul li a
    index_body = extract_main_content(index_soup)
    if not index_body:
        print("Error: No se encontró el cuerpo principal del índice.")
        sys.exit(1)
        
    links = index_body.select('.toctree-wrapper a.reference.internal')
    
    if not links:
        print("Advertencia: No se encontraron hipervínculos de la tabla de contenidos (toctree-wrapper). Usando alternativo.")
        links = index_body.find_all('a')
        # filtrar solo enlaces .html locales
        links = [l for l in links if l.get('href', '').endswith('.html') and '#' not in l.get('href', '')]

    # Limpiamos duplicados y preparamos URLs (guardando nombre y tag)
    modules_to_fetch = []
    seen = set()
    for link in links:
        href = link.get('href')
        if not href or href.startswith('http') or '#' in href:
            continue
        
        # Filtros adicionales
        if href in seen:
            continue
            
        seen.add(href)
        title = link.get_text(strip=True)
        if not title:
            title = href.replace('.html', '').capitalize()
            
        full_url = BASE_URL + href
        modules_to_fetch.append({
            'url': full_url,
            'title': title,
            'id': href.replace('.html', '').replace('/', '_')
        })
        
    print(f"Se encontraron {len(modules_to_fetch)} módulos/capítulos a descargar en el primer nivel.")
    
    toc_html = []
    content_html = []
    
    # Añadimos el índice propiamente modificado al manual aunque de forma estática
    content_html.append(f"<section id='manual-intro' class='module-section'>")
    content_html.append("<h1>Manual Profesional - Python 3 Standard Library</h1>")
    content_html.append("<p>Recopilación automatizada por AI. Primer nivel de documentación de los módulos oficiales.</p>")
    content_html.append("</section>")
    
    toc_html.append(f"<li><a href='#manual-intro'>Introducción</a></li>")

    # Limitado a 150 por si acaso para no pasarnos de memoria ni de tiempo, 
    # aunque la libreria estándar completa tiene unos ~330 submódulos. Debería funcionar bien para todos.
    print("Descargando módulos secuencialmente... (esto tomará unos minutos)")
    total = len(modules_to_fetch)
    for i, mod in enumerate(modules_to_fetch, start=1):
        print(f"[{i}/{total}] Procesando: {mod['title']} ...", end=" ")
        
        try:
            mod_soup = get_soup(mod['url'])
            mod_content = extract_main_content(mod_soup)
            
            if mod_content:
                # Arreglamos imágenes (rutas relativas a absolutas para visualizarlas online en el docs)
                for img in mod_content.find_all('img'):
                    src = img.get('src')
                    if src and not src.startswith('http'):
                        img['src'] = BASE_URL + src
                
                # Transformamos hipervínculos internos dentro de la página para intentar mantener anclas
                for a in mod_content.find_all('a'):
                    href = a.get('href')
                    if href and not href.startswith('http'):
                        # Simplificación: si apunta a otro .html de la lib estándar, ponerlo como texto normal 
                        # o mantenerlo si construimos todo el sitio interno
                        pass # Dejamos el ancla rota o podríamos mapearlos a #id
                        
                # Ajustamos los headers (h1, h2, etc.) para visualización dentro de la página grande
                for h in mod_content.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                    pass # por si quisiéramos bajarlos un nivel de cabecera

                content_html.append(f"<section id='{mod['id']}' class='module-section'>")
                # Agregamos el contenido del body directamente (el h1 original del sphinx usualmente está ahí)
                content_html.append(str(mod_content))
                content_html.append("</section>")
                
                toc_num = f"{i}."
                toc_html.append(f"<li><a href='#{mod['id']}'><b>{toc_num}</b> {mod['title']}</a></li>")
                print("OK")
            else:
                print("SIN CONTENIDO (omitido)")
                
        except Exception as e:
            print(f"ERROR: {e}")
            
        # Pequeña pausa para no saturar los servidores de python.org
        time.sleep(0.5)
        
    # Plantilla HTML FINAL (Súper profesional, con modo claro elegante y TOC lateral)
    print("¡Descargas finalizadas! Ensamblando el documento HTML...")
    
    FINAL_HTML = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Súper Manual - Python 3 Standard Library</title>
    <style>
        :root {{
            --bg-body: #f7f9fa;
            --bg-sidebar: #2c3e50;
            --text-sidebar: #ecf0f1;
            --text-main: #333333;
            --color-link: #2980b9;
            --color-code: #1e1e1e;
            --bg-code: #f0f0f0;
            --border-color: #ecf0f1;
            --active-link: #e74c3c;
        }}
        
        body {{
            margin: 0;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-body);
            color: var(--text-main);
            display: flex;
            height: 100vh;
            overflow: hidden;
            line-height: 1.6;
        }}
        
        /* Contenedor Flex para Sidebar y Main Content */
        #sidebar {{
            width: 380px;
            background-color: var(--bg-sidebar);
            color: var(--text-sidebar);
            overflow-y: auto;
            border-right: 1px solid var(--border-color);
            padding: 20px;
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }}
        
        #sidebar h2 {{
            font-size: 1.4rem;
            margin-top: 0;
            padding-bottom: 10px;
            border-bottom: 2px solid rgba(255,255,255,0.1);
            color: #fff;
        }}
        
        #sidebar ul {{
            list-style: none;
            padding: 0;
            margin: 0;
        }}
        
        #sidebar li {{
            margin-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 4px;
        }}
        
        #sidebar a {{
            color: var(--text-sidebar);
            text-decoration: none;
            font-size: 0.95rem;
            display: block;
            transition: color 0.2s, padding-left 0.2s;
        }}
        
        #sidebar a:hover {{
            color: var(--active-link);
            padding-left: 5px;
        }}
        
        #main-content {{
            flex: 1;
            padding: 40px 60px;
            overflow-y: auto;
            background-color: #ffffff;
            scroll-behavior: smooth;
        }}
        
        .module-section {{
            max-width: 900px;
            margin: 0 auto;
            margin-bottom: 60px;
            padding-bottom: 40px;
            border-bottom: 2px dashed #ddd;
        }}
        
        h1, h2, h3, h4 {{
            color: #2c3e50;
            margin-top: 1.5em;
        }}
        
        h1 {{
            font-size: 2.2rem;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 10px;
        }}
        
        /* Estilos genéricos para el HTML de Sphinx transferido */
        a {{
            color: var(--color-link);
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        
        pre {{
            background-color: var(--bg-code);
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'Consolas', 'Courier New', Courier, monospace;
            font-size: 0.9rem;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
        }}
        
        code {{
            font-family: 'Consolas', 'Courier New', Courier, monospace;
            background-color: var(--bg-code);
            padding: 2px 5px;
            border-radius: 3px;
        }}
        
        .note, .warning, .versionadded, .versionchanged {{
            background-color: #fdfae5;
            border-left: 5px solid #f39c12;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 0 5px 5px 0;
        }}
        
        .warning {{
            background-color: #fde8e8;
            border-left: 5px solid #e74c3c;
        }}
        
        .versionadded, .versionchanged {{
            background-color: #e8f8f5;
            border-left: 5px solid #1abc9c;
            font-style: italic;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }}
        
        th, td {{
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }}
        
        th {{
            background-color: #f4f6f7;
        }}
        
        /* Botón de volver arriba */
        #go-top {{
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #2c3e50;
            color: white;
            text-decoration: none;
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            opacity: 0.8;
            transition: opacity 0.3s;
        }}
        #go-top:hover {{
            opacity: 1;
        }}

    </style>
</head>
<body>

    <nav id="sidebar">
        <h2>📚 Índice Interactivo</h2>
        <ul>
            {"".join(toc_html)}
        </ul>
    </nav>

    <main id="main-content">
        {"".join(content_html)}
        <a href="#manual-intro" id="go-top">⬆ Volver Arriba</a>
    </main>

</body>
</html>
"""

    output_file = 'Manual_Python_Libreria_Estandar.html'
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(FINAL_HTML)
        print(f"\n✅ ¡ÉXITO! El manual profesional se ha guardado en: {os.path.abspath(output_file)}")
        print("💡 Puedes abrir este archivo usando Google Chrome, Edge o tu navegador favorito dando doble clic.")
    except Exception as e:
        print(f"Error guardando el archivo HTML: {e}")

if __name__ == "__main__":
    main()
