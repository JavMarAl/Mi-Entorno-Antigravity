/**
 * MetaAnalysis Pro — Risk of Bias 2 (RoB 2) Module
 *
 * Implements the Cochrane RoB 2 tool with 5 domains per study.
 * State is stored in-memory and keyed by study label.
 */

const RobModule = (() => {
    'use strict';

    // ─── RoB 2 Domain Definitions ─────────────────────────────────────────────
    const DOMAINS = [
        { key: 'd1', short: 'D1', label: 'Aleatorización', tooltip: 'Sesgo por el proceso de aleatorización' },
        { key: 'd2', short: 'D2', label: 'Desviaciones', tooltip: 'Sesgo por desviaciones de las intervenciones previstas' },
        { key: 'd3', short: 'D3', label: 'Datos faltantes', tooltip: 'Sesgo por datos de resultados faltantes' },
        { key: 'd4', short: 'D4', label: 'Medición', tooltip: 'Sesgo en la medición del resultado' },
        { key: 'd5', short: 'D5', label: 'Selección', tooltip: 'Sesgo en la selección del resultado reportado' },
    ];

    const JUDGEMENTS = [
        { value: 'low', label: 'Bajo', icon: '🟢' },
        { value: 'some', label: 'Preocupante', icon: '🟡' },
        { value: 'high', label: 'Alto', icon: '🔴' },
        { value: 'ni', label: 'Sin información', icon: '⚪' },
    ];

    // In-memory store: { studyLabel: { d1: 'low', d2: 'some', ... } }
    let robState = {};

    // ─── State Management ─────────────────────────────────────────────────────
    function getStudyRob(label) {
        if (!robState[label]) {
            robState[label] = { d1: 'ni', d2: 'ni', d3: 'ni', d4: 'ni', d5: 'ni' };
        }
        return robState[label];
    }

    function setDomain(label, domain, value) {
        if (!robState[label]) robState[label] = {};
        robState[label][domain] = value;
        renderTable();
    }

    function getOverall(label) {
        const rob = getStudyRob(label);
        const vals = Object.values(rob);
        if (vals.includes('high')) return 'high';
        if (vals.includes('some')) return 'some';
        if (vals.every(v => v === 'ni')) return 'ni';
        return 'low';
    }

    function syncStudies(labels) {
        // Add new studies with default 'ni', keep existing state
        labels.forEach(l => { if (!robState[l]) robState[l] = { d1: 'ni', d2: 'ni', d3: 'ni', d4: 'ni', d5: 'ni' }; });
        // Remove studies no longer in the list
        const labelsSet = new Set(labels);
        Object.keys(robState).forEach(k => { if (!labelsSet.has(k)) delete robState[k]; });
    }

    function getAllRobData() {
        return { ...robState };
    }

    // ─── Rendering ────────────────────────────────────────────────────────────
    function renderTable() {
        const container = document.getElementById('rob-table-container');
        if (!container) return;

        const labels = Object.keys(robState);
        if (labels.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
                        <path d="M9 11H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-4"/>
                        <polyline points="7 11 12 6 17 11"/><line x1="12" y1="6" x2="12" y2="14"/>
                    </svg>
                    <p>Carga datos de estudios en la pestaña <strong>Entrada de Datos</strong> y luego ejecuta un análisis para ver la tabla RoB 2.</p>
                </div>`;
            return;
        }

        let html = `
        <div class="rob-legend">
            ${JUDGEMENTS.map(j => `<span class="rob-legend-item"><span class="rob-dot rob-${j.value}"></span>${j.label}</span>`).join('')}
        </div>
        <div class="rob-table-wrapper">
        <table class="rob-table">
            <thead>
                <tr>
                    <th class="rob-th-study">Estudio</th>
                    ${DOMAINS.map(d => `<th class="rob-th-domain" title="${d.tooltip}">${d.short}<span class="rob-domain-label">${d.label}</span></th>`).join('')}
                    <th class="rob-th-overall">Global</th>
                </tr>
            </thead>
            <tbody>`;

        labels.forEach(label => {
            const rob = getStudyRob(label);
            const overall = getOverall(label);
            html += `<tr class="rob-row">
                <td class="rob-study-name">${label}</td>
                ${DOMAINS.map(d => `
                    <td class="rob-cell">
                        <select class="rob-select rob-${rob[d.key]}" 
                                data-study="${label.replace(/"/g, '&quot;')}" 
                                data-domain="${d.key}"
                                title="${d.tooltip}">
                            ${JUDGEMENTS.map(j => `<option value="${j.value}" ${rob[d.key] === j.value ? 'selected' : ''}>${j.icon} ${j.label}</option>`).join('')}
                        </select>
                    </td>`).join('')}
                <td class="rob-cell rob-overall-cell">
                    <span class="rob-overall-badge rob-${overall}">
                        ${JUDGEMENTS.find(j => j.value === overall)?.icon} ${JUDGEMENTS.find(j => j.value === overall)?.label}
                    </span>
                </td>
            </tr>`;
        });

        html += `</tbody></table></div>`;

        container.innerHTML = html;

        // Render summary cards in the separate container (new layout)
        const summaryContainer = document.getElementById('rob-summary-container');
        if (summaryContainer) {
            const counts = { low: 0, some: 0, high: 0, ni: 0 };
            labels.forEach(l => counts[getOverall(l)]++);
            const total = labels.length;
            summaryContainer.innerHTML = `
            <div class="rob-summary-grid">
                <div class="rob-summary-card rob-card-low">
                    <div class="rob-summary-icon">🟢</div>
                    <div class="rob-summary-num">${counts.low}</div>
                    <div class="rob-summary-label">Bajo Riesgo</div>
                    <div class="rob-summary-pct">${total > 0 ? Math.round(counts.low / total * 100) : 0}%</div>
                </div>
                <div class="rob-summary-card rob-card-some">
                    <div class="rob-summary-icon">🟡</div>
                    <div class="rob-summary-num">${counts.some}</div>
                    <div class="rob-summary-label">Algunas Preocupaciones</div>
                    <div class="rob-summary-pct">${total > 0 ? Math.round(counts.some / total * 100) : 0}%</div>
                </div>
                <div class="rob-summary-card rob-card-high">
                    <div class="rob-summary-icon">🔴</div>
                    <div class="rob-summary-num">${counts.high}</div>
                    <div class="rob-summary-label">Alto Riesgo</div>
                    <div class="rob-summary-pct">${total > 0 ? Math.round(counts.high / total * 100) : 0}%</div>
                </div>
            </div>`;
        }

        // Bind change events
        container.querySelectorAll('.rob-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const study = e.target.dataset.study;
                const domain = e.target.dataset.domain;
                setDomain(study, domain, e.target.value);
                // Update select color class
                e.target.className = `rob-select rob-${e.target.value}`;
            });
        });

        // Bind export — now wired via the static btn in the HTML panel + the inline one
        document.querySelectorAll('#btn-export-rob').forEach(btn => btn.addEventListener('click', exportRobPng));
    }

    // ─── Export as PNG ────────────────────────────────────────────────────────
    function exportRobPng() {
        const table = document.querySelector('.rob-table');
        if (!table) return;

        // Use html2canvas-like approach with SVG serialization
        const wrapper = document.querySelector('.rob-table-wrapper');
        if (!wrapper) return;

        const wrapClone = wrapper.cloneNode(true);
        wrapClone.style.cssText = 'background:white; padding:16px; border-radius:0;';

        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${wrapper.scrollWidth + 32}" height="${wrapper.scrollHeight + 32}">
            <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, sans-serif; font-size: 13px; padding:16px; background:white;">
                    ${wrapClone.outerHTML}
                </div>
            </foreignObject>
        </svg>`;

        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rob2_table.svg';
        a.click();
        URL.revokeObjectURL(url);

        if (typeof ExportModule !== 'undefined') {
            ExportModule.showToast('Tabla RoB 2 exportada como SVG', 'success');
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────
    return {
        syncStudies,
        renderTable,
        getOverall,
        getAllRobData,
        DOMAINS,
        JUDGEMENTS,
    };
})();
