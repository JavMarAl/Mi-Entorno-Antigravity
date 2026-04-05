---
name: pdf
description: Use this skill whenever the user wants to do anything with PDF files. This includes reading or extracting text/tables from PDFs, combining or merging multiple PDFs into one, splitting PDFs apart, rotating pages, adding watermarks, creating new PDFs, filling PDF forms, encrypting/decrypting PDFs, extracting images, and OCR on scanned PDFs to make them searchable. If the user mentions a .pdf file or asks to produce one, use this skill.
license: Proprietary. LICENSE.txt has complete terms
---

# PDF Processing Guide

## Quick Start

```bash
uv pip install pypdf pdfplumber reportlab
```

```python
from pypdf import PdfReader, PdfWriter
reader = PdfReader("document.pdf")
text = "".join(page.extract_text() for page in reader.pages)
```

## Library Selection

| Task | Best Tool |
|------|-----------|
| Merge / split / rotate PDFs | `pypdf` |
| Extract text (layout-aware) | `pdfplumber` |
| Extract tables → DataFrame | `pdfplumber` + `pandas` |
| Create new PDFs | `reportlab` |
| Fill PDF forms | `pdf-lib` (JS) or `pypdf` → see `FORMS.md` |
| OCR scanned PDFs | `pytesseract` + `pdf2image` |
| Command-line merge/split | `qpdf` |

## pypdf — Basic Operations

```python
from pypdf import PdfReader, PdfWriter

# Merge PDFs
writer = PdfWriter()
for pdf in ["doc1.pdf", "doc2.pdf"]:
    for page in PdfReader(pdf).pages:
        writer.add_page(page)
with open("merged.pdf", "wb") as f: writer.write(f)

# Split PDF (one page per file)
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    w = PdfWriter(); w.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as f: w.write(f)

# Rotate
page = PdfReader("input.pdf").pages[0]
page.rotate(90)

# Password protect
writer.encrypt("userpassword", "ownerpassword")

# Add watermark
watermark = PdfReader("watermark.pdf").pages[0]
for page in reader.pages:
    page.merge_page(watermark)
```

## pdfplumber — Text and Table Extraction

```python
import pdfplumber, pandas as pd

with pdfplumber.open("document.pdf") as pdf:
    # Text
    text = "\n".join(page.extract_text() for page in pdf.pages)

    # Tables → DataFrame
    dfs = []
    for page in pdf.pages:
        for table in page.extract_tables():
            if table:
                dfs.append(pd.DataFrame(table[1:], columns=table[0]))
    combined = pd.concat(dfs, ignore_index=True) if dfs else None
```

## reportlab — Create PDFs

```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

doc = SimpleDocTemplate("report.pdf", pagesize=letter)
styles = getSampleStyleSheet()
story = [
    Paragraph("Report Title", styles['Title']),
    Spacer(1, 12),
    Paragraph("Body text here.", styles['Normal'])
]
doc.build(story)
```

> ⚠️ **IMPORTANT**: Never use Unicode subscript/superscript characters (₀₁₂, ⁰¹²) in ReportLab — they render as black boxes. Use XML markup instead:
> ```python
> Paragraph("H<sub>2</sub>O and x<super>2</super>", styles['Normal'])
> ```

## OCR (Scanned PDFs)

```bash
uv pip install pytesseract pdf2image
```
```python
import pytesseract
from pdf2image import convert_from_path
images = convert_from_path('scanned.pdf')
text = "\n\n".join(f"Page {i+1}:\n{pytesseract.image_to_string(img)}" for i, img in enumerate(images))
```

## Command-Line Tools

```bash
# Merge with qpdf
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# Split pages
qpdf input.pdf --pages . 1-5 -- pages1-5.pdf

# Rotate page 1
qpdf input.pdf output.pdf --rotate=+90:1

# Remove password
qpdf --password=mypassword --decrypt encrypted.pdf decrypted.pdf

# Extract text (poppler)
pdftotext -layout input.pdf output.txt

# Extract images (poppler)
pdfimages -j input.pdf prefix
```

## Reference Files

- `REFERENCE.md` — Advanced operations, pypdfium2, JavaScript pdf-lib, troubleshooting
- `FORMS.md` — PDF form filling instructions (follow carefully for form tasks)
