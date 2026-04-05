/**
 * MetaAnalysis Pro — PRISMA Diagram Module
 *
 * Generates an interactive SVG PRISMA 2020 flow diagram.
 * The number of included studies is auto-filled from the active analysis.
 */

const PrismaModule = (() => {
    'use strict';

    // Default values
    let state = {
        identified: 0,
        databases: 0,
        registers: 0,
        duplicates: 0,
        otherReasons: 0,
        screened: 0,
        screenExcluded: 0,
        fullTextSought: 0,
        fullTextNotRetv: 0,
        fullTextAssessed: 0,
        fullTextExcluded: 0,
        excludedReasons: '',
        newStudies: 0,
        newReports: 0,
        included: 0,
    };

    function setState(key, value) {
        state[key] = isNaN(parseInt(value)) ? value : parseInt(value);
        renderDiagram();
    }

    function setIncluded(k) {
        state.included = k;
        const el = document.getElementById('prisma-included');
        if (el) el.value = k;
        // Auto-cascade sensible defaults
        if (state.screened === 0) state.screened = k;
        if (state.fullTextAssessed === 0) state.fullTextAssessed = k;
        if (state.identified === 0) state.identified = k;
        renderDiagram();
    }

    // ─── SVG Generation ───────────────────────────────────────────────────────
    function buildSvg() {
        const s = state;
        const W = 710, H = 760;
        const bw = 220, bh = 52, rx = 8;
        const lx = 30, cx = 230, rx2 = 430;
        const gap = 108;
        let y = 40;

        function box(x, bY, w, h, label, sub, color = '#e8f4fd', stroke = '#0ea5e9') {
            return `
            <g>
                <rect x="${x}" y="${bY}" width="${w}" height="${h}" rx="${rx}" 
                      fill="${color}" stroke="${stroke}" stroke-width="1.5"/>
                <text x="${x + w / 2}" y="${bY + h / 2 - (sub ? 8 : 0)}" 
                      text-anchor="middle" font-size="11.5" font-weight="600" fill="#0f172a">${label}</text>
                ${sub ? `<text x="${x + w / 2}" y="${bY + h / 2 + 12}" text-anchor="middle" font-size="10" fill="#475569">${sub}</text>` : ''}
            </g>`;
        }

        function arrow(x1, y1, x2, y2) {
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                          stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arrowhead)"/>`;
        }

        function sidebox(bY, label, sub) {
            return box(rx2, bY, bw, bh, label, sub, '#fff7ed', '#f59e0b');
        }

        let svgParts = [`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="auto" style="max-width: ${W}px;" font-family="Inter, system-ui, sans-serif">
        <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8"/>
            </marker>
        </defs>
        <!-- Background -->
        <rect width="${W}" height="${H}" fill="#f8fafc" rx="12"/>
        <!-- Title -->
        <text x="${W / 2}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">Diagrama de Flujo PRISMA 2020</text>
        `];

        // Row 1 – Identification
        let y1 = 40;
        svgParts.push(`<text x="${cx + bw / 2}" y="${y1 - 6}" text-anchor="middle" font-size="10" fill="#64748b" font-style="italic">IDENTIFICACIÓN</text>`);
        svgParts.push(box(cx, y1, bw, bh, `Registros identificados`, `n = ${s.identified}`, '#dbeafe', '#3b82f6'));

        // Side: databases
        svgParts.push(sidebox(y1, 'Bases de datos', `n = ${s.databases}`));
        svgParts.push(arrow(cx + bw, y1 + bh / 2, rx2, y1 + bh / 2));

        y1 += gap;
        svgParts.push(box(cx, y1, bw, bh, 'Duplicados eliminados', `n = ${s.duplicates}`, '#fef9c3', '#ca8a04'));
        svgParts.push(arrow(cx + bw / 2, y1 - (gap - bh), cx + bw / 2, y1));

        // Row 2 – Screening
        let y2 = y1 + gap;
        svgParts.push(`<text x="${cx + bw / 2}" y="${y2 - 6}" text-anchor="middle" font-size="10" fill="#64748b" font-style="italic">CRIBADO</text>`);
        svgParts.push(box(cx, y2, bw, bh, 'Registros cribados', `n = ${s.screened}`, '#dcfce7', '#16a34a'));
        svgParts.push(arrow(cx + bw / 2, y2 - (gap - bh), cx + bw / 2, y2));

        svgParts.push(sidebox(y2, 'Excluidos en cribado', `n = ${s.screenExcluded}`));
        svgParts.push(arrow(cx + bw, y2 + bh / 2, rx2, y2 + bh / 2));

        // Row 3 – Full text
        let y3 = y2 + gap;
        svgParts.push(box(cx, y3, bw, bh, 'Texto completo evaluado', `n = ${s.fullTextAssessed}`, '#dcfce7', '#16a34a'));
        svgParts.push(arrow(cx + bw / 2, y3 - (gap - bh), cx + bw / 2, y3));

        svgParts.push(sidebox(y3, 'Excluidos (texto completo)', `n = ${s.fullTextExcluded}`));
        svgParts.push(arrow(cx + bw, y3 + bh / 2, rx2, y3 + bh / 2));

        // Row 4 - Included
        let y4 = y3 + gap;
        svgParts.push(`<text x="${cx + bw / 2}" y="${y4 - 6}" text-anchor="middle" font-size="10" fill="#64748b" font-style="italic">INCLUIDOS</text>`);
        svgParts.push(box(cx, y4, bw, bh + 10, 'Estudios incluidos', `n = ${s.included}`, '#faf5ff', '#7c3aed'));
        svgParts.push(arrow(cx + bw / 2, y4 - (gap - bh), cx + bw / 2, y4));

        svgParts.push(`</svg>`);
        return svgParts.join('\n');
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    function renderDiagram() {
        const svgContainer = document.getElementById('prisma-svg-container');
        if (!svgContainer) return;
        svgContainer.innerHTML = buildSvg();
    }

    function renderControls() {
        const panel = document.getElementById('prisma-controls');
        if (!panel) return;

        const fields = [
            { key: 'identified', label: 'Registros identificados' },
            { key: 'databases', label: '↳ De bases de datos' },
            { key: 'duplicates', label: 'Duplicados eliminados' },
            { key: 'screened', label: 'Registros cribados' },
            { key: 'screenExcluded', label: 'Excluidos en cribado' },
            { key: 'fullTextAssessed', label: 'Texto completo evaluado' },
            { key: 'fullTextExcluded', label: 'Excluidos (texto completo)' },
            { key: 'included', label: 'Estudios incluidos', id: 'prisma-included' },
        ];

        panel.innerHTML = `
        <div class="prisma-controls-grid">
            ${fields.map(f => `
            <div class="prisma-field">
                <label class="prisma-field-label">${f.label}</label>
                <input type="number" class="prisma-input" 
                       id="${f.id || ('prisma-' + f.key)}"
                       value="${state[f.key]}" min="0"
                       data-key="${f.key}">
            </div>`).join('')}
        </div>
        <button class="btn btn-outline btn-sm" id="btn-export-prisma" style="margin-top:1rem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar PRISMA (SVG)
        </button>`;

        panel.querySelectorAll('.prisma-input').forEach(input => {
            input.addEventListener('input', e => setState(e.target.dataset.key, e.target.value));
        });

        document.getElementById('btn-export-prisma')?.addEventListener('click', exportSvg);
    }

    function exportSvg() {
        const svg = buildSvg();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prisma_diagram.svg';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof ExportModule !== 'undefined') ExportModule.showToast('Diagrama PRISMA exportado', 'success');
    }

    function init() {
        renderControls();
        renderDiagram();
    }

    return { init, setIncluded, renderDiagram, renderControls };
})();
