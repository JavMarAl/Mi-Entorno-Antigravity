import os
from playwright.sync_api import sync_playwright

html_file = 'Manual_Python_Libreria_Estandar.html'
pdf_file = 'Manual_Python_Libreria_Estandar.pdf'

def convert_html_to_pdf():
    # Asegúrate de proporcionar un path absoluto porque playwright lo requiere para file://
    absolute_html_path = f"file:///{os.path.abspath(html_file).replace(chr(92), '/')}"
    print(f"Abriendo: {absolute_html_path}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Cargando la página...")
        page.goto(absolute_html_path, wait_until='networkidle')
        
        print(f"Generando el archivo PDF en {pdf_file} ... (esto tomara unos segundos)")
        page.pdf(
            path=pdf_file,
            format="A4",
            print_background=True,
            margin={"top": "20px", "right": "20px", "bottom": "20px", "left": "20px"}
        )
        browser.close()
        print("✅ Generación del PDF compeltada con éxito.")

if __name__ == '__main__':
    convert_html_to_pdf()
