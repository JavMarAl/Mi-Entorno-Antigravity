/**
 * MetaAnalysis Pro — PICO Highlighter Module
 *
 * Highlights population, intervention, comparison, and outcome elements
 * in a pasted abstract using keyword matching.
 */

const PicoModule = (() => {
    'use strict';

    // ─── Keyword Dictionaries ─────────────────────────────────────────────────
    const KEYWORDS = {
        P: [
            'patients', 'patient', 'adults', 'children', 'participants', 'subjects',
            'population', 'individuals', 'sample', 'cohort', 'group', 'men', 'women',
            'elderly', 'aged', 'pediatric', 'neonates', 'infants', 'adolescents',
            'pacientes', 'adultos', 'niños', 'personas', 'participantes', 'individuos',
            'muestra', 'cohorte', 'grupo', 'población', 'hombres', 'mujeres', 'mayores',
            'diagnosed', 'diagnosis', 'diagnosis with', 'suffering from', 'with a history',
            'with diagnosis', 'diagnosed with', 'confirmados', 'diagnosticados', 'suffering',
        ],
        I: [
            'treatment', 'intervention', 'therapy', 'drug', 'medication', 'surgery',
            'procedure', 'dose', 'mg', 'administered', 'received', 'underwent', 'arm',
            'experimental', 'protocol', 'regimen', 'vaccine', 'supplement', 'exercise',
            'tratamiento', 'intervención', 'terapia', 'fármaco', 'medicamento', 'cirugía',
            'procedimiento', 'dosis', 'administrado', 'recibió', 'experimental', 'protocolo',
            'randomized', 'assigned', 'allocated', 'randomizado', 'asignado',
        ],
        C: [
            'control', 'placebo', 'comparison', 'compared', 'versus', 'vs', 'alternative',
            'sham', 'standard care', 'usual care', 'conventional', 'reference',
            'control group', 'comparator', 'contrasted', 'benchmark',
            'control', 'placebo', 'comparación', 'comparado', 'frente a',
            'cuidado habitual', 'cuidado estándar', 'convencional', 'referencia',
            'grupo control', 'comparador',
        ],
        O: [
            'outcome', 'outcomes', 'endpoint', 'endpoints', 'result', 'results',
            'mortality', 'survival', 'recurrence', 'response', 'remission', 'improvement',
            'reduction', 'increase', 'rate', 'score', 'risk', 'odds', 'hazard', 'incidence',
            'prevalence', 'quality of life', 'adverse events', 'side effects',
            'resultado', 'resultados', 'desenlace', 'mortalidad', 'supervivencia',
            'recurrencia', 'respuesta', 'remisión', 'mejora', 'reducción', 'aumento',
            'tasa', 'puntuación', 'riesgo', 'incidencia', 'prevalencia', 'calidad de vida',
            'efectos adversos', 'efectos secundarios', 'primary outcome', 'secondary outcome',
        ],
    };

    // Sort keywords by length descending to match longest first
    Object.keys(KEYWORDS).forEach(k => {
        KEYWORDS[k].sort((a, b) => b.length - a.length);
    });

    function highlight(text) {
        if (!text) return '';

        // Escape HTML first
        let safe = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // We'll build a list of spans to apply
        const marks = []; // { start, end, cat }

        ['P', 'I', 'C', 'O'].forEach(cat => {
            KEYWORDS[cat].forEach(kw => {
                const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
                let match;
                while ((match = regex.exec(safe)) !== null) {
                    // Check not overlapping
                    const s = match.index, e = match.index + match[0].length;
                    const overlaps = marks.some(m => s < m.end && e > m.start);
                    if (!overlaps) marks.push({ start: s, end: e, cat, text: match[0] });
                }
            });
        });

        // Sort by start position
        marks.sort((a, b) => a.start - b.start);

        // Apply marks in reverse order so indices stay valid
        marks.sort((a, b) => b.start - a.start);
        marks.forEach(({ start, end, cat, text: matchText }) => {
            safe = safe.slice(0, start)
                + `<mark class="pico-${cat}" title="${cat}: ${getCatLabel(cat)}">${matchText}</mark>`
                + safe.slice(end);
        });

        return safe;
    }

    function getCatLabel(cat) {
        const labels = { P: 'Población', I: 'Intervención', C: 'Comparación', O: 'Resultado' };
        return labels[cat] || cat;
    }

    // ─── Modal Rendering ──────────────────────────────────────────────────────
    function openModal() {
        const modal = document.getElementById('modal-pico');
        if (modal) modal.style.display = 'flex';
        const input = document.getElementById('pico-input');
        const output = document.getElementById('pico-output');
        if (input) { input.value = ''; }
        if (output) { output.innerHTML = '<p style="color:var(--text-tertiary);font-style:italic;">El texto resaltado aparecerá aquí...</p>'; }
    }

    function closeModal() {
        const modal = document.getElementById('modal-pico');
        if (modal) modal.style.display = 'none';
    }

    function processInput() {
        const input = document.getElementById('pico-input');
        const output = document.getElementById('pico-output');
        if (!input || !output) return;
        const raw = input.value.trim();
        if (!raw) { output.innerHTML = '<p style="color:var(--text-tertiary);">Pega un abstract en el campo de la izquierda.</p>'; return; }
        output.innerHTML = highlight(raw);
    }

    function copyHighlighted() {
        const output = document.getElementById('pico-output');
        if (!output) return;
        const text = output.innerText;
        navigator.clipboard.writeText(text).then(() => {
            if (typeof ExportModule !== 'undefined') ExportModule.showToast('Texto copiado al portapapeles', 'success');
        });
    }

    return { openModal, closeModal, processInput, copyHighlighted, highlight };
})();
