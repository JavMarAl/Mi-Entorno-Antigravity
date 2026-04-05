/**
 * MetaAnalysis Pro — Export Module
 * 
 * Handles exporting charts to PNG and data/results to CSV.
 */

const ExportModule = (() => {
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadText(text, filename, mimeType = 'text/csv') {
        const blob = new Blob(['\uFEFF' + text], { type: mimeType + ';charset=utf-8' });
        downloadBlob(blob, filename);
    }

    /**
     * Export an SVG element to PNG
     */
    function exportSvgToPng(containerSelector, filename = 'chart.png') {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        const svg = container.querySelector('svg');
        if (!svg) { showToast('No hay gráfico para exportar', 'error'); return; }
        Charts.svgToPng(svg, filename);
        showToast(`${filename} descargado`, 'success');
    }

    /**
     * Export study input data as CSV
     */
    function exportInputData() {
        const tbody = document.getElementById('table-body');
        const studies = DataEntry.getStudies(tbody);
        if (studies.length === 0) { showToast('No hay datos para exportar', 'error'); return; }
        const csv = DataEntry.toCSV(studies);
        downloadText(csv, 'metaanalysis_data.csv');
        showToast('Datos exportados', 'success');
    }

    /**
     * Export analysis results as CSV
     */
    function exportResults(results) {
        if (!results) { showToast('Ejecuta un análisis primero', 'error'); return; }

        const { pooled, effects, labels, yi, sei, analysisType, effectMeasure, egger, begg, fsn } = results;
        const isLog = analysisType === 'binary';
        const transform = isLog ? Math.exp : (v) => v;
        const effectLabel = StatsEngine.getEffectLabel(analysisType, effectMeasure);

        let csv = `Metaanálisis — Resultados\n`;
        csv += `Modelo,${pooled.model === 'random' ? 'Efectos Aleatorios' : 'Efectos Fijos'}\n`;
        csv += `Tipo,${analysisType}\n`;
        csv += `Medida,${effectMeasure}\n`;
        csv += `k,${pooled.k}\n`;
        csv += `${effectLabel} global,${transform(pooled.theta).toFixed(4)}\n`;
        csv += `SE,${pooled.se.toFixed(4)}\n`;
        csv += `95% CI,[${transform(pooled.ci[0]).toFixed(4)}; ${transform(pooled.ci[1]).toFixed(4)}]\n`;
        csv += `Z,${pooled.z.toFixed(4)}\n`;
        csv += `p,${pooled.p.toFixed(6)}\n\n`;

        // Heterogeneity
        csv += `Heterogeneidad\n`;
        csv += `Q,${pooled.Q.toFixed(4)}\n`;
        csv += `df,${pooled.dfQ}\n`;
        csv += `p (Q),${pooled.pQ.toFixed(6)}\n`;
        if (pooled.I2 !== undefined) {
            csv += `I²,${pooled.I2.toFixed(2)}%\n`;
            csv += `τ²,${pooled.tau2.toFixed(4)}\n`;
            csv += `τ,${pooled.tau.toFixed(4)}\n`;
            csv += `H²,${pooled.H2.toFixed(4)}\n`;
        }
        csv += '\n';

        // Publication bias
        csv += `Sesgo de Publicación\n`;
        csv += `Egger intercept,${egger.intercept?.toFixed(4) || 'N/A'}\n`;
        csv += `Egger p,${egger.p?.toFixed(6) || 'N/A'}\n`;
        csv += `Begg τ,${begg.tau?.toFixed(4) || 'N/A'}\n`;
        csv += `Begg p,${begg.p?.toFixed(6) || 'N/A'}\n`;
        csv += `Fail-safe N,${fsn.fsn}\n\n`;

        // Individual studies
        csv += `Estudio,${effectLabel},SE,95% CI Inf,95% CI Sup,Peso (%)\n`;
        labels.forEach((label, i) => {
            const w = (pooled.weights[i] * 100).toFixed(2);
            const ciLo = yi[i] - 1.96 * sei[i];
            const ciHi = yi[i] + 1.96 * sei[i];
            csv += `${label},${transform(yi[i]).toFixed(4)},${sei[i].toFixed(4)},${transform(ciLo).toFixed(4)},${transform(ciHi).toFixed(4)},${w}\n`;
        });

        downloadText(csv, 'metaanalysis_results.csv');
        showToast('Resultados exportados', 'success');
    }

    /**
     * Generate Full Print / PDF Report
     */
    function generateFullReport(results) {
        if (!results) { showToast('Ejecuta un análisis primero', 'error'); return; }

        const { pooled, labels, yi, sei, analysisType, effectMeasure, egger, begg } = results;
        const isLog = analysisType === 'binary';
        const transform = isLog ? Math.exp : (v) => v;
        const effectLabel = StatsEngine.getEffectLabel(analysisType, effectMeasure);
        const modelDesc = pooled.model === 'random' ? 'Aleatorios' : 'Fijos';

        let reportWin = window.open('', '_blank');
        if (!reportWin) {
            showToast('El navegador bloqueó la ventana emergente', 'error');
            return;
        }

        let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte - MetaAnalysis Pro</title>
    <style>
        body { font-family: "Inter", "Segoe UI", system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.5; max-width: 1000px; margin: 0 auto; background: #fff; }
        h1 { border-bottom: 2px solid #eaebec; padding-bottom: 10px; color: #000; font-size: 24px; }
        h2 { margin-top: 40px; color: #0088ff; font-size: 18px; border-bottom: 1px solid #eaebec; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-block: 20px; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background-color: #f6f8fa; font-weight: 600; color: #24292e; }
        .chart-img { max-width: 100%; height: auto; margin: 20px 0; border: 1px solid #eaebec; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .metric { background: #f6f8fa; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #0088ff; }
        .metric strong { display: block; font-size: 1.2rem; color: #0088ff; margin-bottom: 8px; }
        @media print { 
            .no-print { display: none; }
            body { padding: 0; max-width: 100%; }
            .chart-Container { page-break-inside: avoid; margin-top: 40px; }
            h2 { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #0088ff; color: white; border: none; border-radius: 6px; font-weight: 600;">Imprimir o Guardar PDF</button>
    </div>
    <h1>Reporte de Metaanálisis (MetaAnalysis Pro)</h1>
    <p>Fecha de generación: ${new Date().toLocaleString()}</p>
    
    <div class="grid">
        <div class="metric">
            <strong>Efecto Global (${effectLabel})</strong>
            <div style="font-size: 1.5em; font-weight: 600;">${transform(pooled.theta).toFixed(3)}</div>
            <div>[${transform(pooled.ci[0]).toFixed(3)}, ${transform(pooled.ci[1]).toFixed(3)}]</div>
            <div style="margin-top: 10px; font-size: 0.9em; color: #555;">
                Modelo de Efectos ${modelDesc} (k=${pooled.k})<br>
                Z = ${pooled.z.toFixed(2)}, p = ${pooled.p < 0.001 ? '<0.001' : pooled.p.toFixed(4)}
            </div>
        </div>
        <div class="metric">
            <strong>Heterogeneidad</strong>
            <div style="font-size: 1.5em; font-weight: 600;">I² = ${pooled.I2 !== undefined ? pooled.I2.toFixed(1) + '%' : 'N/A'}</div>
            <div style="margin-top: 10px; font-size: 0.9em; color: #555;">
                Q(${pooled.dfQ}) = ${pooled.Q.toFixed(2)}, p = ${pooled.pQ < 0.001 ? '<0.001' : pooled.pQ.toFixed(4)}<br>
                ${pooled.tau2 !== undefined ? `τ² = ${pooled.tau2.toFixed(4)}` : ''}
            </div>
        </div>
    </div>
    
    <h2>1. Resumen de Estudios</h2>
    <table>
        <thead><tr><th>Estudio</th><th>${effectLabel}</th><th>95% CI</th><th>Peso (%)</th></tr></thead>
        <tbody>`;

        labels.forEach((label, i) => {
            const w = (pooled.weights[i] * 100).toFixed(2);
            const ciLo = yi[i] - 1.96 * sei[i];
            const ciHi = yi[i] + 1.96 * sei[i];
            html += `<tr>
                <td style="font-weight: 500;">${label}</td>
                <td>${transform(yi[i]).toFixed(3)}</td>
                <td>[${transform(ciLo).toFixed(3)}, ${transform(ciHi).toFixed(3)}]</td>
                <td>${w}%</td>
            </tr>`;
        });

        html += `</tbody></table>
        
    <h2 style="page-break-before: always;">2. Sesgo de Publicación</h2>
    <table>
        <tbody>
            <tr><td style="font-weight:600; width: 30%;">Prueba de Egger (Asimetría)</td><td>t = ${egger.t?.toFixed(3) || 'N/A'}, p = ${egger.p?.toFixed(4) || 'N/A'}</td></tr>
            <tr><td style="font-weight:600;">Prueba de Begg (Correlación)</td><td>τ = ${begg.tau?.toFixed(3) || 'N/A'}, p = ${begg.p?.toFixed(4) || 'N/A'}</td></tr>
            <tr><td style="font-weight:600;">Trim-and-Fill</td><td>${results.trimfill.k0} estudios imputados</td></tr>
            <tr><td style="font-weight:600;">Fail-Safe N (Rosenthal)</td><td>${results.fsn.fsn} estudios necesarios para p>0.05</td></tr>
        </tbody>
    </table>
    
    <div style="page-break-before: always;"></div>
    <h2>3. Gráficos Analíticos</h2>
    <p style="color: #666; font-size: 0.9em;">Los siguientes gráficos ilustran la estructura del tamaño de efecto, sesgos e influencia diagnostica del bloque analítico. Generados desde MetaAnalysis Pro.</p>
    `;

        // SVGs to B64
        const charts = [
            { id: '#forest-plot-container', title: 'A. Forest Plot' },
            { id: '#funnel-plot-container', title: 'B. Funnel Plot (Contour Enhanced)' },
            { id: '#baujat-plot-container', title: 'C. Baujat Plot (Diagnóstico de Influencia)' },
            { id: '#loo-plot-container', title: 'D. Leave-One-Out (Análisis de Sensibilidad)' },
            { id: '#galbraith-plot-container', title: 'E. Galbraith Plot (Radial)' }
        ];

        if (results.regressionResults) {
            charts.push({ id: '#bubble-plot-container', title: 'F. Meta-Regresión Continua (Bubble Plot)' });
        }

        const serializer = new XMLSerializer();

        charts.forEach(c => {
            const el = document.querySelector(c.id + ' svg');
            if (el) {
                const svgStr = serializer.serializeToString(el);
                // Draw onto an offscreen canvas to convert to PNG (since pure SVG might break in some PDF engines due to colors and css variables)
                // Actually, our SVGs are self-contained with dark-mode colors. The user requested A4 print, white background might be preferable, but our SVGs have hardcoded dark theme. 
                // We will append the SVGs pure code, it works better in native print.
                const b64 = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgStr)));
                html += `<div class="chart-Container">
                    <h3 style="font-size: 16px; margin-bottom: 10px;">${c.title}</h3>
                    <img class="chart-img" src="${b64}" />
                </div>`;
            }
        });

        html += `
        <div style="margin-top: 50px; text-align: center; color: #888; font-size: 0.8em; border-top: 1px solid #eaebec; padding-top: 20px;">
            Generado automáticamente por MetaAnalysis Pro.
        </div>
</body>
</html>`;

        reportWin.document.open();
        reportWin.document.write(html);
        reportWin.document.close();

        // Slight delay to allow images to load their b64 src
        setTimeout(() => {
            reportWin.print();
        }, 500);
    }

    function showToast(message, type = 'success') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    return {
        exportSvgToPng,
        exportInputData,
        exportResults,
        generateFullReport,
        downloadText,
        showToast
    };
})();
