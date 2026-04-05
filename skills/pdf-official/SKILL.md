---
name: pdf-official
description: "Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms."
risk: safe
source: community
date_added: "2026-03-11"
---

# PDF Processing Guide

Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms.

## Core Python Libraries

### 1. pypdf (Merging, Splitting, Metadata)
- **Merge**: Use `PdfWriter` to accumulate pages from multiple `PdfReader` objects.
- **Split**: Create a new `PdfWriter` for each page or range of pages.
- **Rotate/Encrypt**: Rotate pages or add password protection using `writer.encrypt()`.

### 2. pdfplumber (Text and Table Extraction)
- **Text Layout**: `page.extract_text()` preserves layout better than other libraries.
- **Tables**: `page.extract_tables()` for structured data extraction. Integrates well with Pandas.

### 3. reportlab (PDF Creation)
- **Canvas**: Low-level drawing (lines, text, images).
- **Platypus**: High-level document creation (templates, flows, paragraphs, styles).

### 4. OCR and Scanning
- **Pytesseract + pdf2image**: Convert PDF to images first, then perform OCR for scanned documents.

## Command-Line Tools
- **pdftotext**: Fast text extraction from CLI.
- **qpdf**: Powerful CLI for merging, splitting, and decrypting (password removal).
- **pdfimages**: Extract all images from a PDF file.

## Common Operations Reference
- **Watermarking**: Merge a watermark page onto existing document pages.
- **Password Protection**: Encrypt documents with user/owner passwords.
- **Image Extraction**: Programmatic extraction of embedded visual assets.

## Resources
- **docs/reference.md**: Advanced patterns and JavaScript library comparisons.
- **docs/forms.md**: Detailed guide for filling interactive PDF forms.
- **examples/**: Python boilerplates for standard PDF tasks.
