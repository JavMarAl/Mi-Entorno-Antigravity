const express = require('express');
const cors = require('cors');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000;
const ENGINE_DIR = path.join(__dirname, 'engine');

// ── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ── R availability check ──────────────────────────────────
let rAvailable = false;
function checkR() {
    try {
        // Ejecución síncrona: obliga a Node a esperar la respuesta
        execSync('Rscript --version', { stdio: 'ignore' });
        rAvailable = true;
    } catch (err) {
        rAvailable = false;
    }
}
checkR();

// ── Helper: run an R script with JSON input ───────────────
function runRScript(scriptName, inputData) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(ENGINE_DIR, scriptName);
        if (!fs.existsSync(scriptPath)) {
            return reject(new Error(`R script not found: ${scriptName}`));
        }

        // Windows spawn + shell:true + stdin piping causes a silent Access Violation (3221225477)
        // Fix: write payload to a temporary file and pass it as an argument
        const tmpFile = path.join(__dirname, `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.json`);
        fs.writeFileSync(tmpFile, JSON.stringify(inputData));

        const rProc = spawn('Rscript', ['--vanilla', scriptPath, tmpFile]);
        let stdout = '';
        let stderr = '';

        rProc.stdout.on('data', chunk => { stdout += chunk; });
        rProc.stderr.on('data', chunk => { stderr += chunk; });

        rProc.on('close', code => {
            // Clean up temp file
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

            if (code !== 0) {
                console.error(`[R:${scriptName}] stderr:`, stderr);
                return reject(new Error(`R process exited with code ${code}. ${stderr.slice(0, 300)}`));
            }
            try {
                resolve(JSON.parse(stdout));
            } catch (e) {
                reject(new Error(`Invalid JSON from R: ${stdout.slice(0, 200)}`));
            }
        });

        rProc.on('error', err => {
            reject(new Error(`Failed to start Rscript: ${err.message}`));
        });
    });
}

// ── Health endpoint (La puerta que faltaba) ───────────────
app.get('/health', (req, res) => {
    checkR();
    res.json({
        status: 'ok',
        r_available: rAvailable,
        engine_dir: ENGINE_DIR,
        port: PORT
    });
});

// ── POST /api/r/analyze ───────────────────────────────────
app.post('/api/r/analyze', async (req, res) => {
    if (!rAvailable) {
        return res.status(503).json({ error: 'R no está disponible.' });
    }

    const { yi, vi, labels, model, analysisType, effectMeasure, subgroups, is_log } = req.body;

    if (!yi || !vi || yi.length < 2) {
        return res.status(400).json({ error: 'Se necesitan al menos 2 estudios con yi y vi.' });
    }

    const base = { yi, vi, labels, model };

    try {
        const [pooling, heterogeneity, bias, sensitivity] = await Promise.allSettled([
            runRScript('pooling.R', base),
            runRScript('heterogeneity.R', base),
            runRScript('bias.R', { ...base, is_log: is_log || false }),
            runRScript('sensitivity.R', base),
        ]);

        const result = {
            pooling: pooling.status === 'fulfilled' ? pooling.value : { error: pooling.reason?.message },
            heterogeneity: heterogeneity.status === 'fulfilled' ? heterogeneity.value : { error: heterogeneity.reason?.message },
            bias: bias.status === 'fulfilled' ? bias.value : { error: bias.reason?.message },
            sensitivity: sensitivity.status === 'fulfilled' ? sensitivity.value : { error: sensitivity.reason?.message },
        };

        if (subgroups && subgroups.filter(s => s && s.trim()).length > 0) {
            const sg = await runRScript('subgroups.R', { ...base, subgroups }).catch(e => ({ error: e.message }));
            result.subgroups = sg;
        }

        res.json(result);
    } catch (err) {
        console.error('[/api/r/analyze] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/r/metaregression ────────────────────────────
app.post('/api/r/metaregression', async (req, res) => {
    if (!rAvailable) {
        return res.status(503).json({ error: 'R no disponible.' });
    }
    try {
        const result = await runRScript('metaregression.R', req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/r/export-code ───────────────────────────────
app.post('/api/r/export-code', async (req, res) => {
    if (!rAvailable) {
        return res.status(503).json({ error: 'R no disponible.' });
    }
    try {
        const result = await runRScript('export_r_code.R', req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🔬 MetaAnalysis Pro — R Backend`);
    console.log(`   URL:          http://localhost:${PORT}`);
    console.log(`   R Available:  ${rAvailable ? '✅' : '❌'}`);
    console.log(`   Engine dir:   ${ENGINE_DIR}\n`);
});