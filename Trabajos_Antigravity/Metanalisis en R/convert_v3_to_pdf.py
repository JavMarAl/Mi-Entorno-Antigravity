import os
from docx2pdf import convert

def main():
    docx_path = r"c:\Trabajos Antigravity\Metanalisis en R\Manual_Metanalisis_Profesional_v3.docx"
    pdf_path = r"c:\Trabajos Antigravity\Metanalisis en R\Manual_Metanalisis_Profesional_v3.pdf"
    
    if not os.path.exists(docx_path):
        print(f"Error: Could not find {docx_path}")
        return
        
    print(f"Converting {docx_path} to PDF...")
    try:
        convert(docx_path, pdf_path)
        print(f"Success! Saved as {pdf_path}")
    except Exception as e:
        print(f"Error during conversion: {e}")

if __name__ == "__main__":
    main()
