/**
 * MetaAnalysis Pro — Enhanced SVG Chart Generators v2
 * 
 * Inspired by R.S notebook: ggplot2 advanced techniques, ggshadow glow effects,
 * viridis palettes, gradient fills, contour funnel plots, hover tooltips,
 * text repulsion, enhanced forest plot with weight bars, Galbraith/radial plot.
 */

const Charts = (() => {
    // ===== ENHANCED COLOR PALETTE (Academic Light Theme) =====
    const COLORS = {
        bg: '#ffffff',
        surface: '#f8f9fa',
        surfaceAlt: '#f1f5f9',
        grid: '#e2e8f0',
        gridStrong: '#cbd5e1',
        text: '#0f172a',
        textDim: '#475569',
        textMicro: '#64748b',
        accent: '#0ea5e9',
        accentDim: 'rgba(14, 165, 233, 0.1)',
        accentGlow: 'rgba(14, 165, 233, 0.15)',
        accentBright: '#38bdf8',
        info: '#3b82f6',
        infoDim: 'rgba(59, 130, 246, 0.1)',
        danger: '#ef4444',
        dangerDim: 'rgba(239, 68, 68, 0.15)',
        warning: '#f59e0b',
        warningDim: 'rgba(245, 158, 11, 0.15)',
        success: '#10b981',
        diamond: '#0ea5e9',
        diamondFill: 'rgba(14, 165, 233, 0.2)',
        ci: 'rgba(15, 23, 42, 0.1)',
        ciLine: '#64748b',
        ciGlow: 'rgba(0, 0, 0, 0)',
        nullLine: 'rgba(239, 68, 68, 0.5)',
        filledStudy: 'rgba(59, 130, 246, 0.2)',
        // Viridis-inspired weight gradient
        weightLow: '#440154',
        weightMid: '#21918c',
        weightHigh: '#fde725',
        // Contour bands
        contour1: 'rgba(15, 23, 42, 0.02)',
        contour2: 'rgba(15, 23, 42, 0.04)',
        contour3: 'rgba(15, 23, 42, 0.06)'
    };

    const FONT = "'Inter', sans-serif";
    const MONO = "'JetBrains Mono', monospace";

    // ===== SVG HELPERS =====
    function svgEl(tag, attrs = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
    }

    function svgText(x, y, text, opts = {}) {
        const el = svgEl('text', {
            x, y,
            'font-family': opts.font || FONT,
            'font-size': opts.size || 12,
            fill: opts.fill || COLORS.text,
            'text-anchor': opts.anchor || 'start',
            'dominant-baseline': opts.baseline || 'middle',
            'font-weight': opts.weight || '400',
            ...opts.attrs
        });
        el.textContent = text;
        return el;
    }

    function svgLine(x1, y1, x2, y2, opts = {}) {
        return svgEl('line', {
            x1, y1, x2, y2,
            stroke: opts.stroke || COLORS.grid,
            'stroke-width': opts.width || 1,
            'stroke-dasharray': opts.dash || 'none',
            ...opts.attrs
        });
    }

    function svgRect(x, y, w, h, opts = {}) {
        return svgEl('rect', {
            x, y, width: w, height: h,
            fill: opts.fill || 'none',
            stroke: opts.stroke || 'none',
            rx: opts.rx || 0,
            ...opts.attrs
        });
    }

    function fmt(n, decimals = 2) {
        if (isNaN(n) || n === null || n === undefined) return '—';
        return Number(n).toFixed(decimals);
    }

    function niceScale(min, max, ticks = 6) {
        const range = max - min || 1;
        const roughStep = range / ticks;
        const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const residual = roughStep / mag;
        let step;
        if (residual <= 1.5) step = mag;
        else if (residual <= 3) step = 2 * mag;
        else if (residual <= 7) step = 5 * mag;
        else step = 10 * mag;
        const niceMin = Math.floor(min / step) * step;
        const niceMax = Math.ceil(max / step) * step;
        const values = [];
        for (let v = niceMin; v <= niceMax + step * 0.01; v += step)
            values.push(Math.round(v * 1e10) / 1e10);
        return { min: niceMin, max: niceMax, step, values };
    }

    /** Interpolate viridis-like color based on weight 0..1 */
    function weightColor(t) {
        t = Math.max(0, Math.min(1, t));
        if (t < 0.5) {
            const s = t * 2;
            const r = Math.round(68 + s * (33 - 68));
            const g = Math.round(1 + s * (145 - 1));
            const b = Math.round(84 + s * (140 - 84));
            return `rgb(${r},${g},${b})`;
        } else {
            const s = (t - 0.5) * 2;
            const r = Math.round(33 + s * (253 - 33));
            const g = Math.round(145 + s * (231 - 145));
            const b = Math.round(140 + s * (37 - 140));
            return `rgb(${r},${g},${b})`;
        }
    }

    /** Create SVG defs with gradients and filters */
    function createDefs(svg) {
        const defs = svgEl('defs');

        // Glow filter (ggshadow-inspired)
        const glowFilter = svgEl('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
        const blur = svgEl('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '3', result: 'blur' });
        const merge = svgEl('feMerge');
        merge.appendChild(svgEl('feMergeNode', { in: 'blur' }));
        merge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
        glowFilter.appendChild(blur);
        glowFilter.appendChild(merge);
        defs.appendChild(glowFilter);

        // Subtle glow for points
        const ptGlow = svgEl('filter', { id: 'ptGlow', x: '-100%', y: '-100%', width: '300%', height: '300%' });
        const ptBlur = svgEl('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '4', result: 'blur' });
        const ptMerge = svgEl('feMerge');
        ptMerge.appendChild(svgEl('feMergeNode', { in: 'blur' }));
        ptMerge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
        ptGlow.appendChild(ptBlur);
        ptGlow.appendChild(ptMerge);
        defs.appendChild(ptGlow);

        // Diamond gradient
        const diamondGrad = svgEl('linearGradient', { id: 'diamondGrad', x1: '0', y1: '0', x2: '1', y2: '1' });
        diamondGrad.appendChild(Object.assign(svgEl('stop', { offset: '0%', 'stop-color': '#00d4aa', 'stop-opacity': '0.6' })));
        diamondGrad.appendChild(Object.assign(svgEl('stop', { offset: '100%', 'stop-color': '#33ffd4', 'stop-opacity': '0.3' })));
        defs.appendChild(diamondGrad);

        // CI band gradient
        const ciBand = svgEl('linearGradient', { id: 'ciBand', x1: '0', y1: '0', x2: '0', y2: '1' });
        ciBand.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#00d4aa', 'stop-opacity': '0.08' }));
        ciBand.appendChild(svgEl('stop', { offset: '50%', 'stop-color': '#00d4aa', 'stop-opacity': '0.04' }));
        ciBand.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#00d4aa', 'stop-opacity': '0.08' }));
        defs.appendChild(ciBand);

        // Shadow filter for depth
        const shadow = svgEl('filter', { id: 'dropShadow', x: '-10%', y: '-10%', width: '130%', height: '130%' });
        shadow.appendChild(svgEl('feDropShadow', { dx: '0', dy: '1', stdDeviation: '2', 'flood-color': 'rgba(0,0,0,0.4)' }));
        defs.appendChild(shadow);

        svg.appendChild(defs);
    }

    /** Initialize global HTML tooltip */
    function getHtmlTooltip() {
        let tip = document.getElementById('chart-html-tooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'chart-html-tooltip';
            tip.className = 'html-tooltip';
            document.body.appendChild(tip);
        }
        return tip;
    }

    /** Add interactive HTML tooltip overlay to SVG elements */
    function addHtmlTooltip(g, contentHtml) {
        g.style.cursor = 'pointer';

        g.addEventListener('mouseenter', (e) => {
            const tip = getHtmlTooltip();
            tip.innerHTML = contentHtml;
            tip.classList.add('show');
            // Initial position before mousemove
            tip.style.left = `${e.clientX}px`;
            tip.style.top = `${e.clientY}px`;
        });

        g.addEventListener('mousemove', (e) => {
            const tip = getHtmlTooltip();
            tip.style.left = `${e.clientX}px`;
            tip.style.top = `${e.clientY}px`;
        });

        g.addEventListener('mouseleave', () => {
            const tip = getHtmlTooltip();
            tip.classList.remove('show');
        });

        return g;
    }

    // ===== ENHANCED FOREST PLOT =====

    function forestPlot(container, results) {
        const { yi, sei, labels, pooled, analysisType, effectMeasure } = results;
        const k = yi.length;
        const isLog = analysisType === 'binary';
        container.innerHTML = '';

        const margin = { top: 52, right: 30, bottom: 58, left: 10 };
        const labelWidth = 155;
        const statsWidth = 200;
        const plotWidth = 420;
        const weightBarWidth = 50;
        const rowHeight = 34;
        const summaryGap = 18;
        const totalHeight = margin.top + k * rowHeight + summaryGap + rowHeight + margin.bottom + 20;
        const totalWidth = margin.left + labelWidth + plotWidth + statsWidth + weightBarWidth + margin.right;

        const svg = svgEl('svg', {
            width: totalWidth, height: totalHeight,
            viewBox: `0 0 ${totalWidth} ${totalHeight}`, class: 'chart'
        });
        svg.style.background = COLORS.bg;
        createDefs(svg);
        svg.appendChild(svgRect(0, 0, totalWidth, totalHeight, { fill: COLORS.bg }));

        const ci95 = yi.map((y, i) => [y - 1.96 * sei[i], y + 1.96 * sei[i]]);
        const allVals = [...yi, ...ci95.flat(), pooled.ci[0], pooled.ci[1]];
        const dataMin = Math.min(...allVals);
        const dataMax = Math.max(...allVals);
        const padding = (dataMax - dataMin) * 0.15 || 0.5;
        const scale = niceScale(dataMin - padding, dataMax + padding, 7);

        const plotLeft = margin.left + labelWidth;
        const plotRight = plotLeft + plotWidth;
        const mapX = (val) => plotLeft + ((val - scale.min) / (scale.max - scale.min)) * plotWidth;
        const nullValue = StatsEngine.getNullValue(analysisType);
        const effectLabel = StatsEngine.getEffectLabel(analysisType, effectMeasure);
        const weights = pooled.weights || new Array(k).fill(1 / k);
        const maxWeight = Math.max(...weights);
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        // Title with model badge
        svg.appendChild(svgText(totalWidth / 2, 18, `Forest Plot — ${effectLabel}`, {
            size: 15, weight: '700', anchor: 'middle', fill: COLORS.text
        }));
        // Model badge
        const badgeText = pooled.model === 'random' ? 'Efectos Aleatorios' : 'Efectos Fijos';
        const badgeW = badgeText.length * 6.8 + 16;
        svg.appendChild(svgRect(totalWidth / 2 - badgeW / 2, 26, badgeW, 18, {
            fill: COLORS.accentDim, stroke: COLORS.accent, rx: 9,
            attrs: { 'stroke-opacity': '0.4', 'stroke-width': '1' }
        }));
        svg.appendChild(svgText(totalWidth / 2, 36, badgeText, {
            size: 9, weight: '600', anchor: 'middle', fill: COLORS.accent
        }));

        // Column headers
        const headerY = margin.top - 8;
        svg.appendChild(svgText(margin.left + 8, headerY, 'Estudio', { size: 10, weight: '600', fill: COLORS.textDim }));
        svg.appendChild(svgText(plotLeft + plotWidth / 2, headerY, effectLabel, { size: 10, weight: '600', fill: COLORS.textDim, anchor: 'middle' }));
        svg.appendChild(svgText(plotRight + 10, headerY, `${effectLabel} [95% CI]`, { size: 10, weight: '600', fill: COLORS.textDim }));
        svg.appendChild(svgText(plotRight + statsWidth + 8, headerY, 'Peso', { size: 10, weight: '600', fill: COLORS.textDim }));

        // Grid
        for (const val of scale.values) {
            const x = mapX(val);
            svg.appendChild(svgLine(x, margin.top, x, margin.top + k * rowHeight + summaryGap + rowHeight, { stroke: COLORS.grid }));
            const dv = isLog ? fmt(Math.exp(val), 2) : fmt(val, 2);
            svg.appendChild(svgText(x, margin.top + k * rowHeight + summaryGap + rowHeight + 16, dv, {
                size: 10, anchor: 'middle', fill: COLORS.textMicro, font: MONO
            }));
        }

        // Null effect line with glow
        const nullX = mapX(nullValue);
        svg.appendChild(svgLine(nullX, margin.top - 4, nullX, margin.top + k * rowHeight + summaryGap + rowHeight + 4, {
            stroke: COLORS.nullLine, width: 3, dash: 'none',
            attrs: { 'stroke-opacity': '0.15' }
        }));
        svg.appendChild(svgLine(nullX, margin.top - 4, nullX, margin.top + k * rowHeight + summaryGap + rowHeight + 4, {
            stroke: COLORS.nullLine, width: 1.5, dash: '8,5'
        }));
        // Null label
        svg.appendChild(svgText(nullX, margin.top + k * rowHeight + summaryGap + rowHeight + 30, isLog ? 'OR=1' : 'Nulo', {
            size: 9, anchor: 'middle', fill: COLORS.textMicro, weight: '600'
        }));

        // Study rows
        for (let i = 0; i < k; i++) {
            const y = margin.top + i * rowHeight + rowHeight / 2;
            const ciLo = ci95[i][0];
            const ciHi = ci95[i][1];
            const wt = weights[i] / totalWeight;
            const wtNorm = weights[i] / maxWeight;

            // Alternating rows
            if (i % 2 === 0) {
                svg.appendChild(svgRect(0, margin.top + i * rowHeight, totalWidth, rowHeight, {
                    fill: 'rgba(255,255,255,0.015)'
                }));
            }

            // Study label
            const truncLabel = labels[i].length > 22 ? labels[i].substring(0, 20) + '…' : labels[i];
            svg.appendChild(svgText(margin.left + 8, y, truncLabel, { size: 11, fill: COLORS.text }));

            // CI line with glow effect (ggshadow-inspired)
            const x1 = Math.max(plotLeft, mapX(ciLo));
            const x2 = Math.min(plotRight, mapX(ciHi));
            // Glow behind CI
            svg.appendChild(svgLine(x1, y, x2, y, {
                stroke: COLORS.accentGlow, width: 6, attrs: { 'stroke-opacity': '0.2', 'stroke-linecap': 'round' }
            }));
            // Main CI line
            svg.appendChild(svgLine(x1, y, x2, y, {
                stroke: COLORS.ciLine, width: 1.5, attrs: { 'stroke-linecap': 'round' }
            }));
            // CI whiskers
            svg.appendChild(svgLine(x1, y - 5, x1, y + 5, { stroke: COLORS.ciLine, width: 1.2 }));
            svg.appendChild(svgLine(x2, y - 5, x2, y + 5, { stroke: COLORS.ciLine, width: 1.2 }));

            // Study point (color by weight — viridis gradient)
            const ptX = mapX(yi[i]);
            const sqSize = 5 + wtNorm * 11;
            const ptColor = weightColor(wtNorm);
            if (ptX >= plotLeft && ptX <= plotRight) {
                // Glow ring
                const ring = svgEl('circle', {
                    cx: ptX, cy: y, r: sqSize / 2 + 4,
                    fill: 'none', stroke: ptColor, 'stroke-width': 1, opacity: 0.2
                });
                // Main square
                const ptEl = svgRect(ptX - sqSize / 2, y - sqSize / 2, sqSize, sqSize, {
                    fill: ptColor, rx: 2.5, attrs: { filter: 'url(#dropShadow)' }
                });

                // Group them for tooltip interaction
                const ptGroup = svgEl('g', { class: 'study-point' });
                ptGroup.appendChild(ring);
                ptGroup.appendChild(ptEl);
                svg.appendChild(ptGroup);

                // Calculate P-value for this specific study
                const zVal = yi[i] / sei[i];
                const pVal = StatsEngine.pFromZ(zVal);
                const isSig = pVal < 0.05;
                const pText = pVal < 0.001 ? 'p < .001' : `p = ${fmt(pVal, 3)}`;
                const sigClass = isSig ? 'significance' : 'not-significance';

                // Format values for tooltip
                const dES = isLog ? fmt(Math.exp(yi[i]), 2) : fmt(yi[i], 2);
                const dLo = isLog ? fmt(Math.exp(ciLo), 2) : fmt(ciLo, 2);
                const dHi = isLog ? fmt(Math.exp(ciHi), 2) : fmt(ciHi, 2);
                const weightPct = fmt(wt * 100, 1) + '%';

                // Build rich HTML Tooltip content
                const tipHtml = `
                    <div class="tooltip-header">
                        <span>${labels[i]}</span>
                        <span class="tooltip-badge">Estudio Individual</span>
                    </div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="label">Tamaño de Efecto (${effectLabel}):</span>
                            <span class="value">${dES}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="label">95% Intervalo de Confianza:</span>
                            <span class="value">[${dLo}, ${dHi}]</span>
                        </div>
                        <div class="tooltip-row ${sigClass}">
                            <span class="label">Significancia:</span>
                            <span class="value">${pText}</span>
                        </div>
                        <div class="tooltip-row" style="margin-top: 4px;">
                            <span class="label">Peso en el Modelo:</span>
                            <span class="weight-pill" style="background: ${ptColor}">${weightPct}</span>
                        </div>
                    </div>
                `;

                addHtmlTooltip(ptGroup, tipHtml);
            }

            // Stats text
            const dES = isLog ? fmt(Math.exp(yi[i]), 2) : fmt(yi[i], 2);
            const dLo = isLog ? fmt(Math.exp(ciLo), 2) : fmt(ciLo, 2);
            const dHi = isLog ? fmt(Math.exp(ciHi), 2) : fmt(ciHi, 2);
            svg.appendChild(svgText(plotRight + 10, y, `${dES} [${dLo}, ${dHi}]`, {
                size: 10, fill: COLORS.textDim, font: MONO
            }));

            // Weight bar (horizontal, viridis colored)
            const wbX = plotRight + statsWidth + 8;
            const wbW = wtNorm * (weightBarWidth - 18);
            svg.appendChild(svgRect(wbX, y - 4, weightBarWidth - 18, 8, {
                fill: 'rgba(255,255,255,0.04)', rx: 4
            }));
            svg.appendChild(svgRect(wbX, y - 4, wbW, 8, {
                fill: ptColor, rx: 4, attrs: { opacity: '0.8' }
            }));
            svg.appendChild(svgText(wbX + weightBarWidth - 14, y, `${fmt(wt * 100, 1)}`, {
                size: 8, fill: COLORS.textMicro, font: MONO, anchor: 'end'
            }));
        }

        // Separator
        const sepY = margin.top + k * rowHeight + 4;
        svg.appendChild(svgLine(0, sepY, totalWidth, sepY, { stroke: COLORS.gridStrong, width: 1 }));

        // Summary diamond with gradient fill
        const sumY = margin.top + k * rowHeight + summaryGap + rowHeight / 2;
        const diamondX = mapX(pooled.theta);
        const diamondLeft = mapX(pooled.ci[0]);
        const diamondRight = mapX(pooled.ci[1]);

        svg.appendChild(svgText(margin.left + 8, sumY, pooled.model === 'random' ? 'RE Model' : 'FE Model', {
            size: 11, weight: '700', fill: COLORS.accent
        }));

        // Diamond glow
        const dh = 11;
        svg.appendChild(svgEl('polygon', {
            points: `${diamondLeft},${sumY} ${diamondX},${sumY - dh - 3} ${diamondRight},${sumY} ${diamondX},${sumY + dh + 3}`,
            fill: COLORS.accentGlow, stroke: 'none', opacity: 0.3
        }));
        // Diamond main
        svg.appendChild(svgEl('polygon', {
            points: `${diamondLeft},${sumY} ${diamondX},${sumY - dh} ${diamondRight},${sumY} ${diamondX},${sumY + dh}`,
            fill: 'url(#diamondGrad)', stroke: COLORS.diamond, 'stroke-width': 2
        }));

        // Summary stats
        const dTheta = isLog ? fmt(Math.exp(pooled.theta), 2) : fmt(pooled.theta, 2);
        const dCILo = isLog ? fmt(Math.exp(pooled.ci[0]), 2) : fmt(pooled.ci[0], 2);
        const dCIHi = isLog ? fmt(Math.exp(pooled.ci[1]), 2) : fmt(pooled.ci[1], 2);
        svg.appendChild(svgText(plotRight + 10, sumY, `${dTheta} [${dCILo}, ${dCIHi}]`, {
            size: 10, weight: '600', fill: COLORS.accent, font: MONO
        }));

        // Heterogeneity annotation with background
        const hetText = pooled.I2 !== undefined ?
            `I² = ${fmt(pooled.I2, 1)}%  ·  τ² = ${fmt(pooled.tau2, 4)}  ·  Q(${pooled.dfQ}) = ${fmt(pooled.Q, 2)}  ·  p = ${fmt(pooled.pQ, 4)}` :
            `Q(${pooled.dfQ}) = ${fmt(pooled.Q, 2)}, p = ${fmt(pooled.pQ, 4)}`;
        const hetY = totalHeight - 12;
        const hetBgW = hetText.length * 5.8 + 20;
        svg.appendChild(svgRect(totalWidth / 2 - hetBgW / 2, hetY - 10, hetBgW, 16, {
            fill: COLORS.surfaceAlt, rx: 4
        }));
        svg.appendChild(svgText(totalWidth / 2, hetY, hetText, {
            size: 9.5, anchor: 'middle', fill: COLORS.textDim, font: MONO
        }));

        container.appendChild(svg);
    }

    // ===== ENHANCED FUNNEL PLOT with contour bands =====

    function funnelPlot(container, results) {
        const { yi, sei, pooled, trimfill } = results;
        const k = yi.length;
        container.innerHTML = '';

        const margin = { top: 55, right: 45, bottom: 55, left: 75 };
        const width = 560;
        const height = 440;
        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;

        const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'chart' });
        svg.style.background = COLORS.bg;
        createDefs(svg);
        svg.appendChild(svgRect(0, 0, width, height, { fill: COLORS.bg }));

        svg.appendChild(svgText(width / 2, 22, 'Funnel Plot — Contour Enhanced', {
            size: 15, weight: '700', anchor: 'middle', fill: COLORS.text
        }));

        const allES = [...yi];
        const allSE = [...sei];
        if (trimfill && trimfill.k0 > 0) {
            for (let i = k; i < trimfill.filledYi.length; i++) {
                allES.push(trimfill.filledYi[i]);
                allSE.push(Math.sqrt(trimfill.filledVi[i]));
            }
        }
        const esRange = Math.max(Math.abs(Math.min(...allES) - pooled.theta), Math.abs(Math.max(...allES) - pooled.theta));
        const seMax = Math.max(...allSE) * 1.15;
        const esMin = pooled.theta - esRange * 1.5;
        const esMax = pooled.theta + esRange * 1.5;

        const scaleX = niceScale(esMin, esMax, 6);
        const scaleY = niceScale(0, seMax, 5);
        const mapX = (v) => margin.left + ((v - scaleX.min) / (scaleX.max - scaleX.min)) * plotW;
        const mapY = (v) => margin.top + (v / scaleY.max) * plotH;

        // Contour significance bands (p=0.01, p=0.05, p=0.1)
        const zValues = [2.576, 1.96, 1.645];
        const contourColors = [COLORS.contour3, COLORS.contour2, COLORS.contour1];
        const contourLabels = ['p<0.01', 'p<0.05', 'p<0.10'];
        for (let b = 0; b < zValues.length; b++) {
            const z = zValues[b];
            const pts = [];
            pts.push(`${mapX(pooled.theta)},${mapY(0)}`);
            pts.push(`${mapX(pooled.theta - z * scaleY.max)},${mapY(scaleY.max)}`);
            pts.push(`${mapX(pooled.theta + z * scaleY.max)},${mapY(scaleY.max)}`);
            svg.appendChild(svgEl('polygon', {
                points: pts.join(' '), fill: contourColors[b], stroke: 'none'
            }));
            // Contour label
            const lx = mapX(pooled.theta + z * scaleY.max * 0.6);
            const ly = mapY(scaleY.max * 0.6) - 6;
            svg.appendChild(svgText(lx, ly, contourLabels[b], {
                size: 8, fill: COLORS.textMicro, font: MONO, attrs: { opacity: '0.7' }
            }));
        }

        // Grid
        for (const v of scaleX.values) {
            const x = mapX(v);
            svg.appendChild(svgLine(x, margin.top, x, margin.top + plotH, { stroke: COLORS.grid }));
            svg.appendChild(svgText(x, margin.top + plotH + 16, fmt(v, 2), { size: 10, anchor: 'middle', fill: COLORS.textMicro, font: MONO }));
        }
        for (const v of scaleY.values) {
            const y = mapY(v);
            svg.appendChild(svgLine(margin.left, y, margin.left + plotW, y, { stroke: COLORS.grid }));
            svg.appendChild(svgText(margin.left - 8, y, fmt(v, 3), { size: 10, anchor: 'end', fill: COLORS.textMicro, font: MONO }));
        }

        // Axis labels
        svg.appendChild(svgText(width / 2, height - 8, 'Tamaño del Efecto', { size: 11, anchor: 'middle', fill: COLORS.textDim }));
        svg.appendChild(svgText(0, 0, 'Error Estándar', {
            size: 11, anchor: 'middle', fill: COLORS.textDim,
            attrs: { transform: `translate(16, ${margin.top + plotH / 2}) rotate(-90)` }
        }));

        // Pooled effect line with glow
        const thetaX = mapX(pooled.theta);
        svg.appendChild(svgLine(thetaX, mapY(0), thetaX, mapY(scaleY.max), {
            stroke: COLORS.accentGlow, width: 4, attrs: { 'stroke-opacity': '0.3' }
        }));
        svg.appendChild(svgLine(thetaX, mapY(0), thetaX, mapY(scaleY.max), {
            stroke: COLORS.accent, width: 1.5, dash: '6,4'
        }));

        // Plot border
        svg.appendChild(svgRect(margin.left, margin.top, plotW, plotH, { stroke: COLORS.gridStrong, fill: 'none' }));

        // Data points with glow
        for (let i = 0; i < k; i++) {
            const cx = mapX(yi[i]);
            const cy = mapY(sei[i]);
            // Glow
            const ring = svgEl('circle', {
                cx, cy, r: 8, fill: COLORS.accent, opacity: 0.12
            });
            const ptEl = svgEl('circle', {
                cx, cy, r: 5.5, fill: COLORS.accent, stroke: COLORS.bg, 'stroke-width': 1.5, opacity: 0.9
            });

            const ptGroup = svgEl('g', { class: 'funnel-point' });
            ptGroup.appendChild(ring);
            ptGroup.appendChild(ptEl);
            svg.appendChild(ptGroup);

            // Static label for exports
            const shortLabel = results.labels[i].length > 15 ? results.labels[i].substring(0, 13) + '…' : results.labels[i];
            svg.appendChild(svgText(cx + 8, cy - 6, shortLabel, { size: 9, fill: COLORS.textDim }));

            // Rich Tooltip format
            const tipHtml = `
                    <div class="tooltip-header">
                        <span>${results.labels[i]}</span>
                        <span class="tooltip-badge">Embudo</span>
                    </div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="label">Tamaño de Efecto:</span>
                            <span class="value">${fmt(yi[i], 3)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="label">Error Estándar (SE):</span>
                            <span class="value">${fmt(sei[i], 3)}</span>
                        </div>
                    </div>
                `;

            addHtmlTooltip(ptGroup, tipHtml);
        }

        // Trim-and-fill
        if (trimfill && trimfill.k0 > 0) {
            for (let i = k; i < trimfill.filledYi.length; i++) {
                const cx = mapX(trimfill.filledYi[i]);
                const cy = mapY(Math.sqrt(trimfill.filledVi[i]));
                svg.appendChild(svgEl('circle', {
                    cx, cy, r: 5.5, fill: 'none', stroke: COLORS.filledStudy,
                    'stroke-width': 2, 'stroke-dasharray': '3,2', opacity: 0.8
                }));
            }
            // Legend panel
            const lgX = margin.left + 8;
            const lgY = margin.top + 8;
            svg.appendChild(svgRect(lgX, lgY, 130, 48, { fill: COLORS.surfaceAlt, rx: 6, attrs: { opacity: '0.9' } }));
            svg.appendChild(svgEl('circle', { cx: lgX + 12, cy: lgY + 16, r: 4, fill: COLORS.accent }));
            svg.appendChild(svgText(lgX + 22, lgY + 16, 'Observados', { size: 9, fill: COLORS.textDim }));
            svg.appendChild(svgEl('circle', { cx: lgX + 12, cy: lgY + 34, r: 4, fill: 'none', stroke: COLORS.filledStudy, 'stroke-width': 2 }));
            svg.appendChild(svgText(lgX + 22, lgY + 34, `Imputados (k₀=${trimfill.k0})`, { size: 9, fill: COLORS.textDim }));
        }

        container.appendChild(svg);
    }

    // ===== ENHANCED BAUJAT PLOT =====

    function baujatPlot(container, results) {
        const { baujatData } = results;
        if (!baujatData || baujatData.length === 0) return;
        container.innerHTML = '';

        const margin = { top: 55, right: 35, bottom: 60, left: 75 };
        const width = 500;
        const height = 420;
        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;

        const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'chart' });
        svg.style.background = COLORS.bg;
        createDefs(svg);
        svg.appendChild(svgRect(0, 0, width, height, { fill: COLORS.bg }));

        svg.appendChild(svgText(width / 2, 22, 'Baujat Plot — Diagnóstico de Influencia', {
            size: 15, weight: '700', anchor: 'middle', fill: COLORS.text
        }));

        const qiVals = baujatData.map(d => d.x);
        const infVals = baujatData.map(d => d.y);
        const scaleX = niceScale(0, Math.max(...qiVals) * 1.25, 5);
        const scaleY = niceScale(0, Math.max(...infVals) * 1.25, 5);
        const mapX = (v) => margin.left + (v / scaleX.max) * plotW;
        const mapY = (v) => margin.top + plotH - (v / scaleY.max) * plotH;

        // Grid
        for (const v of scaleX.values) {
            const xCoord = mapX(v);
            svg.appendChild(svgLine(xCoord, margin.top, xCoord, margin.top + plotH, { stroke: COLORS.grid }));
            svg.appendChild(svgText(xCoord, margin.top + plotH + 16, fmt(v, 2), { size: 10, anchor: 'middle', fill: COLORS.textMicro, font: MONO }));
        }
        for (const v of scaleY.values) {
            const yCoord = mapY(v);
            svg.appendChild(svgLine(margin.left, yCoord, margin.left + plotW, yCoord, { stroke: COLORS.grid }));
            svg.appendChild(svgText(margin.left - 8, yCoord, fmt(v, 3), { size: 10, anchor: 'end', fill: COLORS.textMicro, font: MONO }));
        }

        // Axis labels
        svg.appendChild(svgText(width / 2, height - 10, 'Contribución a Q (Heterogeneidad)', { size: 11, anchor: 'middle', fill: COLORS.textDim }));
        svg.appendChild(svgText(0, 0, 'Influencia en Efecto Global', {
            size: 11, anchor: 'middle', fill: COLORS.textDim,
            attrs: { transform: `translate(16, ${margin.top + plotH / 2}) rotate(-90)` }
        }));

        // Quadrant means with colored quadrants
        const meanQ = qiVals.reduce((a, b) => a + b, 0) / qiVals.length;
        const meanInf = infVals.reduce((a, b) => a + b, 0) / infVals.length;

        // Danger quadrant (top-right) highlight
        svg.appendChild(svgRect(mapX(meanQ), margin.top, mapX(scaleX.max) - mapX(meanQ), mapY(meanInf) - margin.top, {
            fill: COLORS.dangerDim, attrs: { opacity: '0.3' }
        }));

        // Quadrant lines
        svg.appendChild(svgLine(mapX(meanQ), margin.top, mapX(meanQ), margin.top + plotH, {
            stroke: COLORS.warning, width: 1, dash: '6,4'
        }));
        svg.appendChild(svgLine(margin.left, mapY(meanInf), margin.left + plotW, mapY(meanInf), {
            stroke: COLORS.warning, width: 1, dash: '6,4'
        }));

        // Border
        svg.appendChild(svgRect(margin.left, margin.top, plotW, plotH, { stroke: COLORS.gridStrong, fill: 'none' }));

        // Data points with bubble size reflecting combined metric
        for (const d of baujatData) {
            const cx = mapX(d.x);
            const cy = mapY(d.y);
            const isOutlier = d.x > meanQ && d.y > meanInf;
            const colorPt = isOutlier ? COLORS.danger : COLORS.accent;
            const combined = Math.sqrt(d.x * d.x + d.y * d.y);
            const maxComb = Math.sqrt(Math.max(...qiVals) ** 2 + Math.max(...infVals) ** 2);
            const radius = 4 + (combined / maxComb) * 8;

            // Glow
            const ring = svgEl('circle', {
                cx, cy, r: radius + 5, fill: colorPt, opacity: 0.08
            });
            const ptEl = svgEl('circle', {
                cx, cy, r: radius, fill: colorPt, stroke: COLORS.bg,
                'stroke-width': 1.5, opacity: 0.85
            });

            const ptGroup = svgEl('g', { class: 'baujat-point' });
            ptGroup.appendChild(ring);
            ptGroup.appendChild(ptEl);
            svg.appendChild(ptGroup);

            // Rich Tooltip format
            const tipHtml = `
                    <div class="tooltip-header">
                        <span>${d.label}</span>
                        <span class="tooltip-badge">Baujat</span>
                    </div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="label">Contribución a Q (Het.):</span>
                            <span class="value">${fmt(d.x, 3)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="label">Influencia Global:</span>
                            <span class="value">${fmt(d.y, 4)}</span>
                        </div>
                    </div>
                `;
            addHtmlTooltip(ptGroup, tipHtml);

            // Labels with repulsion-like offset
            if (isOutlier || baujatData.length <= 10) {
                const shortLabel = d.label.length > 15 ? d.label.substring(0, 13) + '…' : d.label;
                const offsetY = isOutlier ? -(radius + 8) : -(radius + 6);
                // Label background
                const lblW = shortLabel.length * 5.5 + 8;
                svg.appendChild(svgRect(cx - lblW / 2, cy + offsetY - 7, lblW, 14, {
                    fill: COLORS.surfaceAlt, rx: 3, attrs: { opacity: '0.85' }
                }));
                svg.appendChild(svgText(cx, cy + offsetY, shortLabel, {
                    size: 9, fill: isOutlier ? COLORS.danger : COLORS.textDim, anchor: 'middle'
                }));
            }
        }

        container.appendChild(svg);
    }

    // ===== ENHANCED LEAVE-ONE-OUT PLOT =====

    function looPlot(container, results) {
        const { loo, pooled, analysisType, effectMeasure } = results;
        if (!loo || loo.length === 0) return;
        container.innerHTML = '';
        const isLog = analysisType === 'binary';
        const k = loo.length;

        const margin = { top: 55, right: 30, bottom: 45, left: 10 };
        const labelWidth = 155;
        const plotWidth = 370;
        const statsWidth = 165;
        const rowHeight = 30;
        const totalHeight = margin.top + (k + 1) * rowHeight + margin.bottom;
        const totalWidth = margin.left + labelWidth + plotWidth + statsWidth + margin.right;

        const svg = svgEl('svg', {
            width: totalWidth, height: totalHeight,
            viewBox: `0 0 ${totalWidth} ${totalHeight}`, class: 'chart'
        });
        svg.style.background = COLORS.bg;
        createDefs(svg);
        svg.appendChild(svgRect(0, 0, totalWidth, totalHeight, { fill: COLORS.bg }));

        const effectLabel = StatsEngine.getEffectLabel(analysisType, effectMeasure);
        svg.appendChild(svgText(totalWidth / 2, 22, `Leave-One-Out — ${effectLabel}`, {
            size: 15, weight: '700', anchor: 'middle', fill: COLORS.text
        }));

        const allVals = [...loo.map(l => l.theta), ...loo.flatMap(l => l.ci), pooled.theta, ...pooled.ci];
        const dMin = Math.min(...allVals);
        const dMax = Math.max(...allVals);
        const pad = (dMax - dMin) * 0.15 || 0.5;
        const scale = niceScale(dMin - pad, dMax + pad, 6);

        const plotLeft = margin.left + labelWidth;
        const plotRight = plotLeft + plotWidth;
        const mapX = (v) => plotLeft + ((v - scale.min) / (scale.max - scale.min)) * plotWidth;

        // Grid
        for (const v of scale.values) {
            const x = mapX(v);
            svg.appendChild(svgLine(x, margin.top, x, margin.top + (k + 1) * rowHeight, { stroke: COLORS.grid }));
            svg.appendChild(svgText(x, margin.top + (k + 1) * rowHeight + 14, isLog ? fmt(Math.exp(v), 2) : fmt(v, 2), {
                size: 9, anchor: 'middle', fill: COLORS.textMicro, font: MONO
            }));
        }

        // Overall CI band with gradient
        const bandLeft = mapX(pooled.ci[0]);
        const bandRight = mapX(pooled.ci[1]);
        svg.appendChild(svgRect(bandLeft, margin.top, bandRight - bandLeft, (k + 1) * rowHeight, {
            fill: 'url(#ciBand)'
        }));

        // Overall effect line with glow
        svg.appendChild(svgLine(mapX(pooled.theta), margin.top, mapX(pooled.theta), margin.top + (k + 1) * rowHeight, {
            stroke: COLORS.accentGlow, width: 4, attrs: { 'stroke-opacity': '0.25' }
        }));
        svg.appendChild(svgLine(mapX(pooled.theta), margin.top, mapX(pooled.theta), margin.top + (k + 1) * rowHeight, {
            stroke: COLORS.accentGlow, width: 2, dash: '6,3'
        }));

        // Headers
        svg.appendChild(svgText(margin.left + 8, margin.top - 8, 'Omitiendo Estudio', { size: 10, weight: '600', fill: COLORS.textDim }));
        svg.appendChild(svgText(plotRight + 8, margin.top - 8, `${effectLabel} [95% CI]`, { size: 10, weight: '600', fill: COLORS.textDim }));

        // Compute max deviation for color coding
        const deviations = loo.map(l => Math.abs(l.theta - pooled.theta));
        const maxDev = Math.max(...deviations) || 1;

        for (let i = 0; i < k; i++) {
            const y = margin.top + i * rowHeight + rowHeight / 2;
            const l = loo[i];
            const devNorm = Math.abs(l.theta - pooled.theta) / maxDev;

            if (i % 2 === 0) {
                svg.appendChild(svgRect(0, margin.top + i * rowHeight, totalWidth, rowHeight, { fill: 'rgba(255,255,255,0.015)' }));
            }

            const truncLabel = l.omitted.length > 22 ? l.omitted.substring(0, 20) + '…' : l.omitted;
            svg.appendChild(svgText(margin.left + 8, y, truncLabel, { size: 10, fill: COLORS.text }));

            // CI glow
            svg.appendChild(svgLine(mapX(l.ci[0]), y, mapX(l.ci[1]), y, {
                stroke: COLORS.accentGlow, width: 5, attrs: { 'stroke-opacity': '0.15', 'stroke-linecap': 'round' }
            }));
            // CI line
            svg.appendChild(svgLine(mapX(l.ci[0]), y, mapX(l.ci[1]), y, { stroke: COLORS.ciLine, width: 1.5, attrs: { 'stroke-linecap': 'round' } }));
            svg.appendChild(svgLine(mapX(l.ci[0]), y - 4, mapX(l.ci[0]), y + 4, { stroke: COLORS.ciLine, width: 1 }));
            svg.appendChild(svgLine(mapX(l.ci[1]), y - 4, mapX(l.ci[1]), y + 4, { stroke: COLORS.ciLine, width: 1 }));

            // Point colored by deviation
            const ptColor = devNorm > 0.7 ? COLORS.danger : devNorm > 0.4 ? COLORS.warning : COLORS.info;
            const ring = svgEl('circle', { cx: mapX(l.theta), cy: y, r: 8, fill: ptColor, opacity: 0.1 });
            const ptEl = svgEl('circle', { cx: mapX(l.theta), cy: y, r: 4.5, fill: ptColor, stroke: COLORS.bg, 'stroke-width': 1 });

            // Group for interaction
            const ptGroup = svgEl('g', { class: 'loo-point' });
            ptGroup.appendChild(ring);
            ptGroup.appendChild(ptEl);
            svg.appendChild(ptGroup);

            const d = isLog ? Math.exp : (v) => v;
            const looTheta = d(l.theta);
            const looCILo = d(l.ci[0]);
            const looCIHi = d(l.ci[1]);

            svg.appendChild(svgText(plotRight + 8, y, `${fmt(looTheta, 2)} [${fmt(looCILo, 2)}, ${fmt(looCIHi, 2)}]`, {
                size: 9, fill: COLORS.textDim, font: MONO
            }));

            // Rich Tooltip format for Leave-One-Out
            const tipHtml = `
                    <div class="tooltip-header">
                        <span>Sin ${l.omitted}</span>
                        <span class="tooltip-badge">Leave-One-Out</span>
                    </div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="label">Efecto Recalculado:</span>
                            <span class="value">${fmt(looTheta, 3)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="label">95% Intervalo conf.:</span>
                            <span class="value">[${fmt(looCILo, 2)}, ${fmt(looCIHi, 2)}]</span>
                        </div>
                        <div class="tooltip-row" style="margin-top:4px;">
                            <span class="label">Desviación:</span>
                            <span class="weight-pill" style="background: ${ptColor}">${fmt(Math.abs(l.theta - pooled.theta), 4)}</span>
                        </div>
                    </div>
                `;
            addHtmlTooltip(ptGroup, tipHtml);
        }

        // Overall row
        const overY = margin.top + k * rowHeight + rowHeight / 2;
        svg.appendChild(svgLine(0, margin.top + k * rowHeight, totalWidth, margin.top + k * rowHeight, { stroke: COLORS.gridStrong }));
        svg.appendChild(svgText(margin.left + 8, overY, 'Modelo Completo', { size: 10, weight: '700', fill: COLORS.accent }));

        const dh = 8;
        const dx = mapX(pooled.theta);
        const dLeft = mapX(pooled.ci[0]);
        const dRight = mapX(pooled.ci[1]);
        svg.appendChild(svgEl('polygon', {
            points: `${dLeft},${overY} ${dx},${overY - dh - 2} ${dRight},${overY} ${dx},${overY + dh + 2}`,
            fill: COLORS.accentGlow, stroke: 'none', opacity: 0.3
        }));
        svg.appendChild(svgEl('polygon', {
            points: `${dLeft},${overY} ${dx},${overY - dh} ${dRight},${overY} ${dx},${overY + dh}`,
            fill: 'url(#diamondGrad)', stroke: COLORS.diamond, 'stroke-width': 1.5
        }));

        const d = isLog ? Math.exp : (v) => v;
        svg.appendChild(svgText(plotRight + 8, overY, `${fmt(d(pooled.theta), 2)} [${fmt(d(pooled.ci[0]), 2)}, ${fmt(d(pooled.ci[1]), 2)}]`, {
            size: 9, weight: '600', fill: COLORS.accent, font: MONO
        }));

        container.appendChild(svg);
    }

    // ===== GALBRAITH / RADIAL PLOT (NEW) =====

    function galbraithPlot(container, results) {
        const { yi, sei, labels, pooled } = results;
        const k = yi.length;
        container.innerHTML = '';

        const margin = { top: 55, right: 35, bottom: 60, left: 75 };
        const width = 520;
        const height = 440;
        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;

        const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'chart' });
        svg.style.background = COLORS.bg;
        createDefs(svg);
        svg.appendChild(svgRect(0, 0, width, height, { fill: COLORS.bg }));

        svg.appendChild(svgText(width / 2, 22, 'Galbraith Plot (Radial)', {
            size: 15, weight: '700', anchor: 'middle', fill: COLORS.text
        }));

        const precision = sei.map(s => 1 / s);
        const stdES = yi.map((y, i) => y / sei[i]);

        const xVals = precision;
        const yVals = stdES;

        const scaleX = niceScale(0, Math.max(...xVals) * 1.15, 5);
        const scaleY = niceScale(Math.min(...yVals, -2) * 1.15, Math.max(...yVals, 2) * 1.15, 6);
        const mapX = (v) => margin.left + (v / scaleX.max) * plotW;
        const mapY = (v) => margin.top + plotH - ((v - scaleY.min) / (scaleY.max - scaleY.min)) * plotH;

        for (const v of scaleX.values) {
            const x = mapX(v);
            svg.appendChild(svgLine(x, margin.top, x, margin.top + plotH, { stroke: COLORS.grid }));
            svg.appendChild(svgText(x, margin.top + plotH + 16, fmt(v, 1), { size: 10, anchor: 'middle', fill: COLORS.textMicro, font: MONO }));
        }
        for (const v of scaleY.values) {
            const y = mapY(v);
            svg.appendChild(svgLine(margin.left, y, margin.left + plotW, y, { stroke: COLORS.grid }));
            svg.appendChild(svgText(margin.left - 8, y, fmt(v, 1), { size: 10, anchor: 'end', fill: COLORS.textMicro, font: MONO }));
        }

        svg.appendChild(svgText(width / 2, height - 10, '1 / SE (Precisión)', { size: 11, anchor: 'middle', fill: COLORS.textDim }));
        svg.appendChild(svgText(0, 0, 'Efecto / SE (Z estandarizado)', {
            size: 11, anchor: 'middle', fill: COLORS.textDim,
            attrs: { transform: `translate(16, ${margin.top + plotH / 2}) rotate(-90)` }
        }));

        // Regression line through origin with slope = pooled theta
        const xEnd = scaleX.max;
        svg.appendChild(svgLine(mapX(0), mapY(0), mapX(xEnd), mapY(pooled.theta * xEnd), {
            stroke: COLORS.accent, width: 1.5, dash: '8,4'
        }));

        // ±1.96 significance bands
        svg.appendChild(svgLine(margin.left, mapY(-1.96), margin.left + plotW, mapY(-1.96), {
            stroke: COLORS.nullLine, width: 1, dash: '4,3'
        }));
        svg.appendChild(svgLine(margin.left, mapY(1.96), margin.left + plotW, mapY(1.96), {
            stroke: COLORS.nullLine, width: 1, dash: '4,3'
        }));
        svg.appendChild(svgText(margin.left + plotW + 3, mapY(1.96), '+1.96', { size: 8, fill: COLORS.textMicro, font: MONO }));
        svg.appendChild(svgText(margin.left + plotW + 3, mapY(-1.96), '-1.96', { size: 8, fill: COLORS.textMicro, font: MONO }));

        // Zero line
        if (scaleY.min < 0 && scaleY.max > 0) {
            svg.appendChild(svgLine(margin.left, mapY(0), margin.left + plotW, mapY(0), {
                stroke: COLORS.gridStrong, width: 1
            }));
        }

        svg.appendChild(svgRect(margin.left, margin.top, plotW, plotH, { stroke: COLORS.gridStrong, fill: 'none' }));

        // Points
        for (let i = 0; i < k; i++) {
            const cx = mapX(xVals[i]);
            const cy = mapY(yVals[i]);
            const isOutlier = Math.abs(yVals[i] - pooled.theta * xVals[i]) > 2;
            const ptColor = isOutlier ? COLORS.danger : COLORS.accent;
            const ring = svgEl('circle', { cx, cy, r: 7, fill: ptColor, opacity: 0.1 });
            const ptEl = svgEl('circle', { cx, cy, r: 5, fill: ptColor, stroke: COLORS.bg, 'stroke-width': 1.5, opacity: 0.9 });

            const ptGroup = svgEl('g', { class: 'galbraith-point' });
            ptGroup.appendChild(ring);
            ptGroup.appendChild(ptEl);
            svg.appendChild(ptGroup);

            // Static labels for exports
            const shortLabel = labels[i].length > 15 ? labels[i].substring(0, 13) + '…' : labels[i];
            svg.appendChild(svgText(cx + 8, cy - 6, shortLabel, { size: 9, fill: ptColor }));

            // Rich Tooltip format
            const tipHtml = `
                    <div class="tooltip-header">
                        <span>${labels[i]}</span>
                        <span class="tooltip-badge">Galbraith</span>
                    </div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="label">Efecto / SE (Z):</span>
                            <span class="value">${fmt(yVals[i], 2)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="label">1 / SE (Precisión):</span>
                            <span class="value">${fmt(xVals[i], 2)}</span>
                        </div>
                    </div>
                `;
            addHtmlTooltip(ptGroup, tipHtml);

            if (isOutlier || k <= 8) {
                const shortLabel = labels[i].length > 12 ? labels[i].substring(0, 10) + '…' : labels[i];
                svg.appendChild(svgText(cx + 8, cy - 6, shortLabel, { size: 8, fill: ptColor }));
            }
        }

        container.appendChild(svg);
    }

    // ===== BUBBLE PLOT (META-REGRESSION) =====
    function bubblePlot(container, results) {
        const reg = results.regressionResults;
        if (!reg) return;

        container.innerHTML = '';

        const margin = { top: 40, right: 30, bottom: 50, left: 60 };
        const width = 600;
        const height = 400;
        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;

        const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'chart' });
        svg.style.background = COLORS.bg;
        createDefs(svg);
        svg.appendChild(svgRect(0, 0, width, height, { fill: COLORS.bg }));

        // Title
        svg.appendChild(svgText(width / 2, 22, 'Meta-Regresión (Bubble Plot)', {
            size: 15, weight: '700', anchor: 'middle', fill: COLORS.text
        }));

        const xVals = reg.x;
        const yVals = reg.yi;
        const weights = reg.weights;

        // X scale mapping
        const minX = Math.min(...xVals);
        const maxX = Math.max(...xVals);
        const padX = (maxX - minX) * 0.1 || 1;
        const scaleX = niceScale(minX - padX, maxX + padX, 6);
        const mapX = (v) => margin.left + ((v - scaleX.min) / (scaleX.max - scaleX.min)) * plotW;

        // Y scale mapping
        const minY = Math.min(...yVals, reg.b0 + reg.b1 * scaleX.min);
        const maxY = Math.max(...yVals, reg.b0 + reg.b1 * scaleX.max);
        const padY = (maxY - minY) * 0.1 || 1;
        const scaleY = niceScale(minY - padY, maxY + padY, 6);
        const mapY = (v) => margin.top + plotH - ((v - scaleY.min) / (scaleY.max - scaleY.min)) * plotH;

        // Draw axes and grid
        for (const v of scaleX.values) {
            const x = mapX(v);
            svg.appendChild(svgLine(x, margin.top, x, margin.top + plotH, { stroke: COLORS.grid }));
            svg.appendChild(svgText(x, margin.top + plotH + 16, fmt(v, 2), { size: 10, anchor: 'middle', fill: COLORS.textMicro, font: MONO }));
        }
        for (const v of scaleY.values) {
            const y = mapY(v);
            svg.appendChild(svgLine(margin.left, y, margin.left + plotW, y, { stroke: COLORS.grid }));
            svg.appendChild(svgText(margin.left - 8, y, fmt(v, 2), { size: 10, anchor: 'end', fill: COLORS.textMicro, font: MONO }));
        }

        // Axes Labels
        svg.appendChild(svgText(width / 2, height - 10, 'Moderador Continuo', { size: 11, anchor: 'middle', fill: COLORS.textDim }));
        svg.appendChild(svgText(0, 0, 'Tamaño de Efecto', {
            size: 11, anchor: 'middle', fill: COLORS.textDim,
            attrs: { transform: `translate(16, ${margin.top + plotH / 2}) rotate(-90)` }
        }));

        // Draw Regression Line
        const yLineStart = reg.b0 + reg.b1 * scaleX.min;
        const yLineEnd = reg.b0 + reg.b1 * scaleX.max;
        svg.appendChild(svgLine(mapX(scaleX.min), mapY(yLineStart), mapX(scaleX.max), mapY(yLineEnd), {
            stroke: COLORS.accent, width: 2
        }));

        // Border
        svg.appendChild(svgRect(margin.left, margin.top, plotW, plotH, { stroke: COLORS.gridStrong, fill: 'none' }));

        // Draw Bubbles
        const maxW = Math.max(...weights);
        const minW = Math.min(...weights);

        for (let i = 0; i < reg.k; i++) {
            const cx = mapX(xVals[i]);
            const cy = mapY(yVals[i]);

            // Normalize weights for visible radius (e.g. min 3px, max 18px)
            let normW = 0.5;
            if (maxW > minW) {
                normW = (weights[i] - minW) / (maxW - minW);
            }
            const r = 4 + (normW * 14);

            const ptGroup = svgEl('g', { class: 'bubble-point' });
            ptGroup.style.cursor = 'pointer';
            ptGroup.style.pointerEvents = 'all';

            // Outer semi-transparent bubble
            ptGroup.appendChild(svgEl('circle', {
                cx, cy, r: Math.max(r, 12), fill: 'transparent' // invisible hit area
            }));
            ptGroup.appendChild(svgEl('circle', {
                cx, cy, r, fill: COLORS.accent, opacity: 0.3
            }));
            // Inner core dot
            ptGroup.appendChild(svgEl('circle', {
                cx, cy, r: 2, fill: COLORS.accent, opacity: 0.8
            }));

            svg.appendChild(ptGroup);

            // Label for export
            const shortLabel = results.labels[i].length > 15 ? results.labels[i].substring(0, 13) + '…' : results.labels[i];
            svg.appendChild(svgText(cx + r + 2, cy - r, shortLabel, { size: 9, fill: COLORS.textDim }));

            // Tooltip
            const tipHtml = `
                    <div class="tooltip-header">
                        <span>${results.labels[i]}</span>
                        <span class="tooltip-badge">Burbuja</span>
                    </div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="label">Moderador (X):</span>
                            <span class="value">${fmt(xVals[i], 3)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="label">Efecto (Y):</span>
                            <span class="value">${fmt(yVals[i], 3)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="label">Peso WLS:</span>
                            <span class="value">${fmt(weights[i], 2)}</span>
                        </div>
                    </div>
                `;
            addHtmlTooltip(ptGroup, tipHtml);
        }

        container.appendChild(svg);
    }

    // ===== SVG TO PNG EXPORT =====

    function svgToPng(svgElement, filename = 'chart.png', results = null) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const scale = 2;

        let extraHeight = 0;
        let labelsText = [];
        let metadataText = "";

        if (results && results.labels) {
            extraHeight = 60; // Base extra height
            // Format labels into multiple lines if needed to fit width
            const allLabels = results.labels.join(', ');
            labelsText = wrapText(ctx, allLabels, (svgElement.getAttribute('width') * scale) - 40, 14 * scale);
            extraHeight += (labelsText.length * 16);

            const modelDesc = results.pooled?.model === 'random' ? 'Efectos Aleatorios' : 'Efectos Fijos';
            const k = results.labels.length;
            metadataText = `Metaanálisis (${modelDesc}) | k = ${k}`;
        }

        canvas.width = svgElement.getAttribute('width') * scale;
        canvas.height = (parseFloat(svgElement.getAttribute('height')) + extraHeight) * scale;

        // We do not scale the entire ctx because we want to manually place things at the bottom
        // Instead, we scale when drawing the image.

        return new Promise((resolve) => {
            img.onload = () => {
                // Fill background white
                ctx.fillStyle = COLORS.bg; // #0d1117 (dark theme bg)
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw the SVG
                ctx.drawImage(img, 0, 0, svgElement.getAttribute('width') * scale, svgElement.getAttribute('height') * scale);

                // Draw metadata if present
                if (results && results.labels) {
                    const startY = (parseFloat(svgElement.getAttribute('height')) + 20) * scale;

                    // Separator line
                    ctx.beginPath();
                    ctx.moveTo(20, startY - 10);
                    ctx.lineTo(canvas.width - 20, startY - 10);
                    ctx.strokeStyle = '#30363d';
                    ctx.lineWidth = 1 * scale;
                    ctx.stroke();

                    // Model Metadata
                    ctx.fillStyle = '#8b949e';
                    ctx.font = `bold ${12 * scale}px "Inter", sans-serif`;
                    ctx.fillText(metadataText, 20, startY + (12 * scale));

                    // Studies
                    ctx.font = `normal ${10 * scale}px "Inter", sans-serif`;
                    ctx.fillStyle = '#6e7681';
                    let currentY = startY + (28 * scale);
                    ctx.fillText("Estudios incluidos: ", 20, currentY);
                    currentY += (14 * scale);

                    labelsText.forEach(line => {
                        ctx.fillText(line, 20, currentY);
                        currentY += (14 * scale);
                    });
                }

                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    resolve();
                }, 'image/png');
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
        });
    }

    // Helper to wrap text loosely for Canvas
    function wrapText(context, text, maxWidth, fontSize) {
        context.font = fontSize + 'px "Inter", sans-serif';
        const words = text.split(', ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + ", " + word).width;
            if (width < maxWidth) {
                currentLine += ", " + word;
            } else {
                lines.push(currentLine + ",");
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    return { forestPlot, funnelPlot, baujatPlot, looPlot, galbraithPlot, bubblePlot, svgToPng };
})();
