const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log('Starting browser...');
        // Launch puppeteer
        const browser = await puppeteer.launch({
            headless: "new"
        });
        const page = await browser.newPage();

        console.log('Navigating to PEP 8 page...');
        // Go to PEP 8 URL and wait until network is idle to ensure all fonts/styles are loaded
        await page.goto('https://peps.python.org/pep-0008/', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        console.log('Injecting custom CSS to optimize layout for PDF...');
        // Inject CSS to hide unwanted elements like header, sidebar, and expand the main content
        await page.addStyleTag({
            content: `
                /* Hide header and navigation sidebar to save space */
                .pep-page-header, 
                .sphinxsidebar, 
                header, 
                footer, 
                nav,
                .related,
                .button-group {
                    display: none !important;
                }

                /* Expand main content to full width */
                div.document, 
                div.documentwrapper, 
                div.bodywrapper, 
                .body {
                    margin: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 0 !important;
                }

                /* Ensure code blocks and tables do not break awkwardly */
                pre, code {
                    white-space: pre-wrap !important;
                    word-wrap: break-word !important;
                    word-break: break-all !important;
                    max-width: 100% !important;
                    page-break-inside: avoid;
                }
                table {
                    page-break-inside: avoid;
                    max-width: 100%;
                }

                /* Optimize typography for print */
                body {
                    font-size: 11pt;
                    line-height: 1.4;
                }
                
                h1, h2, h3, h4 {
                    page-break-after: avoid;
                }
            `
        });

        console.log('Expanding all <details> elements to show hidden content...');
        // Open all <details> elements (such as the Table of Contents and any subchapters)
        await page.evaluate(() => {
            const detailsElements = document.querySelectorAll('details');
            detailsElements.forEach(detail => {
                detail.setAttribute('open', '');
            });
            window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const outputPath = path.resolve(__dirname, '..', 'PEP8_Manual_Profesional_Completo.pdf');

        console.log(`Generating PDF at ${outputPath}...`);

        // Generate PDF
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true, // Keeps syntax highlighting and background colors
            displayHeaderFooter: true,
            tagged: true, // Generate Tagged PDF for accessibility and interactive links
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            },
            headerTemplate: '<div></div>', // Empty header
            footerTemplate: `
            < div style = "font-size: 10px; text-align: center; width: 100%; font-family: Arial, sans-serif;" >
            <span class="pageNumber"></span> / <span class="totalPages"></span>
                </div >
            `
        });

        console.log('PDF successfully generated!');
        await browser.close();

    } catch (error) {
        console.error('Error generating PDF:', error);
    }
})();
