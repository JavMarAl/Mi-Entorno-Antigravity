/**
 * MetaAnalysis Pro — R Bridge Module
 *
 * Client-side module that communicates with the Node.js backend
 * to run R-powered analyses. Falls back gracefully if the server
 * is not running.
 *
 * Exposes: RBridge.analyze(payload), RBridge.exportCode(payload)
 */

const RBridge = (() => {
    const BASE_URL = 'http://localhost:4000';
    let rAvailable = null;  // null = unknown, true/false after check

    // ── Status check ──────────────────────────────────────
    async function checkServer() {
        try {
            const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
            const data = await res.json();
            rAvailable = data.r_available;
            return data;
        } catch {
            rAvailable = false;
            return null;
        }
    }

    // ── Update status indicator in UI ─────────────────────
    function updateStatusBadge(status) {
        const badge = document.getElementById('r-engine-badge');
        if (!badge) return;
        if (status === 'ok') {
            badge.innerHTML = '⚗️ R Engine <span class="r-badge r-badge-ok">Activo</span>';
        } else if (status === 'degraded') {
            badge.innerHTML = '⚗️ R Engine <span class="r-badge r-badge-warn">Sin servidor</span>';
        } else {
            badge.innerHTML = '⚗️ R Engine <span class="r-badge r-badge-off">No disponible</span>';
        }
    }

    // ── Build payload from current StatsEngine results ───
    function buildPayload(results) {
        const { yi, vi, labels, model, analysisType, effectMeasure } = results;

        // Detect if binary (log scale) for Peters' test
        const is_log = analysisType === 'binary';

        // Collect subgroups if defined
        const tbody = document.getElementById('table-body');
        const subgroups = [];
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(row => {
                const sg = row.querySelector('[data-field="subgroup"]');
                subgroups.push(sg ? sg.value.trim() : '');
            });
        }

        return { yi, vi, labels, model, analysisType, effectMeasure, is_log, subgroups };
    }

    // ── Full R Analysis ───────────────────────────────────
    async function analyze(results) {
        const payload = buildPayload(results);
        const res = await fetch(`${BASE_URL}/api/r/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error en el servidor R');
        }
        return res.json();
    }

    // ── Meta-regression ───────────────────────────────────
    async function metaregression(results, moderators) {
        const base = buildPayload(results);
        const payload = { ...base, moderators };
        const res = await fetch(`${BASE_URL}/api/r/metaregression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error en meta-regresión R');
        return res.json();
    }

    // ── Export R code ─────────────────────────────────────
    async function exportCode(results, title = 'Mi Meta-análisis') {
        const payload = { ...buildPayload(results), title };
        const res = await fetch(`${BASE_URL}/api/r/export-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error generando código R');
        const data = await res.json();
        return data.code;
    }

    // ── Download helper ───────────────────────────────────
    function downloadRScript(code, filename = 'metaanalysis.R') {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── Initialize (call on page load) ───────────────────
    async function init() {
        const health = await checkServer();
        if (health && health.r_available) {
            updateStatusBadge('ok');
            return true;
        } else if (health) {
            updateStatusBadge('degraded');  // server running but R not found
        } else {
            updateStatusBadge('off');       // server not running
        }
        return false;
    }

    return { init, checkServer, analyze, metaregression, exportCode, downloadRScript, updateStatusBadge };
})();
