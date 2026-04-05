/**
 * MetaAnalysis Pro — Statistical Engine
 * 
 * Pure JavaScript implementation of meta-analysis statistical methods.
 * Implements: effect size calculation, pooling (fixed/random), heterogeneity,
 * publication bias tests, sensitivity analysis, and meta-regression.
 */

const StatsEngine = (() => {
    // ===== CONSTANTS =====
    const Z_975 = 1.959964; // z for 95% CI
    const Z_95 = 1.644854;

    // ===== UTILITY FUNCTIONS =====

    /** Normal CDF (Abramowitz and Stegun approximation) */
    function pnorm(z) {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        const x = Math.abs(z) / Math.sqrt(2);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1.0 + sign * y);
    }

    /** Two-tailed p-value from z */
    function pFromZ(z) {
        return 2 * (1 - pnorm(Math.abs(z)));
    }

    /** Chi-squared CDF (regularized incomplete gamma) */
    function pchisq(x, df) {
        if (x <= 0) return 0;
        return gammainc(df / 2, x / 2);
    }

    /** Regularized lower incomplete gamma function */
    function gammainc(a, x) {
        if (x < 0) return 0;
        if (x === 0) return 0;
        if (x < a + 1) {
            // Series expansion
            let sum = 1 / a;
            let term = 1 / a;
            for (let n = 1; n < 200; n++) {
                term *= x / (a + n);
                sum += term;
                if (Math.abs(term) < 1e-12 * Math.abs(sum)) break;
            }
            return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
        } else {
            // Continued fraction
            let f = 1e-30;
            let c = 1e-30;
            let d = 1 / (x + 1 - a);
            let h = d;
            for (let i = 1; i < 200; i++) {
                const an = -i * (i - a);
                const bn = x + 2 * i + 1 - a;
                d = bn + an * d;
                if (Math.abs(d) < 1e-30) d = 1e-30;
                c = bn + an / c;
                if (Math.abs(c) < 1e-30) c = 1e-30;
                d = 1 / d;
                const del = d * c;
                h *= del;
                if (Math.abs(del - 1) < 1e-12) break;
            }
            return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
        }
    }

    /** Log-gamma function (Stirling approximation) */
    function lgamma(x) {
        const cof = [76.18009172947146, -86.50532032941677, 24.01409824083091,
            -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
        let y = x, tmp = x + 5.5;
        tmp -= (x + 0.5) * Math.log(tmp);
        let ser = 1.000000000190015;
        for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
        return -tmp + Math.log(2.5066282746310005 * ser / x);
    }

    /** Gamma function */
    function gamma(x) {
        return Math.exp(lgamma(x));
    }

    // ===== EFFECT SIZE CALCULATIONS =====

    /**
     * Hedges' g (standardized mean difference)
     * Includes small-sample bias correction (J)
     */
    function hedgesG(m1, sd1, n1, m2, sd2, n2) {
        const pooledSD = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2));
        const d = (m1 - m2) / pooledSD; // Cohen's d
        const df = n1 + n2 - 2;
        const J = 1 - (3 / (4 * df - 1)); // correction factor
        const g = d * J;
        const vg = J * J * ((n1 + n2) / (n1 * n2) + (d * d) / (2 * (n1 + n2)));
        return { yi: g, vi: vg, sei: Math.sqrt(vg) };
    }

    /** Raw mean difference (MD) */
    function meanDiff(m1, sd1, n1, m2, sd2, n2) {
        const md = m1 - m2;
        const v = (sd1 * sd1) / n1 + (sd2 * sd2) / n2;
        return { yi: md, vi: v, sei: Math.sqrt(v) };
    }

    /** Log Odds Ratio from 2x2 table */
    function logOR(e1, n1, e2, n2) {
        // Apply 0.5 continuity correction if any cell is 0
        let a = e1, b = n1 - e1, c = e2, d = n2 - e2;
        if (a === 0 || b === 0 || c === 0 || d === 0) {
            a += 0.5; b += 0.5; c += 0.5; d += 0.5;
        }
        const yi = Math.log((a * d) / (b * c));
        const vi = 1 / a + 1 / b + 1 / c + 1 / d;
        return { yi, vi, sei: Math.sqrt(vi) };
    }

    /** Log Risk Ratio from 2x2 table */
    function logRR(e1, n1, e2, n2) {
        let a = e1, c = e2;
        if (a === 0) a = 0.5;
        if (c === 0) c = 0.5;
        const p1 = a / n1;
        const p2 = c / n2;
        const yi = Math.log(p1 / p2);
        const vi = (1 - p1) / (a) + (1 - p2) / (c);
        return { yi, vi, sei: Math.sqrt(vi) };
    }

    /** Fisher's z transformation of correlation */
    function fisherZ(r, n) {
        const z = 0.5 * Math.log((1 + r) / (1 - r));
        const v = 1 / (n - 3);
        return { yi: z, vi: v, sei: Math.sqrt(v) };
    }

    /** Back-transform Fisher's z to r */
    function zToR(z) {
        return (Math.exp(2 * z) - 1) / (Math.exp(2 * z) + 1);
    }

    // ===== POOLING MODELS =====

    /**
     * Fixed-effects model (inverse-variance)
     */
    function fixedEffects(yi, vi) {
        const k = yi.length;
        const wi = vi.map(v => 1 / v);
        const sumW = wi.reduce((a, b) => a + b, 0);
        const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;
        const seTheta = Math.sqrt(1 / sumW);
        const zVal = theta / seTheta;
        const pVal = pFromZ(zVal);
        const ciLower = theta - Z_975 * seTheta;
        const ciUpper = theta + Z_975 * seTheta;

        // Cochran's Q
        const Q = wi.reduce((s, w, i) => s + w * (yi[i] - theta) ** 2, 0);
        const dfQ = k - 1;
        const pQ = 1 - pchisq(Q, dfQ);

        return {
            theta, se: seTheta, z: zVal, p: pVal,
            ci: [ciLower, ciUpper],
            Q, dfQ, pQ,
            k,
            weights: wi.map(w => w / sumW),
            model: 'fixed'
        };
    }

    /**
     * Random-effects model (DerSimonian-Laird)
     */
    function randomEffects(yi, vi) {
        const k = yi.length;
        const wi = vi.map(v => 1 / v);
        const sumW = wi.reduce((a, b) => a + b, 0);
        const sumW2 = wi.reduce((a, w) => a + w * w, 0);

        // Fixed-effects estimate for Q calculation
        const thetaFE = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;
        const Q = wi.reduce((s, w, i) => s + w * (yi[i] - thetaFE) ** 2, 0);
        const dfQ = k - 1;
        const pQ = 1 - pchisq(Q, dfQ);

        // DerSimonian-Laird tau² estimate
        const C = sumW - sumW2 / sumW;
        let tau2 = Math.max(0, (Q - dfQ) / C);

        // Random-effects weights
        const wiRE = vi.map(v => 1 / (v + tau2));
        const sumWRE = wiRE.reduce((a, b) => a + b, 0);
        const theta = wiRE.reduce((s, w, i) => s + w * yi[i], 0) / sumWRE;
        const seTheta = Math.sqrt(1 / sumWRE);
        const zVal = theta / seTheta;
        const pVal = pFromZ(zVal);
        const ciLower = theta - Z_975 * seTheta;
        const ciUpper = theta + Z_975 * seTheta;

        // I²
        const I2 = Math.max(0, (Q - dfQ) / Q * 100);
        const tau = Math.sqrt(tau2);

        // H²
        const H2 = Q / dfQ;

        // Prediction interval
        const sePred = Math.sqrt(tau2 + seTheta * seTheta);
        const piLower = theta - Z_975 * Math.sqrt(tau2 + seTheta * seTheta);
        const piUpper = theta + Z_975 * Math.sqrt(tau2 + seTheta * seTheta);

        return {
            theta, se: seTheta, z: zVal, p: pVal,
            ci: [ciLower, ciUpper],
            pi: [piLower, piUpper],
            Q, dfQ, pQ,
            tau2, tau, I2, H2,
            k,
            weights: wiRE.map(w => w / sumWRE),
            model: 'random'
        };
    }

    // ===== PUBLICATION BIAS TESTS =====

    /**
     * Egger's regression test for funnel plot asymmetry
     * Weighted regression of yi on 1/sei (precision)
     */
    function eggerTest(yi, sei) {
        const k = yi.length;
        if (k < 3) return { intercept: NaN, se: NaN, t: NaN, p: NaN, df: k - 2, message: 'Need ≥ 3 studies' };

        // Standardized effect: zi = yi / sei
        // Regress zi on precision (1/sei)
        const precision = sei.map(s => 1 / s);
        const zi = yi.map((y, i) => y / sei[i]);

        // Weighted least squares (weights = 1)
        const n = k;
        const sumX = precision.reduce((a, b) => a + b, 0);
        const sumY = zi.reduce((a, b) => a + b, 0);
        const sumXY = precision.reduce((s, x, i) => s + x * zi[i], 0);
        const sumX2 = precision.reduce((s, x) => s + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Residuals
        const residuals = zi.map((z, i) => z - (intercept + slope * precision[i]));
        const sse = residuals.reduce((s, r) => s + r * r, 0);
        const mse = sse / (n - 2);
        const seIntercept = Math.sqrt(mse * sumX2 / (n * sumX2 - sumX * sumX));

        const t = intercept / seIntercept;
        const df = n - 2;
        // Approximate p-value from t-distribution using normal for large df
        const p = pFromZ(t);

        return { intercept, se: seIntercept, t, p, df };
    }

    /**
     * Begg's rank correlation test
     * Kendall's tau between effect sizes and variances
     */
    function beggTest(yi, vi) {
        const k = yi.length;
        if (k < 3) return { tau: NaN, p: NaN, message: 'Need ≥ 3 studies' };

        // Standardized residuals
        const wi = vi.map(v => 1 / v);
        const sumW = wi.reduce((a, b) => a + b, 0);
        const theta = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;
        const residuals = yi.map(y => y - theta);

        // Kendall's tau between residuals and vi
        let concordant = 0, discordant = 0;
        for (let i = 0; i < k - 1; i++) {
            for (let j = i + 1; j < k; j++) {
                const sign = (residuals[i] - residuals[j]) * (vi[i] - vi[j]);
                if (sign > 0) concordant++;
                else if (sign < 0) discordant++;
            }
        }
        const tau = (concordant - discordant) / (k * (k - 1) / 2);
        const seTau = Math.sqrt((2 * (2 * k + 5)) / (9 * k * (k - 1)));
        const z = tau / seTau;
        const p = pFromZ(z);

        return { tau, z, p };
    }

    /**
     * Trim-and-fill method (L0 estimator)
     */
    function trimAndFill(yi, vi, modelFn) {
        const k = yi.length;
        const result = modelFn(yi, vi);
        const theta0 = result.theta;

        // Rank-based estimator for number of missing studies
        const centered = yi.map(y => y - theta0);
        const absCentered = centered.map(Math.abs);

        // Sort by absolute centered values
        const indices = Array.from({ length: k }, (_, i) => i);
        indices.sort((a, b) => absCentered[a] - absCentered[b]);

        // Count studies on the side with fewer studies
        const rightCount = centered.filter(c => c > 0).length;
        const leftCount = centered.filter(c => c < 0).length;
        const side = rightCount > leftCount ? 1 : -1; // side to trim

        // L0 estimator
        const ranks = new Array(k);
        indices.forEach((idx, rank) => { ranks[idx] = rank + 1; });

        const Ti = centered.map((c, i) => {
            if (c * side > 0) return ranks[i];
            return 0;
        });

        let gamma = Ti.filter(t => t > 0);
        gamma.sort((a, b) => a - b);

        // Estimate k0
        let k0 = 0;
        if (gamma.length > 0) {
            const Sn = gamma.reduce((s, r) => s + (4 * r - k - 1) ** 2, 0);
            k0 = Math.max(0, Math.round((Sn / (2 * k) - 1)));
        }

        if (k0 === 0) {
            return {
                k0: 0,
                thetaAdj: theta0,
                ciAdj: result.ci,
                filledYi: [...yi],
                filledVi: [...vi],
                message: 'No missing studies detected'
            };
        }

        // Create imputed ("filled") studies
        const sortedByEffect = indices.sort((a, b) => {
            const ea = centered[a] * side;
            const eb = centered[b] * side;
            return eb - ea; // largest on the trim side first
        });

        const filledYi = [...yi];
        const filledVi = [...vi];
        for (let i = 0; i < Math.min(k0, k); i++) {
            const idx = sortedByEffect[i];
            filledYi.push(2 * theta0 - yi[idx]); // mirror
            filledVi.push(vi[idx]);
        }

        const adjustedResult = modelFn(filledYi, filledVi);

        return {
            k0,
            thetaAdj: adjustedResult.theta,
            ciAdj: adjustedResult.ci,
            seAdj: adjustedResult.se,
            filledYi,
            filledVi,
            side: side > 0 ? 'right' : 'left',
            message: `${k0} imputed studies on the ${side > 0 ? 'left' : 'right'}`
        };
    }

    /**
     * Rosenthal's fail-safe N
     */
    function failsafeN(yi, vi) {
        const k = yi.length;
        const zi = yi.map((y, i) => y / Math.sqrt(vi[i]));
        const sumZ = zi.reduce((a, b) => a + b, 0);
        const Zc = Z_95; // critical z = 1.645 for alpha = 0.05 one-sided
        const fsn = Math.max(0, Math.round((sumZ / Zc) ** 2 - k));
        return { fsn, sumZ, k };
    }

    // ===== SENSITIVITY ANALYSIS =====

    /**
     * Leave-one-out analysis
     */
    function leaveOneOut(yi, vi, labels, modelFn) {
        const results = [];
        for (let i = 0; i < yi.length; i++) {
            const yiReduced = yi.filter((_, j) => j !== i);
            const viReduced = vi.filter((_, j) => j !== i);
            const res = modelFn(yiReduced, viReduced);
            results.push({
                omitted: labels[i],
                omittedIndex: i,
                theta: res.theta,
                ci: res.ci,
                se: res.se,
                I2: res.I2 || 0,
                tau2: res.tau2 || 0,
                Q: res.Q,
                pQ: res.pQ
            });
        }
        return results;
    }

    /**
     * Influence diagnostics
     * Returns externally studentized residuals and hat values
     */
    function influenceDiagnostics(yi, vi, result) {
        const k = yi.length;
        const theta = result.theta;
        const tau2 = result.tau2 || 0;
        const wi = vi.map(v => 1 / (v + tau2));
        const sumW = wi.reduce((a, b) => a + b, 0);
        const hi = wi.map(w => w / sumW); // hat values

        const residuals = yi.map(y => y - theta);
        const stdResiduals = residuals.map((r, i) => {
            const vr = (vi[i] + tau2) * (1 - hi[i]);
            return r / Math.sqrt(vr);
        });

        // Cook's distance analog
        const cooksD = residuals.map((r, i) => {
            return hi[i] * stdResiduals[i] ** 2 / (1 - hi[i]);
        });

        return {
            residuals,
            stdResiduals,
            hatValues: hi,
            cooksD,
            weights: wi.map(w => w / sumW * 100)
        };
    }

    /**
     * Subgroup analysis
     * Groups studies by a categorical moderator
     */
    function subgroupAnalysis(yi, vi, groups, labels, modelFn) {
        const uniqueGroups = [...new Set(groups)];
        const groupResults = {};
        let Qwithin = 0;

        for (const g of uniqueGroups) {
            const indices = groups.map((grp, i) => grp === g ? i : -1).filter(i => i >= 0);
            if (indices.length < 2) {
                groupResults[g] = { k: indices.length, message: 'Insufficient studies' };
                continue;
            }
            const yiGroup = indices.map(i => yi[i]);
            const viGroup = indices.map(i => vi[i]);
            const res = modelFn(yiGroup, viGroup);
            res.studies = indices.map(i => labels[i]);
            groupResults[g] = res;
            Qwithin += res.Q;
        }

        // Overall result
        const overall = modelFn(yi, vi);
        const Qbetween = overall.Q - Qwithin;
        const dfBetween = uniqueGroups.length - 1;
        const pBetween = 1 - pchisq(Qbetween, dfBetween);

        return {
            groups: groupResults,
            Qbetween,
            dfBetween,
            pBetween,
            Qwithin,
            overall
        };
    }

    /**
     * Meta-regression (simple weighted least squares)
     */
    function metaRegression(yi, vi, xi, tau2 = 0) {
        const k = yi.length;
        if (k < 3) return { slope: NaN, intercept: NaN, p: NaN, message: 'Need ≥ 3 studies' };

        const wi = vi.map(v => 1 / (v + tau2));
        const sumW = wi.reduce((a, b) => a + b, 0);
        const sumWX = wi.reduce((s, w, i) => s + w * xi[i], 0);
        const sumWY = wi.reduce((s, w, i) => s + w * yi[i], 0);
        const sumWX2 = wi.reduce((s, w, i) => s + w * xi[i] * xi[i], 0);
        const sumWXY = wi.reduce((s, w, i) => s + w * xi[i] * yi[i], 0);

        const denom = sumW * sumWX2 - sumWX * sumWX;
        const slope = (sumW * sumWXY - sumWX * sumWY) / denom;
        const intercept = (sumWY - slope * sumWX) / sumW;

        const seSlope = Math.sqrt(sumW / denom);
        const seIntercept = Math.sqrt(sumWX2 / denom);

        const zSlope = slope / seSlope;
        const pSlope = pFromZ(zSlope);
        const zIntercept = intercept / seIntercept;
        const pIntercept = pFromZ(zIntercept);

        // Q_model (test of moderators)
        const Qmodel = zSlope * zSlope;
        const pModel = pFromZ(Math.abs(zSlope));

        // R² (proportion of heterogeneity explained)
        const thetaFE = sumWY / sumW;
        const Qtotal = wi.reduce((s, w, i) => s + w * (yi[i] - thetaFE) ** 2, 0);
        const predicted = xi.map(x => intercept + slope * x);
        const Qresid = wi.reduce((s, w, i) => s + w * (yi[i] - predicted[i]) ** 2, 0);
        const R2 = Math.max(0, (Qtotal - Qresid) / Qtotal * 100);

        return {
            intercept, seIntercept, zIntercept, pIntercept,
            slope, seSlope, zSlope, pSlope,
            Qmodel, pModel, R2,
            predicted,
            k
        };
    }

    /**
     * Bootstrap Meta-Analysis (Resampling with replacement)
     * Calculates an empirical 95% Confidence Interval
     */
    function bootstrapMetaAnalysis(yi, vi, modelFn, iterations = 1000) {
        const k = yi.length;
        if (k < 3) return null; // Too few studies for meaningful bootstrap

        const bootstrapThetas = [];

        for (let i = 0; i < iterations; i++) {
            // Resample with replacement
            const sampleYi = [];
            const sampleVi = [];
            for (let j = 0; j < k; j++) {
                const randIdx = Math.floor(Math.random() * k);
                sampleYi.push(yi[randIdx]);
                sampleVi.push(vi[randIdx]);
            }

            // Calculate pooled effect for this bootstrap sample
            try {
                const samplePooled = modelFn(sampleYi, sampleVi);
                bootstrapThetas.push(samplePooled.theta);
            } catch (e) {
                // Ignore failed iterations (e.g., division by zero if all weights 0)
            }
        }

        if (bootstrapThetas.length < iterations * 0.95) return null; // Too many failures

        // Sort ascending
        bootstrapThetas.sort((a, b) => a - b);

        // Extract 2.5th and 97.5th percentiles (95% CI)
        const lowIdx = Math.floor(bootstrapThetas.length * 0.025);
        const highIdx = Math.floor(bootstrapThetas.length * 0.975) - 1;

        return [bootstrapThetas[lowIdx], bootstrapThetas[highIdx]];
    }

    // ===== MAIN COMPUTATION PIPELINE =====

    /**
     * Compute full meta-analysis from study data
     * @param {Array} studies - [{study, ...data fields}]
     * @param {string} analysisType - 'continuous'|'binary'|'correlation'|'precalc'
     * @param {string} effectMeasure - 'SMD'|'MD'|'OR'|'RR'
     * @param {string} model - 'fixed'|'random'
     */
    function computeAll(studies, analysisType, effectMeasure, model) {
        // 1. Compute effect sizes
        const effects = computeEffectSizes(studies, analysisType, effectMeasure);
        const yi = effects.map(e => e.yi);
        const vi = effects.map(e => e.vi);
        const sei = effects.map(e => e.sei);
        const labels = studies.map(s => s.study);

        // 2. Pool
        const modelFn = model === 'fixed' ? fixedEffects : randomEffects;
        const pooled = modelFn(yi, vi);

        // 3. Bootstrapping for robust CIs
        pooled.ciBootstrap = bootstrapMetaAnalysis(yi, vi, modelFn, 1000);

        // 4. Heterogeneity (already in pooled for RE)

        // 5. Publication bias
        const egger = eggerTest(yi, sei);
        const begg = beggTest(yi, vi);
        const trimfill = trimAndFill(yi, vi, modelFn);
        const fsn = failsafeN(yi, vi);

        // 5. Sensitivity
        const loo = leaveOneOut(yi, vi, labels, modelFn);
        const influence = influenceDiagnostics(yi, vi, pooled);

        // 6. Baujat data
        const baujatData = computeBaujatData(yi, vi, pooled, labels);

        // 7. Moderator Analysis (Subgroups or Meta-Regression)
        const subgroupsRaw = studies.map(s => (s.subgroup !== undefined && s.subgroup !== null) ? String(s.subgroup).trim() : '');
        let subgroupResults = null;
        let regressionResults = null;

        const modType = document.getElementById('moderator-type') ? document.getElementById('moderator-type').value : 'none';

        if (modType === 'categorical') {
            const definedGroups = subgroupsRaw.filter(g => g !== '');
            const uniqueSubgroups = [...new Set(definedGroups)];
            if (uniqueSubgroups.length > 1 && uniqueSubgroups.length < yi.length) {
                // Pre-process: replace empty subgroups with 'No Definido'
                const cleanGroups = subgroupsRaw.map(g => g === '' ? 'No Definido' : g);
                subgroupResults = performSubgroupAnalysis(yi, vi, cleanGroups, model);
            }
        } else if (modType === 'continuous') {
            try {
                const moderatorValues = [];
                const validIndices = [];

                subgroupsRaw.forEach((val, i) => {
                    // Make sure we handle comma decimals if they exist
                    const parsed = parseFloat(String(val).replace(',', '.'));
                    if (!isNaN(parsed)) {
                        moderatorValues.push(parsed);
                        validIndices.push(i);
                    }
                });

                if (validIndices.length >= 3) {
                    // Extract only valid studies for regression
                    const regYi = validIndices.map(i => yi[i]);
                    const regVi = validIndices.map(i => vi[i]);
                    regressionResults = performMetaRegression(regYi, regVi, moderatorValues, model);
                } else {
                    console.warn('Meta-Regresión: Se necesitan al menos 3 estudios con valores numéricos continuos.');
                }
            } catch (err) {
                console.error("Error internally in MetaRegression block:", err);
                throw err;
            }
        }

        return {
            effects,
            labels,
            yi, vi, sei,
            pooled,
            egger, begg, trimfill, fsn,
            loo, influence,
            baujatData,
            subgroupResults,
            regressionResults,
            analysisType, effectMeasure, model
        };
    }

    function computeEffectSizes(studies, analysisType, effectMeasure) {
        return studies.map(s => {
            let result;
            switch (analysisType) {
                case 'continuous':
                    if (effectMeasure === 'MD') {
                        result = meanDiff(s.mean_exp, s.sd_exp, s.n_exp, s.mean_ctrl, s.sd_ctrl, s.n_ctrl);
                    } else {
                        result = hedgesG(s.mean_exp, s.sd_exp, s.n_exp, s.mean_ctrl, s.sd_ctrl, s.n_ctrl);
                    }
                    break;
                case 'binary':
                    if (effectMeasure === 'RR') {
                        result = logRR(s.events_exp, s.n_exp, s.events_ctrl, s.n_ctrl);
                    } else {
                        result = logOR(s.events_exp, s.n_exp, s.events_ctrl, s.n_ctrl);
                    }
                    break;
                case 'correlation':
                    result = fisherZ(s.r, s.n);
                    result.rOriginal = s.r;
                    break;
                case 'precalc':
                    if (s.se !== undefined && s.se !== null && !isNaN(s.se)) {
                        result = { yi: s.es, vi: s.se * s.se, sei: s.se };
                    } else {
                        // From CI
                        const se = (s.ci_upper - s.ci_lower) / (2 * Z_975);
                        result = { yi: s.es, vi: se * se, sei: se };
                    }
                    break;
                default:
                    throw new Error(`Unknown analysis type: ${analysisType}`);
            }
            return result;
        });
    }

    function computeBaujatData(yi, vi, pooled, labels) {
        const data = [];
        const { Q, theta } = pooled; // global params

        // Fixed effects overall used as reference for Baujat
        // Q contribution is w_i * (y_i - theta_FE)^2
        const wi = vi.map(v => 1 / v);
        const sumW = wi.reduce((a, b) => a + b, 0);
        const thetaFE = wi.reduce((s, w, i) => s + w * yi[i], 0) / sumW;

        for (let i = 0; i < yi.length; i++) {
            const qCont = wi[i] * (yi[i] - thetaFE) ** 2;

            // Influence: re-calculate theta without this study
            const yiLoo = [...yi]; yiLoo.splice(i, 1);
            const viLoo = [...vi]; viLoo.splice(i, 1);
            const wiLoo = yiLoo.map((_, idx) => 1 / viLoo[idx]);
            const sumWLoo = wiLoo.reduce((a, b) => a + b, 0);
            const thetaLoo = wiLoo.reduce((s, w, idx) => s + w * yiLoo[idx], 0) / sumWLoo;

            const inf = (thetaLoo - thetaFE) ** 2 / (1 / sumWLoo);

            data.push({ x: qCont, y: inf, label: labels[i], yi: yi[i], vi: vi[i] });
        }
        return data;
    }

    /**
     * Complete Subgroup Analysis (Categorical Moderator)
     * Calculates pooled effects per group and Q_between
     */
    function performSubgroupAnalysis(yi, vi, subgroups, model) {
        const groups = [...new Set(subgroups)];
        const resultsByGroup = [];
        let qBetween = 0;
        let dfBetween = groups.length - 1;

        // Common tau^2 for random effects subgroups (if assumed equal)
        // For simplicity we estimate fully independent models per subgroup
        const modelFn = model === 'fixed' ? fixedEffects : randomEffects;

        let totalW = 0;
        let totalWX = 0;
        const groupThetas = [];
        const groupWeights = [];

        for (const group of groups) {
            // Extract indices for this group
            const indices = [];
            subgroups.forEach((g, i) => { if (g === group) indices.push(i); });

            const groupYi = indices.map(i => yi[i]);
            const groupVi = indices.map(i => vi[i]);

            if (indices.length === 0) continue;

            // Pool this group
            try {
                const groupPooled = modelFn(groupYi, groupVi);
                resultsByGroup.push({
                    group: group,
                    k: indices.length,
                    pooled: groupPooled
                });

                // For Q_between, we need fixed effects weights (1/v) for each group's grand mean calculation
                const wFE = 1 / (groupPooled.se * groupPooled.se);
                groupThetas.push(groupPooled.theta);
                groupWeights.push(wFE);

                totalW += wFE;
                totalWX += wFE * groupPooled.theta;

            } catch (e) {
                console.error(`Error pooling subgroup ${group}:`, e);
            }
        }

        // Q_between = Sum( W_g * (Theta_g - Theta_grand)^2 )
        const grandTheta = totalWX / totalW;
        for (let i = 0; i < groupThetas.length; i++) {
            qBetween += groupWeights[i] * (groupThetas[i] - grandTheta) ** 2;
        }

        const pBetween = 1 - pchisq(qBetween, dfBetween);

        return {
            groups: resultsByGroup,
            Q_between: qBetween,
            df: dfBetween,
            p_value: pBetween
        };
    }

    /**
     * Continuous Meta-Regression (Weighted Least Squares)
     */
    function performMetaRegression(yi, vi, xContinuous, model) {
        const k = yi.length;
        if (k < 3) return null; // Need enough points for regression

        // Estimate Tau^2 if random effects (Moment estimator for simplicity in WLS)
        let tau2 = 0;
        const weightsFE = vi.map(v => 1 / v);

        if (model === 'random') {
            // Compute standard Q to empirically estimate residual Tau2 (DerSimonian-Laird approach for regression)
            // Simplified: we use the overall model pooled tau2 or re-estimate it here.
            // Using standard DL estimator over the residuals of a FE regression:
            const { b0: b0FE, b1: b1FE } = calcWLS(yi, weightsFE, xContinuous);
            let Q_res = 0;
            for (let i = 0; i < k; i++) {
                const yHat = b0FE + b1FE * xContinuous[i];
                Q_res += weightsFE[i] * Math.pow(yi[i] - yHat, 2);
            }
            const df = k - 2;

            // c factor trace for the continuous moderator
            let sumW = 0, sumWX = 0, sumWX2 = 0, sumW2 = 0, sumW2X = 0, sumW2X2 = 0;
            for (let i = 0; i < k; i++) {
                sumW += weightsFE[i];
                sumWX += weightsFE[i] * xContinuous[i];
                sumWX2 += weightsFE[i] * xContinuous[i] * xContinuous[i];
                sumW2 += weightsFE[i] * weightsFE[i];
                sumW2X += weightsFE[i] * weightsFE[i] * xContinuous[i];
                sumW2X2 += weightsFE[i] * weightsFE[i] * xContinuous[i] * xContinuous[i];
            }
            const c = sumW - (sumW2 * sumWX2 - 2 * sumWX * sumW2X + sumW * sumW2X2) / (sumW * sumWX2 - sumWX * sumWX);

            tau2 = Math.max(0, (Q_res - df) / c);
            if (isNaN(tau2) || !isFinite(tau2)) tau2 = 0;
        }

        // Final weights
        const w = vi.map(v => 1 / (v + tau2));

        // Perform WLS
        const stats = calcWLS(yi, w, xContinuous);
        let { b0, b1 } = stats;

        // SEs using covariance matrix
        let sumW = 0, sumWX = 0, sumWX2 = 0;
        let sumWY = 0, sumWXY = 0, sumWY2 = 0;

        for (let i = 0; i < k; i++) {
            const weight = w[i];
            const x = xContinuous[i];
            const y = yi[i];

            sumW += weight;
            sumWX += weight * x;
            sumWX2 += weight * x * x;
            sumWY += weight * y;
            sumWXY += weight * x * y;
            sumWY2 += weight * y * y;
        }

        const determinant = sumW * sumWX2 - (sumWX * sumWX);

        let varB0 = 0, varB1 = 0;
        if (Math.abs(determinant) > 1e-10) {
            varB0 = sumWX2 / determinant;
            varB1 = sumW / determinant;
        } else {
            b0 = 0;
            b1 = 0;
        }

        const seB0 = (varB0 !== undefined && !isNaN(varB0)) ? Math.sqrt(Math.max(0, varB0)) : 0;
        const seB1 = (varB1 !== undefined && !isNaN(varB1)) ? Math.sqrt(Math.max(0, varB1)) : 0;

        const zB0 = seB0 > 0 ? b0 / seB0 : 0;
        const zB1 = seB1 > 0 ? b1 / seB1 : 0;

        const pB0 = 2 * (1 - pnorm(Math.abs(zB0)));
        const pB1 = 2 * (1 - pnorm(Math.abs(zB1)));

        // R2 calculation (proportion of variance explained)
        // Null model Q
        const nullMean = sumW > 1e-10 ? sumWY / sumW : 0;
        let Q_total = 0;
        let Q_res = 0;
        for (let i = 0; i < k; i++) {
            Q_total += w[i] * Math.pow(yi[i] - nullMean, 2);
            const yHat = b0 + b1 * xContinuous[i];
            Q_res += w[i] * Math.pow(yi[i] - yHat, 2);
        }

        const qModel = Math.max(0, Q_total - Q_res);
        const pModel = (isNaN(qModel) || qModel === 0) ? 1 : (1 - pchisq(qModel, 1));
        let r2 = Q_total > 1e-10 ? (Q_total - Q_res) / Q_total : 0;
        if (r2 < 0) r2 = 0;
        if (typeof r2 !== 'number' || isNaN(r2)) r2 = 0;

        return {
            b0: b0,
            b1: b1,
            seB0: seB0,
            seB1: seB1,
            zB0: zB0,
            zB1: zB1,
            pB0: pB0,
            pB1: pB1,
            tau2: tau2,
            R2: r2,
            Q_model: qModel,
            p_model: pModel,
            k: k,
            weights: w,
            x: xContinuous,
            yi: yi
        };
    }

    function calcWLS(y, w, x) {
        let sumW = 0, sumWX = 0, sumWY = 0, sumWXY = 0, sumWX2 = 0;
        for (let i = 0; i < y.length; i++) {
            sumW += w[i];
            sumWX += w[i] * x[i];
            sumWY += w[i] * y[i];
            sumWXY += w[i] * x[i] * y[i];
            sumWX2 += w[i] * x[i] * x[i];
        }
        const denominator = (sumW * sumWX2) - (sumWX * sumWX);
        if (Math.abs(denominator) < 1e-10) return { b0: 0, b1: 0 };

        const b0 = ((sumWY * sumWX2) - (sumWX * sumWXY)) / denominator;
        const b1 = ((sumW * sumWXY) - (sumWX * sumWY)) / denominator;

        return { b0, b1 };
    }

    // ===== BACK-TRANSFORMATIONS =====

    function backTransform(value, analysisType, effectMeasure) {
        if (analysisType === 'binary') {
            // Back from log scale
            return Math.exp(value);
        }
        if (analysisType === 'correlation') {
            return zToR(value);
        }
        return value;
    }

    function getEffectLabel(analysisType, effectMeasure) {
        switch (analysisType) {
            case 'continuous': return effectMeasure === 'MD' ? 'MD' : "Hedges' g";
            case 'binary': return effectMeasure === 'RR' ? 'RR' : 'OR';
            case 'correlation': return 'r';
            case 'precalc': return 'ES';
            default: return 'Effect';
        }
    }

    function getNullValue(analysisType) {
        if (analysisType === 'binary') return 0; // log scale: log(1) = 0
        return 0;
    }

    // ===== EFFECT SIZE CALCULATOR (Public helper for ES Calculator modal) =====
    /**
     * Calculate ES + SE from raw data for any analysis type.
     * @param {string} type 'smd'|'md'|'or'|'rr'|'correlation'
     * @param {object} params - keys depend on type
     * @returns {{ es, se, label, note }} or { error }
     */
    function calcES(type, params) {
        try {
            let res, label, note = '', backVal = null;
            switch (type) {
                case 'smd': {
                    const { m1, sd1, n1, m2, sd2, n2 } = params;
                    res = hedgesG(+m1, +sd1, +n1, +m2, +sd2, +n2);
                    label = "Hedges' g";
                    note = 'Corrección J de sesgos pequeñas muestras aplicada.';
                    break;
                }
                case 'md': {
                    const { m1, sd1, n1, m2, sd2, n2 } = params;
                    res = meanDiff(+m1, +sd1, +n1, +m2, +sd2, +n2);
                    label = 'MD (Diferencia de Medias)';
                    break;
                }
                case 'or': {
                    const { e1, n1, e2, n2 } = params;
                    res = logOR(+e1, +n1, +e2, +n2);
                    label = 'Log OR';
                    backVal = Math.exp(res.yi).toFixed(4);
                    note = `OR = ${backVal} (escala natural)`;
                    break;
                }
                case 'rr': {
                    const { e1, n1, e2, n2 } = params;
                    res = logRR(+e1, +n1, +e2, +n2);
                    label = 'Log RR';
                    backVal = Math.exp(res.yi).toFixed(4);
                    note = `RR = ${backVal} (escala natural)`;
                    break;
                }
                case 'correlation': {
                    const { r, n } = params;
                    res = fisherZ(+r, +n);
                    label = "Fisher's z (de r)";
                    note = `r original = ${(+r).toFixed(4)}`;
                    break;
                }
                default:
                    return { error: `Tipo desconocido: ${type}` };
            }
            if (isNaN(res.yi) || isNaN(res.sei)) return { error: 'Entrada inválida. Revisa los valores.' };
            return { es: res.yi, se: res.sei, vi: res.vi, label, note };
        } catch (e) {
            return { error: e.message };
        }
    }

    // ===== PUBLIC API =====
    return {
        computeAll,
        computeEffectSizes,
        fixedEffects,
        randomEffects,
        hedgesG,
        meanDiff,
        logOR,
        logRR,
        fisherZ,
        zToR,
        eggerTest,
        beggTest,
        trimAndFill,
        failsafeN,
        leaveOneOut,
        influenceDiagnostics,
        subgroupAnalysis,
        metaRegression,
        backTransform,
        getEffectLabel,
        getNullValue,
        pnorm,
        pFromZ,
        pchisq,
        calcES
    };
})();
