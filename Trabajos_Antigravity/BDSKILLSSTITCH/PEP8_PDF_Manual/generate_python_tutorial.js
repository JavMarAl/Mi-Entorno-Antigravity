const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    try {
        console.log('Starting browser...');
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        const baseUrl = 'https://docs.python.org/3/tutorial/';
        const indexUrl = `${baseUrl}index.html`;

        console.log(`Navigating to Index: ${indexUrl}...`);
        await page.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Extract Links from the Table of Contents
        console.log('Extracting chapter links...');
        const chapterLinks = await page.evaluate(() => {
            const links = [];
            const tocElements = document.querySelectorAll('.toctree-l1 > a.reference.internal');
            tocElements.forEach(el => links.push(el.getAttribute('href')));
            return links;
        });

        console.log(`Found ${chapterLinks.length} chapters.`);

        let masterHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <title>The Python 3 Tutorial</title>
                <style>
                    /* Custom print layout applied directly to the master document */
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 11pt;
                        line-height: 1.5;
                        margin: 0;
                        padding: 0;
                        width: 100%;
                    }
                    /* Ensure headers don't break awkwardly */
                    h1, h2, h3, h4, section {
                        page-break-after: avoid;
                    }
                    /* Wrap code and prevent truncation */
                    pre, code {
                        white-space: pre-wrap !important;
                        word-wrap: break-word !important;
                        word-break: break-all !important;
                        max-width: 100% !important;
                        page-break-inside: avoid;
                        background-color: #f4f4f4;
                        padding: 10px;
                        border-radius: 4px;
                        display: block;
                    }
                    table {
                        page-break-inside: avoid;
                        max-width: 100%;
                        border-collapse: collapse;
                        width: 100%;
                    }
                    table, th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                    }
                    /* Add page break between chapters */
                    .chapter-container {
                        page-break-before: always;
                    }
                    /* The first chapter doesn't need a break before */
                    .chapter-container:first-of-type {
                        page-break-before: auto;
                    }
                    /* Hide unnecessary web UI elements if they happen to be copied over */
                    .sphinxsidebar, header, footer, nav, .related, .button-group {
                        display: none !important;
                    }
                    /* Professional TOC styling */
                    .toctree-wrapper {
                        background: #fbfbfb;
                        border-left: 5px solid #2980b9;
                        padding: 15px 25px;
                        margin: 20px 0;
                        border-radius: 4px;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }
                    .toctree-wrapper ul {
                        list-style-type: none;
                        padding-left: 15px;
                    }
                    .toctree-wrapper li {
                        margin-bottom: 8px;
                    }
                    .toctree-wrapper a.reference.internal {
                        color: #2980b9 !important;
                        text-decoration: none;
                    }
                    .toctree-l1 > a.reference.internal {
                        font-size: 1.15em;
                        font-weight: bold;
                        border-bottom: 1px dotted #ccc;
                        display: inline-block;
                        margin-bottom: 3px;
                    }
                    .toctree-l2 > a.reference.internal {
                        font-size: 1em;
                        color: #444 !important;
                    }
                    .toctree-wrapper a:hover {
                        text-decoration: underline !important;
                    }
                </style>
            </head>
            <body>
            <h1 style="text-align: center; margin-top: 50px;">The Python 3 Tutorial Professional Manual</h1>
            <p style="text-align: center;">Compiled automatically.</p>
            <div style="page-break-after: always;"></div>
        `;

        // Extract the Table of Contents from the index page and add it as the first chapter
        console.log('Extracting Table of Contents (index page) content...');
        const indexHtml = await page.evaluate(() => {
            const bodyEl = document.querySelector('[itemprop="articleBody"]') || document.querySelector('.body') || document.body;
            const links = bodyEl.querySelectorAll('a');
            links.forEach(l => {
                const href = l.getAttribute('href');
                if (l.classList.contains('headerlink')) {
                    l.style.display = 'none';
                } else if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
                    if (href.startsWith('#')) return;
                    const parts = href.split('#');
                    const pagePart = parts[0];
                    const hashPart = parts[1];
                    if (hashPart) {
                        l.setAttribute('href', '#' + hashPart);
                    } else if (pagePart) {
                        l.setAttribute('href', '#doc-' + pagePart);
                    }
                }
            });
            return bodyEl.innerHTML;
        });

        // Add the TOC HTML directly
        masterHtml += `<div id="doc-index.html" class="chapter-container">${indexHtml}</div>`;

        // Scrape each chapter one by one
        for (const link of chapterLinks) {
            const chapterUrl = `${baseUrl}${link}`;
            console.log(`Fetching chapter: ${link}...`);
            await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Expand details (in case there are any)
            await page.evaluate(() => {
                const detailsElements = document.querySelectorAll('details');
                detailsElements.forEach(detail => detail.setAttribute('open', ''));
            });

            // Extract the main content of the chapter (excluding sidebars and headers)
            const chapterHtml = await page.evaluate(() => {
                // The main content in Sphinx documentation is usually under [itemprop="articleBody"] or .body
                const bodyEl = document.querySelector('[itemprop="articleBody"]') || document.querySelector('.body') || document.body;

                // Restructure relative links to PDF-compatible internal anchors
                const links = bodyEl.querySelectorAll('a');
                links.forEach(l => {
                    const href = l.getAttribute('href');
                    if (l.classList.contains('headerlink')) {
                        l.style.display = 'none'; // Hide the "¶" paragraph link symbols
                    } else if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
                        if (href.startsWith('#')) return;
                        const parts = href.split('#');
                        const pagePart = parts[0];
                        const hashPart = parts[1];
                        // If it links to a specific id inside a chapter, point directly to that id 
                        if (hashPart) {
                            l.setAttribute('href', '#' + hashPart);
                        } else if (pagePart) {
                            // Point to the entire chapter wrapper
                            l.setAttribute('href', '#doc-' + pagePart);
                        }
                    }
                });

                return bodyEl.innerHTML;
            });

            masterHtml += `<div id="doc-${link}" class="chapter-container">${chapterHtml}</div>`;
        }

        masterHtml += `</body></html>`;

        // We write the compiled HTML to a temporary file, then load it back to Puppeteer to print it
        const tempHtmlPath = path.resolve(__dirname, 'temp_python_tutorial.html');
        fs.writeFileSync(tempHtmlPath, masterHtml, 'utf8');

        console.log('Loading compiled HTML directly into browser...');
        // Convert Windows backslashes to forward slashes for the file URI
        const fileUri = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
        await page.goto(fileUri, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const outputPath = path.resolve(__dirname, '..', 'Python_Tutorial_Profesional_Interactivo.pdf');
        console.log(`Generating PDF at ${outputPath}...`);

        await page.pdf({
            path: outputPath,
            format: 'A4',
            timeout: 0,
            printBackground: true,
            displayHeaderFooter: true,
            tagged: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            },
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="font-size: 10px; text-align: center; width: 100%; font-family: Arial, sans-serif;">
                    <span class="pageNumber"></span> / <span class="totalPages"></span>
                </div>
            `
        });

        console.log('PDF successfully generated!');

        // Cleanup temp file
        if (fs.existsSync(tempHtmlPath)) {
            fs.unlinkSync(tempHtmlPath);
        }

        await browser.close();

    } catch (error) {
        console.error('Error generating PDF:', error);
    }
})();
