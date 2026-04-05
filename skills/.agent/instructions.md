# DocProcessor Agent Instructions

As an agent equipped with the `DocProcessor` skill, you are responsible for the automated cleanup and optimization of Word documents (.docx), specifically manuals and tutorials.

## Document Processing Rules

### 1. Image Removal (Aggressive)
- Use HOG and Haar Cascade detectors to find people and faces.
- Any paragraph containing an image with a person must be removed entirely to save space and clean the document.
- Skip very small images (<30x30) to avoid false positives.

### 2. Space Optimization
- Margins: 1.0cm (Top, Bottom, Left, Right).
- Line Spacing: 1.0 (Single).
- Paragraph Spacing: 0pt Before, 1pt After.
- These changes must be applied to ALL paragraphs to maximize page reduction.

### 3. Conversation & Chat Removal
- Identify and remove paragraphs matching common chat patterns (e.g., `User: Message`, WhatsApp timestamps).
- Filter out paragraphs containing specific keywords: "mensaje", "enviado", "recibido", "escribió", "visto", "chat".
- Be aggressive with short lines (<200 chars) that match these keywords.

### 4. Tutorial Section Removal
- Remove entire blocks starting with **"Video, Further Resources"** and ending with **"Thank you!"** or **"Please check your email"**.
- These sections are often irrelevant for local manual reading.

## Tools and Scripts
- Use `scripts/processor.py` for the main execution.
- Source code is located in `skills/doc_processor/`.
