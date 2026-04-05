const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    try {
        console.log("Iniciando generación de PDF...");
        const browser = await puppeteer.launch({
            headless: "new",
            executablePath: 'C:\\\\Users\\\\Lenovo\\\\.cache\\\\puppeteer\\\\chrome\\\\win64-145.0.7632.77\\\\chrome-win64\\\\chrome.exe'
        });
        const page = await browser.newPage();

        console.log("Navegando a la documentación de Python...");
        await page.goto('https://docs.python.org/3/library/functions.html', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        console.log("Aplicando estilos profesionales...");
        await page.evaluate(() => {
            // Eliminar elementos no deseados de la web original
            const selectorsToRemove = ['.sphinxsidebar', '.related', '#searchbox', '.headerlink', '.search'];
            selectorsToRemove.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => el.remove());
            });

            // Ajustar el contenedor principal
            const docDiv = document.querySelector('div.document');
            if (docDiv) {
                docDiv.style.width = '100%';
                docDiv.style.margin = '0 auto';
            }
            const bodyWrap = document.querySelector('.bodywrapper');
            if (bodyWrap) {
                bodyWrap.style.margin = '0';
                bodyWrap.style.width = '100%';
            }

            // body font y background para PDF
            document.body.style.fontFamily = "'Open Sans', 'Helvetica Neue', Arial, sans-serif";
            document.body.style.color = '#333';
            document.body.style.lineHeight = '1.6';
            document.body.style.backgroundColor = '#fff';

            // Crear y agregar Portada
            const coverHTML = `
                <div id="pdf-cover" style="text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; page-break-after: always; font-family: 'Helvetica Neue', Arial, sans-serif; box-sizing: border-box; padding-top: 150px;">
                    <img src="https://www.python.org/static/community_logos/python-logo-master-v3-TM.png" alt="Python" style="width: 300px; margin: 0 auto 50px auto;">
                    <h1 style="font-size: 3.5em; color: #306998; margin-bottom: 20px;">Built-in Functions</h1>
                    <h2 style="font-size: 2em; color: #FFD43B;">The Python 3 Standard Library</h2>
                    <p style="margin-top: 50px; font-size: 1.2em; color: #777; text-transform: uppercase; letter-spacing: 2px;">Professional Reference Manual</p>
                </div>
            `;
            const body = document.querySelector('.body');
            if (body) {
                body.insertAdjacentHTML('afterbegin', coverHTML);
            }

            // Crear Tabla de Contenidos (TOC) revisando las funciones documentadas
            const functions = document.querySelectorAll('dl.function > dt, dl.class > dt, dl.type > dt');
            let tocHTML = `
                <div id="pdf-toc" style="page-break-after: always; padding: 40px; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    <h1 style="color: #306998; border-bottom: 2px solid #FFD43B; padding-bottom: 15px; margin-bottom: 30px;">Table of Contents</h1>
                    <div style="column-count: 2; column-gap: 50px; font-size: 1.1em; line-height: 1.8;">
                        <ul style="list-style-type: none; padding: 0; margin: 0;">
            `;

            functions.forEach((fn) => {
                const id = fn.getAttribute('id');
                let textElem = fn.querySelector('code.sig-name');
                let text = textElem ? textElem.textContent : fn.textContent.split('(')[0].replace('¶', '');

                text = text.trim();

                if (id && text && text.length > 0) {
                    tocHTML += `<li><a href="#${id}" style="color: #444; text-decoration: none; border-bottom: 1px dotted #ccc; display: block;">${text}()</a></li>`;
                }
            });

            tocHTML += `</ul ></div ></div > `;
            const cover = document.getElementById('pdf-cover');
            if (cover) {
                cover.insertAdjacentHTML('afterend', tocHTML);
            }

            // Mejorar estilos de las definiciones (Cada función como una ficha profesional)
            document.querySelectorAll('dl.function, dl.class, dl.type').forEach(dl => {
                dl.style.pageBreakInside = 'avoid';
                dl.style.marginBottom = '30px';
                dl.style.border = '1px solid #eaeaea';
                dl.style.borderRadius = '8px';
                dl.style.padding = '0'; // movimos el padding a dt y dd
                dl.style.backgroundColor = '#fff';
                dl.style.overflow = 'hidden';
            });

            document.querySelectorAll('dt').forEach(dt => {
                dt.style.backgroundColor = '#f4f7f8';
                dt.style.padding = '15px 25px';
                dt.style.borderBottom = '1px solid #eaeaea';
                dt.style.color = '#306998';
                dt.style.fontFamily = 'Consolas, Monaco, monospace';
                dt.style.fontSize = '1.3em';
                dt.style.fontWeight = 'bold';
            });

            document.querySelectorAll('dd').forEach(dd => {
                dd.style.padding = '20px 25px';
                dd.style.margin = '0';
            });

            // Estilos para bloques de pre-código
            document.querySelectorAll('pre').forEach(pre => {
                pre.style.backgroundColor = '#282c34';
                pre.style.color = '#abb2bf';
                pre.style.padding = '15px';
                pre.style.borderRadius = '5px';
                pre.style.whiteSpace = 'pre-wrap';
                pre.style.wordBreak = 'break-all';
                pre.style.pageBreakInside = 'avoid';
                pre.style.border = '1px solid #1e2227';
            });

            // Inline code segments
            document.querySelectorAll('code').forEach(code => {
                if (!code.closest('pre')) {
                    code.style.backgroundColor = '#f5f5f5';
                    code.style.padding = '2px 5px';
                    code.style.borderRadius = '3px';
                    code.style.color = '#c7254e';
                    code.style.fontFamily = 'Consolas, Monaco, monospace';
                }
            });
        });

        console.log("Generando archivo PDF con Cabecera y Pie de página...");
        const outputPath = path.resolve(__dirname, 'Python_Builtin_Functions_Manual.pdf');

        // Inyectar CSS global para asegurar los márgenes durante la impresión
        // Esto elimina los márgenes internos predeterminados de chrome
        await page.addStyleTag({ content: '@page { margin: 0; }' });

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '25mm',
                right: '20mm',
                bottom: '25mm',
                left: '20mm'
            },
            displayHeaderFooter: true,
            headerTemplate: `
                        < div style = "font-size: 9px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #888; width: 100%; text-align: right; padding-right: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-left: 20px; margin-right: 20px;" >
                            Python 3 Standard Library - Built -in Functions
                </div >
                        `,
            footerTemplate: `
                        < div style = "font-size: 10px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #555; width: 100%; display: flex; justify-content: space-between; padding: 10px 20px 0; border-top: 1px solid #eee; margin-left: 20px; margin-right: 20px;" >
                    <span style="color: #888;">Professional Reference Manual</span>
                    <span style="font-weight: bold;">Página <span class="pageNumber"></span> / <span class="totalPages"></span></span>
                </div >
                        `
        });

        console.log("¡PDF generado exitosamente en: " + outputPath + "!");
        await browser.close();
    } catch (e) {
        console.error("Error generando el PDF:", e);
        process.exit(1);
    }
})();
