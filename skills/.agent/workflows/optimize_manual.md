---
description: How to optimize a large Word manual by removing people, conversations, and redundant sections.
---

// turbo-all
1. Ensure the document to be processed is located in a known path (e.g., `c:\Users\Lenovo\Desktop\Document.docx`).
2. Run the `DocProcessor` script with the input flag:
   ```powershell
   python c:\Users\Lenovo\Desktop\skills\doc_processor\scripts\processor.py --input "C:\Path\To\Your\Document.docx"
   ```
3. The script will automatically perform:
   - People and face detection/removal.
   - Conversation pattern cleanup.
   - Section removal (Video/Further Resources to Thank You).
   - Space optimization (Margins, Spacing).
4. Verify the output file named `*_optimized_v3.docx`.
5. Check the paragraph count using:
   ```powershell
   python -c "from docx import Document; print(len(Document(r'C:\Path\To\Your\Document_optimized_v3.docx').paragraphs))"
   ```
