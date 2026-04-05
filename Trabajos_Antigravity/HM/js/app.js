/**
 * MetaAnalysis Pro — Main Application Controller
 * 
 * Manages navigation, state, user interactions, and connects
 * all modules (DataEntry, StatsEngine, Charts, ExportModule).
 */

(function () {
    'use strict';

    // ===== STATE =====
    let currentResults = null;
    let excludedStudies = new Set(); // F2: studies toggled off in results table
    let calcLastResult = null;       // F5: last ES calc output

    // ===== NAVIGATION =====
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        navTabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));

        const btn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
        const content = document.getElementById(`tab-${tabId}`);
        if (btn) btn.classList.add('active');
        if (content) content.classList.add('active');
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // ===== ANALYSIS TYPE CHANGE =====
    const analysisTypeSelect = document.getElementById('analysis-type');
    const effectMeasureSelect = document.getElementById('effect-measure');
    const thead = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');

    function onAnalysisTypeChange() {
        const type = analysisTypeSelect.value;
        DataEntry.setType(type);

        // Update effect measure options
        const measures = DataEntry.getEffectMeasures(type);
        effectMeasureSelect.innerHTML = '';
        measures.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.value;
            opt.textContent = m.label;
            effectMeasureSelect.appendChild(opt);
        });

        // Rebuild table
        DataEntry.renderHeaders(thead, type);
        tbody.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            DataEntry.createRow(tbody, {}, i);
        }
        DataEntry.updateQuickStats();
        clearResults();
    }

    analysisTypeSelect.addEventListener('change', onAnalysisTypeChange);

    // ===== INITIALIZE TABLE =====
    function initTable() {
        const type = analysisTypeSelect.value;
        DataEntry.setType(type);
        DataEntry.renderHeaders(thead, type);

        // Start with 3 empty rows
        for (let i = 0; i < 3; i++) {
            DataEntry.createRow(tbody, {}, i);
        }
        DataEntry.updateQuickStats();
    }

    // ===== ADD ROW =====
    document.getElementById('btn-add-row').addEventListener('click', () => {
        const rows = tbody.querySelectorAll('tr');
        DataEntry.createRow(tbody, {}, rows.length);
    });

    // ===== CLEAR ALL =====
    document.getElementById('btn-clear-all').addEventListener('click', () => {
        if (confirm('¿Eliminar todos los datos?')) {
            tbody.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                DataEntry.createRow(tbody, {}, i);
            }
            DataEntry.updateQuickStats();
            clearResults();
        }
    });

    // ===== LOAD EXAMPLE =====
    document.getElementById('btn-load-example').addEventListener('click', () => {
        const type = analysisTypeSelect.value;
        const examples = DataEntry.getExampleData(type);
        DataEntry.loadData(tbody, examples);
        ExportModule.showToast(`${examples.length} estudios de ejemplo cargados`, 'success');
    });

    // ===== CSV IMPORT =====
    const csvInput = document.getElementById('csv-file-input');
    document.getElementById('btn-import-csv').addEventListener('click', () => csvInput.click());

    csvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const studies = DataEntry.parseCSV(evt.target.result, true);
            if (studies.length > 0) {
                DataEntry.loadData(tbody, studies);
                ExportModule.showToast(`${studies.length} estudios importados desde CSV`, 'success');
            } else {
                ExportModule.showToast('No se pudieron leer datos del archivo', 'error');
            }
        };
        reader.readAsText(file);
        csvInput.value = '';
    });

    // ===== PASTE DATA =====
    document.getElementById('btn-paste-data').addEventListener('click', () => {
        document.getElementById('modal-paste').style.display = 'flex';
        document.getElementById('paste-textarea').value = '';
        document.getElementById('paste-textarea').focus();
    });

    document.getElementById('btn-paste-confirm').addEventListener('click', () => {
        const text = document.getElementById('paste-textarea').value;
        const hasHeader = document.getElementById('paste-has-header').checked;
        const studies = DataEntry.parseCSV(text, hasHeader);
        if (studies.length > 0) {
            DataEntry.loadData(tbody, studies);
            ExportModule.showToast(`${studies.length} estudios pegados`, 'success');
        } else {
            ExportModule.showToast('No se pudieron leer datos', 'error');
        }
        document.getElementById('modal-paste').style.display = 'none';
    });

    // Modal close handlers
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.close;
            document.getElementById(modalId).style.display = 'none';
        });
    });

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.style.display = 'none';
        });
    });

    // ===== RUN ANALYSIS =====
    document.getElementById('btn-run-analysis').addEventListener('click', runAnalysis);

    function runAnalysis() {
        const studies = DataEntry.getStudies(tbody);
        const type = analysisTypeSelect.value;
        const effectMeasure = effectMeasureSelect.value;
        const model = document.querySelector('input[name="model"]:checked').value;

        // Validate
        const errors = DataEntry.validate(studies, type);
        if (errors.length > 0) {
            ExportModule.showToast(errors[0], 'error');
            return;
        }

        // Set status
        setStatus('Calculando...', true);

        // Run computation (async-like with setTimeout to allow UI update)
        setTimeout(() => {
            try {
                currentResults = StatsEngine.computeAll(studies, type, effectMeasure, model);
                excludedStudies.clear(); // reset filter on new analysis

                // Render all results
                renderResults(currentResults);
                renderHeterogeneity(currentResults);
                renderSensitivity(currentResults);

                // F6: heterogeneity alert
                renderHeterogeneityAlert(currentResults);

                // F1: sync RoB 2 with study labels
                RobModule.syncStudies(currentResults.labels);
                RobModule.renderTable();

                // F3: update PRISMA included count
                PrismaModule.setIncluded(currentResults.labels.length);

                // Switch to results tab
                switchTab('results');
                setStatus('An\u00e1lisis completo', false);
                ExportModule.showToast('An\u00e1lisis completado correctamente', 'success');
            } catch (err) {
                console.error('Analysis error:', err);
                ExportModule.showToast('Error en el c\u00e1lculo: ' + err.message, 'error');
                setStatus('Error', false);
            }
        }, 50);
    }

    function setStatus(text, processing = false) {
        const indicator = document.getElementById('status-indicator');
        indicator.querySelector('.status-text').textContent = text;
        indicator.classList.toggle('processing', processing);
    }

    function clearResults() {
        currentResults = null;
        // Clear all result panels
        ['forest-plot-container', 'funnel-plot-container', 'baujat-plot-container', 'loo-plot-container', 'galbraith-plot-container', 'bubble-plot-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="empty-state"><p>Ejecuta un análisis primero</p></div>';
        });
        ['model-summary', 'heterogeneity-summary', 'results-table-container', 'bias-tests-container', 'het-stats-detail', 'influence-table-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="empty-state-sm"><p>Sin datos</p></div>';
        });
    }

    // ===== RENDER RESULTS TAB =====
    function renderResults(results) {
        const { pooled, yi, sei, labels, analysisType, effectMeasure } = results;
        const isLog = analysisType === 'binary';
        const transform = isLog ? Math.exp : (v) => v;
        const effectLabel = StatsEngine.getEffectLabel(analysisType, effectMeasure);

        // Forest plot
        Charts.forestPlot(document.getElementById('forest-plot-container'), results);

        // Model summary
        const summary = document.getElementById('model-summary');
        const pClass = pooled.p < 0.05 ? 'significant' : 'not-significant';
        summary.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="label">${effectLabel} Global</div>
                    <div class="value ${pClass}">${fmt(transform(pooled.theta))}</div>
                    <div class="ci">[${fmt(transform(pooled.ci[0]))}, ${fmt(transform(pooled.ci[1]))}]</div>
                </div>
                <div class="summary-item">
                    <div class="label">p-valor</div>
                    <div class="value ${pClass}">${pooled.p < 0.001 ? '< 0.001' : fmt(pooled.p, 4)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Z</div>
                    <div class="value">${fmt(pooled.z)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">SE</div>
                    <div class="value">${fmt(pooled.se, 4)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Modelo</div>
                    <div class="value" style="font-size:0.75rem">${pooled.model === 'random' ? 'Efectos Aleatorios' : 'Efectos Fijos'}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Estudios (k)</div>
                    <div class="value">${pooled.k}</div>
                </div>
            </div>
            ${pooled.ciBootstrap ? `
            <div class="summary-grid" style="margin-top: 1rem; border-top: 1px dashed var(--border-light); padding-top: 0.8rem;">
                <div class="summary-item" style="grid-column: span 2;">
                    <div class="label" style="color: var(--warning);">95% [BOOTSTRAP CI]</div>
                    <div class="ci" style="font-size: 0.95em;">[${fmt(transform(pooled.ciBootstrap[0]))}, ${fmt(transform(pooled.ciBootstrap[1]))}]</div>
                    <div class="label" style="font-size: 0.65em; margin-top: 2px;">Remuestreo Empírico (1000 iteraciones)</div>
                </div>
            </div>` : ''}
        `;

        // Heterogeneity summary
        const hetSummary = document.getElementById('heterogeneity-summary');
        const i2 = pooled.I2 !== undefined ? pooled.I2 : 0;
        const i2Class = i2 < 25 ? 'het-low' : i2 < 75 ? 'het-moderate' : 'het-high';
        const i2Label = i2 < 25 ? 'Baja' : i2 < 50 ? 'Moderada' : i2 < 75 ? 'Sustancial' : 'Considerable';

        hetSummary.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item summary-item-full">
                    <div class="label">I² (Heterogeneidad)</div>
                    <div class="value">${fmt(i2, 1)}%</div>
                    <div class="het-bar"><div class="het-bar-fill ${i2Class}" style="width:${Math.min(100, i2)}%"></div></div>
                    <div class="ci" style="margin-top:4px">${i2Label}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Q</div>
                    <div class="value">${fmt(pooled.Q)}</div>
                    <div class="ci">p = ${pooled.pQ < 0.001 ? '< 0.001' : fmt(pooled.pQ, 4)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">τ²</div>
                    <div class="value">${fmt(pooled.tau2 || 0, 4)}</div>
                </div>
            </div>
        `;

        // Results table — with checkboxes for F2 interactive filtering
        const tableContainer = document.getElementById('results-table-container');
        let tableHTML = `<table class="results-data-table">
            <thead><tr>
                <th style="width:32px;" title="Incluir en el c\u00e1lculo">✓</th>
                <th>Estudio</th><th>${effectLabel}</th><th>SE</th><th>95% CI</th><th>Peso %</th>
            </tr></thead><tbody>`;

        labels.forEach((label, i) => {
            const ciLo = yi[i] - 1.96 * sei[i];
            const ciHi = yi[i] + 1.96 * sei[i];
            const w = (pooled.weights[i] * 100).toFixed(1);
            const checked = excludedStudies.has(i) ? '' : 'checked';
            tableHTML += `<tr class="${excludedStudies.has(i) ? 'study-excluded' : ''} study-row" data-idx="${i}">
                <td><input type="checkbox" class="study-toggle" data-idx="${i}" ${checked} title="Desmarcar excluye este estudio del c\u00e1lculo"></td>
                <td>${label}</td>
                <td>${fmt(transform(yi[i]))}</td>
                <td>${fmt(sei[i], 4)}</td>
                <td>[${fmt(transform(ciLo))}, ${fmt(transform(ciHi))}]</td>
                <td>${w}%</td>
            </tr>`;
        });

        tableHTML += `</tbody></table>
            <p style="font-size:0.72rem;color:var(--text-tertiary);margin-top:6px;">
                ✓ Desmarca estudios para excluirlos del c\u00e1lculo en tiempo real
            </p>`;
        tableContainer.innerHTML = tableHTML;

        // F2: bind checkboxes
        tableContainer.querySelectorAll('.study-toggle').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                if (e.target.checked) {
                    excludedStudies.delete(idx);
                } else {
                    excludedStudies.add(idx);
                }
                recalculateFiltered();
            });
        });
    }

    // ===== RENDER HETEROGENEITY TAB =====
    function renderHeterogeneity(results) {
        const { pooled, egger, begg, trimfill, fsn, analysisType, effectMeasure } = results;
        const isLog = analysisType === 'binary';
        const transform = isLog ? Math.exp : (v) => v;
        const effectLabel = StatsEngine.getEffectLabel(analysisType, effectMeasure);

        // Funnel plot
        Charts.funnelPlot(document.getElementById('funnel-plot-container'), results);

        // Baujat plot
        Charts.baujatPlot(document.getElementById('baujat-plot-container'), results);

        // Galbraith plot
        Charts.galbraithPlot(document.getElementById('galbraith-plot-container'), results);

        // Bias tests
        const biasContainer = document.getElementById('bias-tests-container');
        const eggerPClass = !isNaN(egger.p) && egger.p < 0.05 ? 'sig' : 'nonsig';
        const beggPClass = !isNaN(begg.p) && begg.p < 0.05 ? 'sig' : 'nonsig';

        biasContainer.innerHTML = `
            <div class="bias-test">
                <div class="bias-test-title">Test de Egger (Asimetría del Embudo)</div>
                <div class="bias-test-result">
                    Intercepto = ${fmt(egger.intercept, 3)}, SE = ${fmt(egger.se, 3)}, t = ${fmt(egger.t, 3)}, 
                    <span class="p-value ${eggerPClass}">p = ${!isNaN(egger.p) ? (egger.p < 0.001 ? '< 0.001' : fmt(egger.p, 4)) : 'N/A'}</span>
                </div>
                <div class="bias-test-interp">${!isNaN(egger.p) && egger.p < 0.05 ? '⚠️ Asimetría significativa detectada — posible sesgo de publicación' : '✅ No se detecta asimetría significativa del funnel plot'}</div>
            </div>
            <div class="bias-test">
                <div class="bias-test-title">Test de Begg (Correlación de Rangos)</div>
                <div class="bias-test-result">
                    τ de Kendall = ${fmt(begg.tau, 3)}, z = ${fmt(begg.z, 3)}, 
                    <span class="p-value ${beggPClass}">p = ${!isNaN(begg.p) ? (begg.p < 0.001 ? '< 0.001' : fmt(begg.p, 4)) : 'N/A'}</span>
                </div>
                <div class="bias-test-interp">${!isNaN(begg.p) && begg.p < 0.05 ? '⚠️ Correlación significativa — posible sesgo' : '✅ No se detecta correlación significativa'}</div>
            </div>
            <div class="bias-test">
                <div class="bias-test-title">Trim-and-Fill</div>
                <div class="bias-test-result">
                    Estudios imputados (k₀) = ${trimfill.k0}
                    ${trimfill.k0 > 0 ? `, Efecto ajustado = ${fmt(trimfill.thetaAdj, 4)} [${fmt(trimfill.ciAdj[0], 4)}, ${fmt(trimfill.ciAdj[1], 4)}]` : ''}
                </div>
                <div class="bias-test-interp">${trimfill.k0 > 0 ? '⚠️ El ajuste trim-and-fill altera el efecto global' : '✅ Trim-and-fill no imputó ningún estudio'}</div>
            </div>
            <div class="bias-test">
                <div class="bias-test-title">Fail-Safe N (Rosenthal)</div>
                <div class="bias-test-result">NFS = ${fsn.fsn}</div>
                <div class="bias-test-interp">Se necesitan ${fsn.fsn} estudios nulos para volver el p-valor > 0.05</div>
            </div>
        `;

        // Subgroup or Meta-Regression Analysis Output
        const subgroupContainer = document.getElementById('subgroup-analysis-container');
        if (subgroupContainer) {
            if (results.subgroupResults) {
                const sr = results.subgroupResults;
                const pBClass = sr.p_value < 0.05 ? 'significant' : 'not-significant';
                let sgHTML = `
                <div class="panel-section" style="margin-top:2rem; padding-top:2rem; border-top:1px solid var(--border-light);">
                    <h3 class="panel-subtitle">Análisis de Subgrupos (Q-between)</h3>
                    <p class="panel-description">Verifica si la variable descriptiva elegida explica parte de la heterogeneidad entre estudios.</p>
                    <div class="summary-grid" style="margin-bottom: 1rem;">
                        <div class="summary-item">
                            <div class="label">Q<sub>between</sub></div>
                            <div class="value">${fmt(sr.Q_between)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="label">df</div>
                            <div class="value">${sr.df}</div>
                        </div>
                        <div class="summary-item">
                            <div class="label">p-valor</div>
                            <div class="value ${pBClass}">${sr.p_value < 0.001 ? '< 0.001' : fmt(sr.p_value, 4)}</div>
                            <div style="font-size: 0.75em; margin-top: 4px; color: var(--text-muted);">
                                ${sr.p_value < 0.05 ? ' Diferencias estadísticamente significativas entre los subgrupos.' : ' No hay diferencias estadísticamente significativas.'}
                            </div>
                        </div>
                    </div>
                    <table class="results-data-table">
                        <thead>
                            <tr>
                                <th>Subgrupo</th>
                                <th>k</th>
                                <th>${effectLabel}</th>
                                <th>95% CI</th>
                                <th>I² Dentro</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                sr.groups.forEach(g => {
                    const gp = g.pooled;
                    sgHTML += `
                            <tr>
                                <td style="font-weight: 500;">${g.group}</td>
                                <td>${g.k}</td>
                                <td>${fmt(transform(gp.theta))}</td>
                                <td>[${fmt(transform(gp.ci[0]))}, ${fmt(transform(gp.ci[1]))}]</td>
                                <td>${gp.I2 !== undefined ? fmt(Math.max(0, gp.I2), 1) + '%' : 'N/A'}</td>
                            </tr>
                    `;
                });
                sgHTML += `</tbody></table></div>`;
                subgroupContainer.innerHTML = sgHTML;
            } else if (results.regressionResults) {
                const reg = results.regressionResults;
                const pBClass = reg.pB1 < 0.05 ? 'significant' : 'not-significant';
                let regHTML = `
                <div class="panel-section" style="margin-top:2rem; padding-top:2rem; border-top:1px solid var(--border-light);">
                    <h3 class="panel-subtitle">Meta-Regresión Continua (WLS)</h3>
                    <p class="panel-description">Verifica si la variable continua explica la heterogeneidad y modera el tamaño de efecto.</p>
                    <div class="summary-grid" style="margin-bottom: 1rem;">
                        <div class="summary-item">
                            <div class="label">R² (Varianza explicada)</div>
                            <div class="value">${fmt(reg.R2 * 100, 1)}%</div>
                        </div>
                        <div class="summary-item">
                            <div class="label">Q<sub>modelo</sub></div>
                            <div class="value">${fmt(reg.Q_model)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="label">p-valor del Modelo</div>
                            <div class="value ${pBClass}">${reg.p_model < 0.001 ? '< 0.001' : fmt(reg.p_model, 4)}</div>
                            <div style="font-size: 0.75em; margin-top: 4px; color: var(--text-muted);">
                                ${reg.p_model < 0.05 ? ' El moderador predice significativamente el efecto.' : ' No modera significativamente.'}
                            </div>
                        </div>
                    </div>
                    <table class="results-data-table">
                        <thead>
                            <tr>
                                <th>Coeficiente</th>
                                <th>Estimación (β)</th>
                                <th>Error Estándar (SE)</th>
                                <th>Z</th>
                                <th>p-valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight: 500;">Intercepto (β₀)</td>
                                <td>${fmt(reg.b0, 4)}</td>
                                <td>${fmt(reg.seB0, 4)}</td>
                                <td>${fmt(reg.zB0, 3)}</td>
                                <td>${reg.pB0 < 0.001 ? '< 0.001' : fmt(reg.pB0, 4)}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500;">Moderador Contin. (β₁)</td>
                                <td>${fmt(reg.b1, 4)}</td>
                                <td>${fmt(reg.seB1, 4)}</td>
                                <td>${fmt(reg.zB1, 3)}</td>
                                <td class="${pBClass}" style="font-weight: 600;">${reg.pB1 < 0.001 ? '< 0.001' : fmt(reg.pB1, 4)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                `;
                subgroupContainer.innerHTML = regHTML;
            } else {
                const modType = document.getElementById('moderator-type').value;
                if (modType === 'continuous') {
                    subgroupContainer.innerHTML = '<div class="panel-section" style="margin-top:2rem; padding-top:2rem; border-top:1px solid var(--border-light);"><div class="empty-state"><p><strong>Datos Insuficientes:</strong> Para la Meta-Regresión Continua necesitas al menos 3 estudios con valores numéricos en la columna Subgrupo.</p></div></div>';
                } else {
                    subgroupContainer.innerHTML = '';
                }
            }
        }

        // Detailed heterogeneity stats
        const hetDetail = document.getElementById('het-stats-detail');
        const i2 = pooled.I2 !== undefined ? pooled.I2 : 0;
        hetDetail.innerHTML = `
        <div class="summary-grid">
                <div class="summary-item">
                    <div class="label">Q de Cochran</div>
                    <div class="value">${fmt(pooled.Q, 3)}</div>
                    <div class="ci">df = ${pooled.dfQ}, p = ${pooled.pQ < 0.001 ? '< 0.001' : fmt(pooled.pQ, 4)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">I²</div>
                    <div class="value">${fmt(i2, 2)}%</div>
                    <div class="ci">${i2 < 25 ? 'Baja' : i2 < 50 ? 'Moderada' : i2 < 75 ? 'Sustancial' : 'Considerable'}</div>
                </div>
                <div class="summary-item">
                    <div class="label">τ² (DL)</div>
                    <div class="value">${fmt(pooled.tau2 || 0, 4)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">τ</div>
                    <div class="value">${fmt(pooled.tau || 0, 4)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">H²</div>
                    <div class="value">${fmt(pooled.H2 || 1, 3)}</div>
                </div>
                ${pooled.pi ? `<div class="summary-item">
                    <div class="label">Intervalo Predicción</div>
                    <div class="value" style="font-size:0.75rem">[${fmt(pooled.pi[0], 3)}, ${fmt(pooled.pi[1], 3)}]</div>
                </div>` : ''
            }
            </div >
        `;
    }

    // ===== RENDER SENSITIVITY TAB =====
    function renderSensitivity(results) {
        const { loo, influence, labels, pooled, analysisType, effectMeasure } = results;
        const isLog = analysisType === 'binary';
        const transform = isLog ? Math.exp : (v) => v;

        // Leave-one-out plot
        Charts.looPlot(document.getElementById('loo-plot-container'), results);

        // Influence table
        const infContainer = document.getElementById('influence-table-container');
        let infHTML = `<table class="results-data-table">
            <thead><tr>
                <th>Estudio</th><th>Residuo Std</th><th>Cook's D</th><th>Hat</th><th>Peso %</th>
            </tr></thead><tbody>`;

        labels.forEach((label, i) => {
            const isOutlier = Math.abs(influence.stdResiduals[i]) > 2;
            const style = isOutlier ? 'color: var(--danger)' : '';
            infHTML += `<tr style="${style}">
                <td>${label}</td>
                <td>${fmt(influence.stdResiduals[i], 3)}</td>
                <td>${fmt(influence.cooksD[i], 4)}</td>
                <td>${fmt(influence.hatValues[i], 4)}</td>
                <td>${fmt(influence.weights[i], 1)}%</td>
            </tr>`;
        });

        infHTML += `</tbody></table>`;
        if (influence.stdResiduals.some(r => Math.abs(r) > 2)) {
            infHTML += `<p style="margin-top:8px;font-size:0.75rem;color:var(--danger)">⚠️ Estudios con | residuo estandarizado | > 2 pueden ser outliers</p>`;
        }
        infContainer.innerHTML = infHTML;

        // Render Bubble Plot if applicable
        const bubblePanel = document.getElementById('bubble-plot-panel');
        const bubbleContainer = document.getElementById('bubble-plot-container');
        if (bubblePanel && bubbleContainer) {
            if (results.regressionResults) {
                bubblePanel.style.display = 'block';
                Charts.bubblePlot(bubbleContainer, results);
            } else {
                const modType = document.getElementById('moderator-type') ? document.getElementById('moderator-type').value : 'none';
                if (modType === 'continuous') {
                    bubblePanel.style.display = 'block';
                    bubbleContainer.innerHTML = '<div class="empty-state"><p>No se pudo generar el gráfico. Revisa que la columna subgrupo tenga valores numéricos.</p></div>';
                } else {
                    bubblePanel.style.display = 'none';
                }
            }
        }
    }

    // ===== F2: RECALCULATE WITH FILTER =====
    function recalculateFiltered() {
        if (!currentResults) return;
        const { yi, vi, sei, labels, pooled, analysisType, effectMeasure } = currentResults;
        const model = pooled.model;
        const modelFn = model === 'fixed' ? StatsEngine.fixedEffects : StatsEngine.randomEffects;
        const isLog = analysisType === 'binary';
        const transform = isLog ? Math.exp : (v) => v;
        const effectLabel = StatsEngine.getEffectLabel(analysisType, effectMeasure);

        // Filter out excluded
        const activeIdx = yi.map((_, i) => i).filter(i => !excludedStudies.has(i));
        if (activeIdx.length < 2) {
            ExportModule.showToast('Se necesitan al menos 2 estudios incluidos', 'warning');
            return;
        }

        const filtYi = activeIdx.map(i => yi[i]);
        const filtVi = activeIdx.map(i => vi[i]);
        const filtSei = activeIdx.map(i => sei[i]);
        const filtLabels = activeIdx.map(i => labels[i]);

        // Repool
        const filtPooled = modelFn(filtYi, filtVi);
        const filtResults = { ...currentResults, yi: filtYi, vi: filtVi, sei: filtSei, labels: filtLabels, pooled: filtPooled };

        // Re-render forest plot and model summary only
        Charts.forestPlot(document.getElementById('forest-plot-container'), filtResults);

        const pClass = filtPooled.p < 0.05 ? 'significant' : 'not-significant';
        const summary = document.getElementById('model-summary');
        const i2 = filtPooled.I2 !== undefined ? filtPooled.I2 : 0;
        summary.innerHTML = `
            <div class="het-alert-banner het-alert-filtered" style="margin-bottom:0.75rem;">
                ⚠️ Filtrando ${excludedStudies.size} estudio(s) — k activo = ${activeIdx.length}
            </div>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="label">${effectLabel} (Filtrado)</div>
                    <div class="value ${pClass}">${fmt(transform(filtPooled.theta))}</div>
                    <div class="ci">[${fmt(transform(filtPooled.ci[0]))}, ${fmt(transform(filtPooled.ci[1]))}]</div>
                </div>
                <div class="summary-item"><div class="label">p-valor</div>
                    <div class="value ${pClass}">${filtPooled.p < 0.001 ? '< 0.001' : fmt(filtPooled.p, 4)}</div>
                </div>
                <div class="summary-item"><div class="label">I²</div>
                    <div class="value">${fmt(i2, 1)}%</div>
                </div>
                <div class="summary-item"><div class="label">k</div>
                    <div class="value">${filtPooled.k}</div>
                </div>
            </div>`;

        // Update row appearance
        document.querySelectorAll('.study-row').forEach(row => {
            const idx = parseInt(row.dataset.idx);
            row.classList.toggle('study-excluded', excludedStudies.has(idx));
        });

        renderHeterogeneityAlert(filtResults);
    }

    // ===== F6: HETEROGENEITY ALERT BANNER =====
    function renderHeterogeneityAlert(results) {
        // Find or create banner
        let banner = document.getElementById('het-alert-banner');
        if (!banner) {
            const forestPanel = document.querySelector('#tab-results .panel-full');
            if (!forestPanel) return;
            banner = document.createElement('div');
            banner.id = 'het-alert-banner';
            forestPanel.parentNode.insertBefore(banner, forestPanel);
        }

        const i2 = results.pooled.I2 || 0;
        if (i2 < 50) {
            banner.innerHTML = '';
            banner.style.display = 'none';
            return;
        }

        const level = i2 >= 75 ? 'high' : 'moderate';
        const icon = i2 >= 75 ? '🔴' : '⚠️';
        const msg = i2 >= 75
            ? `Heterogeneidad <strong>considerable</strong> (I² = ${fmt(i2, 1)}%). Se recomienda investigar fuentes de variabilidad antes de combinar estudios. ¿Son clínicamente comparables?`
            : `Heterogeneidad <strong>moderada-sustancial</strong> (I² = ${fmt(i2, 1)}%). Considera análisis de subgrupos o meta-regresión para explorar las fuentes.`;
        const suggestions = i2 >= 75
            ? [
                'Cambia al Moderador → Categórico para Análisis de Subgrupos',
                'Usa Moderador → Continuo para Meta-Regresión',
                'Elimina estudios influyentes con Leave-One-Out',
            ]
            : [
                'Explora la tabla de Influencia en pestaña Sensibilidad',
                'Verifica la calidad metodológica en pestaña Calidad (RoB 2)',
            ];

        banner.style.display = 'block';
        banner.innerHTML = `
            <div class="het-alert-banner het-alert-${level}">
                <div class="het-alert-icon">${icon}</div>
                <div class="het-alert-body">
                    <div class="het-alert-title">Alerta de Heterogeneidad Clínica</div>
                    <div class="het-alert-msg">${msg}</div>
                    <ul class="het-alert-tips">
                        ${suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            </div>`;
    }

    function fmt(n, decimals = 2) {
        if (n === null || n === undefined || isNaN(n)) return '\u2014';
        return Number(n).toFixed(decimals);
    }

    // ===== EXPORT HANDLERS =====
    document.getElementById('btn-download-forest').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#forest-plot-container', 'forest_plot.png', currentResults);
    });
    document.getElementById('btn-download-funnel').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#funnel-plot-container', 'funnel_plot.png', currentResults);
    });
    document.getElementById('btn-download-baujat').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#baujat-plot-container', 'baujat_plot.png', currentResults);
    });
    document.getElementById('btn-download-loo').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#loo-plot-container', 'leave_one_out.png', currentResults);
    });
    // Add binding for the newly created bubble-plot-panel icon
    document.getElementById('btn-download-bubble')?.addEventListener('click', () => {
        ExportModule.exportSvgToPng('#bubble-plot-container', 'meta_regression_bubble.png', currentResults);
    });
    document.getElementById('btn-download-galbraith').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#galbraith-plot-container', 'galbraith_plot.png', currentResults);
    });

    // Export tab buttons
    document.getElementById('export-forest-png').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#forest-plot-container', 'forest_plot.png', currentResults);
    });
    document.getElementById('export-funnel-png').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#funnel-plot-container', 'funnel_plot.png', currentResults);
    });
    document.getElementById('export-baujat-png').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#baujat-plot-container', 'baujat_plot.png', currentResults);
    });
    document.getElementById('export-loo-png').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#loo-plot-container', 'leave_one_out.png', currentResults);
    });
    document.getElementById('export-galbraith-png').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#galbraith-plot-container', 'galbraith_plot.png', currentResults);
    });
    document.getElementById('export-bubble-png').addEventListener('click', () => {
        ExportModule.exportSvgToPng('#bubble-plot-container', 'meta_regression_bubble.png', currentResults);
    });
    document.getElementById('btn-generate-report').addEventListener('click', () => {
        ExportModule.generateFullReport(currentResults);
    });
    document.getElementById('export-data-csv').addEventListener('click', () => {
        ExportModule.exportInputData();
    });
    document.getElementById('export-results-csv').addEventListener('click', () => {
        ExportModule.exportResults(currentResults);
    });

    // ===== INIT =====
    initTable();
    setStatus('Listo', false);

    // F3: PRISMA init on export tab
    PrismaModule.init();

    // F4: PICO modal button
    document.getElementById('btn-open-pico')?.addEventListener('click', () => PicoModule.openModal());

    // F5: Calc modal button
    document.getElementById('btn-open-calc')?.addEventListener('click', () => {
        document.getElementById('modal-calc').style.display = 'flex';
        updateCalcForm();
    });

    // ===== R ENGINE INTEGRATION =====

    // Initialize R bridge on load
    RBridge.init();

    // ── Button: ⚗️ Análisis R Avanzado ────────────────────
    document.getElementById('btn-run-r')?.addEventListener('click', async () => {
        if (!currentResults) {
            ExportModule.showToast('Ejecuta primero el análisis JS estándar', 'warning');
            return;
        }

        setStatus('Motor R ejecutando...', true);
        const btn = document.getElementById('btn-run-r');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Calculando en R...'; }

        try {
            const rData = await RBridge.analyze(currentResults);

            // Render the three R panels
            renderRResultsPanel(rData, currentResults);
            renderRHeterogeneityPanel(rData);
            renderRSensitivityPanel(rData, currentResults.labels);

            setStatus('R completado ✅', false);
            ExportModule.showToast('Análisis R completado', 'success');
        } catch (err) {
            console.error('[R Analysis]', err);
            ExportModule.showToast('Error R: ' + err.message, 'error');
            setStatus('Error en R', false);

            // Show friendly error in panel
            const rPanel = document.getElementById('r-results-panel');
            const rBody = document.getElementById('r-results-body');
            if (rPanel && rBody) {
                rPanel.style.display = 'block';
                rBody.innerHTML = `<div class="het-alert-banner het-alert-high" style="margin:0;">
                    <strong>⚠️ R no disponible:</strong> ${err.message}<br>
                    <small style="margin-top:4px;display:block;">Asegúrate de que <code>node server.js</code> está corriendo en la carpeta HM/ y que R está instalado.</small>
                </div>`;
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg> ⚗️ Análisis R Avanzado`;
            }
        }
    });

    // ── Button: Exportar Script R ─────────────────────────
    document.getElementById('export-r-script')?.addEventListener('click', async () => {
        if (!currentResults) {
            ExportModule.showToast('Ejecuta primero el análisis', 'warning');
            return;
        }
        try {
            const code = await RBridge.exportCode(currentResults, 'MetaAnalysis Pro');
            RBridge.downloadRScript(code, 'metaanalysis.R');
            ExportModule.showToast('Script R descargado', 'success');
        } catch (err) {
            ExportModule.showToast('Error generando script R: ' + err.message, 'error');
        }
    });

})();

// ===== R RENDER FUNCTIONS (global, called from app.js IIFE above) =====

function renderRResultsPanel(rData, jsResults) {
    const panel = document.getElementById('r-results-panel');
    const body = document.getElementById('r-results-body');
    if (!panel || !body) return;

    const p = rData.pooling?.primary;
    const isLog = jsResults.analysisType === 'binary';
    const tr = isLog ? Math.exp : v => v;
    const f = (n, d = 3) => (n == null || isNaN(n)) ? '—' : Number(n).toFixed(d);

    if (!p || p.error) {
        body.innerHTML = `<div class="het-alert-banner het-alert-high" style="margin:0;">Error en pooling R: ${p?.error || 'desconocido'}</div>`;
        panel.style.display = 'block';
        return;
    }

    // Tau² methods comparison table
    const methods = rData.pooling?.all_methods || {};
    const isRandom = jsResults.model === 'random';
    let methodsHTML = '';
    if (isRandom && Object.keys(methods).length > 1) {
        methodsHTML = `
        <div style="margin-top:1.25rem; border-top:1px solid var(--border-light); padding-top:1rem;">
            <div style="font-size:0.72rem;font-weight:600;color:var(--text-tertiary);margin-bottom:0.75rem;letter-spacing:.05em;">COMPARACIÓN DE 7 MÉTODOS DE ESTIMACIÓN τ²</div>
            <table class="results-data-table" style="font-size:0.75rem;">
                <thead><tr><th>Método</th><th>θ</th><th>95% CI</th><th>τ²</th><th>I²</th></tr></thead>
                <tbody>
                ${Object.entries(methods).filter(([k, m]) => !m.error).map(([k, m]) => `
                    <tr style="${k === 'REML' ? 'font-weight:600;color:var(--accent);' : ''}">
                        <td>${k}${k === 'REML' ? ' ★' : ''}</td>
                        <td>${f(tr(m.theta))}</td>
                        <td>[${f(tr(m.ci_lo))}, ${f(tr(m.ci_hi))}]</td>
                        <td>${f(m.tau2, 4)}</td>
                        <td>${f(m.I2, 1)}%</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <p style="font-size:0.65rem;color:var(--text-tertiary);margin-top:6px;">★ REML = método recomendado por defecto. DL = DerSimonian-Laird (el que usa el motor JS).</p>
        </div>`;
    }

    body.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">θ REML</div>
                <div class="value ${p.p < 0.05 ? 'significant' : ''}">${f(tr(p.theta))}</div>
                <div class="ci">[${f(tr(p.ci_lo))}, ${f(tr(p.ci_hi))}]</div>
            </div>
            <div class="summary-item">
                <div class="label">p-valor</div>
                <div class="value ${p.p < 0.05 ? 'significant' : ''}">${p.p < 0.001 ? '< 0.001' : f(p.p, 4)}</div>
            </div>
            <div class="summary-item">
                <div class="label">I² + 95% CI</div>
                <div class="value">${f(p.I2, 1)}%</div>
                <div class="ci">[${f(p.I2_ci_lo, 1)}% – ${f(p.I2_ci_hi, 1)}%]</div>
            </div>
            <div class="summary-item">
                <div class="label">τ² + 95% CI</div>
                <div class="value">${f(p.tau2, 4)}</div>
                <div class="ci">[${f(p.tau2_ci_lo, 4)}, ${f(p.tau2_ci_hi, 4)}]</div>
            </div>
            ${p.pi_lo != null ? `
            <div class="summary-item" style="grid-column:span 2;">
                <div class="label">Intervalo de Predicción (95%)</div>
                <div class="ci">[${f(tr(p.pi_lo))}, ${f(tr(p.pi_hi))}]</div>
            </div>` : ''}
        </div>
        ${methodsHTML}
    `;

    panel.style.display = 'block';
}

function renderRHeterogeneityPanel(rData) {
    const panel = document.getElementById('r-het-panel');
    const body = document.getElementById('r-het-body');
    if (!panel || !body) return;

    let html = '';

    // 1. Estimadores de Heterogeneidad (tau2)
    const methods = rData.pooling?.all_methods;
    const isRandom = rData.pooling?.model_type === 'random';

    const f = (n, d = 3) => (n == null || isNaN(n)) ? '—' : Number(n).toFixed(d);
    const pClass = p => (!isNaN(p) && p < 0.05) ? 'sig' : 'nonsig';

    if (isRandom && methods && Object.keys(methods).length > 1) {
        let rows = '';
        Object.entries(methods).filter(([k, m]) => !m.error).forEach(([k, m]) => {
            const isReml = k === 'REML';
            rows += `
                <tr style="${isReml ? 'font-weight:600;color:var(--accent);' : ''}">
                    <td>${k}${isReml ? ' ★' : ''}</td>
                    <td>${f(m.tau2, 4)}</td>
                    <td>[${f(m.tau2_ci_lo, 4)}, ${f(m.tau2_ci_hi, 4)}]</td>
                    <td>${f(m.I2, 1)}%</td>
                    <td>[${f(m.I2_ci_lo, 1)}%, ${f(m.I2_ci_hi, 1)}%]</td>
                </tr>
            `;
        });

        html += `
            <div style="font-size:0.72rem;font-weight:600;color:var(--text-tertiary);margin-bottom:1rem;letter-spacing:.05em;">ESTIMADORES DE VARIANZA ENTRE-ESTUDIOS (τ²) Y HETEROGENEIDAD (I²)</div>
            <table class="results-data-table" style="font-size:0.75rem;margin-bottom:2rem;">
                <thead>
                    <tr>
                        <th>Método</th>
                        <th>τ² Estimado</th>
                        <th>95% CI (τ²)</th>
                        <th>I² Estimado</th>
                        <th>95% CI (I²)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    } else {
        html += `<div class="empty-state-sm"><p>Los múltiples estimadores de heterogeneidad (DL, REML, etc.) solo aplican a Modelos de Efectos Aleatorios.</p></div>`;
    }

    // 2. Tests de Sesgo
    const bias = rData.bias || {};
    const egger = bias.egger || {};
    const begg = bias.begg || {};
    const trimfill = bias.trimfill || {};
    const fsnR = bias.fsn_rosenthal || {};
    const fsnO = bias.fsn_orwin || {};

    html += `
        <div style="font-size:0.72rem;font-weight:600;color:var(--text-tertiary);margin-bottom:1rem;letter-spacing:.05em;">TESTS DE SESGO — VERSIÓN R (con distribución t exacta)</div>
        <div class="bias-test">
            <div class="bias-test-title">Egger (R — regtest)</div>
            <div class="bias-test-result">
                Intercepto = ${f(egger.intercept)}, SE = ${f(egger.se)}, t = ${f(egger.t)},
                <span class="p-value ${pClass(egger.p)}">p = ${egger.p < 0.001 ? '< 0.001' : f(egger.p, 4)}</span>
            </div>
        </div>
        <div class="bias-test">
            <div class="bias-test-title">Begg (R — ranktest)</div>
            <div class="bias-test-result">
                τ = ${f(begg.tau)}, z = ${f(begg.z)},
                <span class="p-value ${pClass(begg.p)}">p = ${begg.p < 0.001 ? '< 0.001' : f(begg.p, 4)}</span>
            </div>
        </div>
        <div class="bias-test">
            <div class="bias-test-title">Trim & Fill (R)</div>
            <div class="bias-test-result">
                k₀ = ${trimfill.k0 ?? '—'}, lado = ${trimfill.side ?? '—'}
                ${trimfill.k0 > 0 ? `, θ ajustado = ${f(trimfill.theta_adj)} [${f(trimfill.ci_lo_adj)}, ${f(trimfill.ci_hi_adj)}]` : ''}
            </div>
        </div>
        <div class="bias-test">
            <div class="bias-test-title">Fail-safe N</div>
            <div class="bias-test-result">
                Rosenthal FSN = <strong>${fsnR.fsn ?? '—'}</strong> · Orwin FSN (δ≤0.2) = <strong>${fsnO.fsn ?? '—'}</strong>
            </div>
        </div>
    `;

    body.innerHTML = html;
    panel.style.display = 'block';
}

function renderRSensitivityPanel(rData, labels) {
    const panel = document.getElementById('r-sensitivity-panel');
    const body = document.getElementById('r-sensitivity-body');
    if (!panel || !body) return;

    const infl = rData.sensitivity?.infl || {};
    const f = (n, d = 4) => (n == null || isNaN(n)) ? '—' : Number(n).toFixed(d);

    if (infl.error || !infl.dffits) {
        body.innerHTML = `<div class="empty-state-sm"><p>Diagnósticos R no disponibles: ${infl.error || 'sin datos'}</p></div>`;
        panel.style.display = 'block';
        return;
    }

    const k = labels.length;
    let rows = '';
    for (let i = 0; i < k; i++) {
        const dffits = infl.dffits?.[i];
        const cooksD = infl.cook_d?.[i];
        const covRatio = infl.cov_ratio?.[i];
        const hat = infl.hat?.[i];
        const stdRes = infl.std_res?.[i];
        const tau2Del = infl.tau2_del?.[i];
        const outlier = Math.abs(stdRes) > 3 || Math.abs(dffits) > 1;
        rows += `<tr style="${outlier ? 'color:var(--danger);font-weight:600;' : ''}">
            <td>${labels[i]}${outlier ? ' ⚠️' : ''}</td>
            <td>${f(dffits, 3)}</td>
            <td>${f(cooksD, 4)}</td>
            <td>${f(covRatio, 3)}</td>
            <td>${f(stdRes, 3)}</td>
            <td>${f(tau2Del, 4)}</td>
            <td>${f(hat * 100, 1)}%</td>
        </tr>`;
    }

    body.innerHTML = `
        <table class="results-data-table" style="font-size:0.75rem;">
            <thead><tr>
                <th>Estudio</th><th>DFFITS</th><th>Cook's D</th><th>CovRatio</th><th>Res. Std</th><th>τ² sin estudio</th><th>Peso %</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <p style="font-size:0.68rem;color:var(--text-tertiary);margin-top:6px;">⚠️ = |DFFITS|>1 o |residuo|>3. CovRatio < 1 indica que el estudio aumenta la precisión.</p>
    `;
    panel.style.display = 'block';
}

// ===== F5: EFFECT SIZE CALCULATOR GLOBALS =====
function updateCalcForm() {
    const type = document.getElementById('calc-type')?.value;
    const form = document.getElementById('calc-form');
    if (!form) return;
    const field = (id, label, placeholder = '') =>
        `<div style="margin-bottom:0.75rem;">
            <label class="sidebar-label">${label}</label>
            <input type="number" id="calc-${id}" class="select-input" placeholder="${placeholder}" step="any">
        </div>`;
    const twoCol = (a, b) =>
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">${a}${b}</div>`;

    let html = '';
    if (type === 'smd' || type === 'md') {
        html = `<p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:0.75rem;">Grupo Experimental vs Control</p>`;
        html += twoCol(field('m1', 'Media Exp.', '12.5'), field('sd1', 'DE Exp.', '3.2'));
        html += field('n1', 'N Experimental', '45');
        html += twoCol(field('m2', 'Media Control', '10.1'), field('sd2', 'DE Control', '3.5'));
        html += field('n2', 'N Control', '42');
    } else if (type === 'or' || type === 'rr') {
        html = `<p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:0.75rem;">Eventos / Total por grupo (tabla 2×2)</p>`;
        html += twoCol(field('e1', 'Eventos Exp.', '20'), field('n1', 'N Experimental', '60'));
        html += twoCol(field('e2', 'Eventos Control', '10'), field('n2', 'N Control', '60'));
    } else if (type === 'correlation') {
        html = field('r', 'Coeficiente r', '0.35') + field('n', 'N (muestra)', '100');
    }
    form.innerHTML = html;
    document.getElementById('calc-result').innerHTML = '';
    const applyBtn = document.getElementById('btn-apply-calc');
    if (applyBtn) applyBtn.style.display = 'none';
}

function runCalcES() {
    const type = document.getElementById('calc-type')?.value;
    const g = id => {
        const el = document.getElementById(`calc-${id}`);
        return el ? el.value : '';
    };
    let params = {};
    if (type === 'smd' || type === 'md') {
        params = { m1: g('m1'), sd1: g('sd1'), n1: g('n1'), m2: g('m2'), sd2: g('sd2'), n2: g('n2') };
    } else if (type === 'or' || type === 'rr') {
        params = { e1: g('e1'), n1: g('n1'), e2: g('e2'), n2: g('n2') };
    } else if (type === 'correlation') {
        params = { r: g('r'), n: g('n') };
    }

    const result = StatsEngine.calcES(type, params);
    const out = document.getElementById('calc-result');
    if (result.error) {
        out.innerHTML = `<div class="het-alert-banner het-alert-high" style="margin:0;">${result.error}</div>`;
        window._calcLastResult = null;
        return;
    }
    window._calcLastResult = result;
    const ci95lo = (result.es - 1.96 * result.se).toFixed(4);
    const ci95hi = (result.es + 1.96 * result.se).toFixed(4);
    out.innerHTML = `
        <div class="rob-summary-card rob-card-low" style="background:var(--success-dim);border-radius:8px;padding:1rem;">
            <div style="font-size:0.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;">${result.label}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                <div><div style="font-size:0.7rem;color:var(--text-tertiary);">ES</div>
                    <div style="font-family:var(--font-mono);font-weight:700;font-size:1.1rem;color:var(--success);">${result.es.toFixed(4)}</div></div>
                <div><div style="font-size:0.7rem;color:var(--text-tertiary);">SE</div>
                    <div style="font-family:var(--font-mono);font-weight:700;font-size:1.1rem;">${result.se.toFixed(4)}</div></div>
                <div style="grid-column:span 2;"><div style="font-size:0.7rem;color:var(--text-tertiary);">95% CI</div>
                    <div style="font-family:var(--font-mono);">[${ci95lo}, ${ci95hi}]</div></div>
                ${result.note ? `<div style="grid-column:span 2;font-size:0.72rem;color:var(--text-tertiary);">${result.note}</div>` : ''}
            </div>
        </div>`;
    const applyBtn = document.getElementById('btn-apply-calc');
    if (applyBtn) applyBtn.style.display = 'inline-flex';
}

function applyCalcToRow() {
    const result = window._calcLastResult;
    if (!result) return;
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) return;
    // Apply to last row OR active row
    const lastRow = rows[rows.length - 1];
    const esInputs = lastRow.querySelectorAll('input[type="number"]');
    // For precalc type: set ES and SE inputs
    if (esInputs.length >= 2) {
        esInputs[0].value = result.es.toFixed(4);
        esInputs[1].value = result.se.toFixed(4);
        if (typeof ExportModule !== 'undefined') ExportModule.showToast('ES y SE aplicados a la última fila', 'success');
    }
    document.getElementById('modal-calc').style.display = 'none';
}

// ===== METHODOLOGY MODAL =====
document.addEventListener('DOMContentLoaded', () => {
    const btnMethodology = document.getElementById('btn-methodology');
    const methodologyModal = document.getElementById('methodology-modal');
    const btnCloseMethodology = document.getElementById('btn-close-methodology');

    if (btnMethodology && methodologyModal && btnCloseMethodology) {
        btnMethodology.addEventListener('click', () => {
            methodologyModal.style.display = 'flex';
        });

        btnCloseMethodology.addEventListener('click', () => {
            methodologyModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === methodologyModal) {
                methodologyModal.style.display = 'none';
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && methodologyModal.style.display === 'flex') {
                methodologyModal.style.display = 'none';
            }
        });
    }
});
