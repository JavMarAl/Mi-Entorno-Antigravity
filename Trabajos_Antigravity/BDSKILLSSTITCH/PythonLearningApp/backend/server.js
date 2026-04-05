const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const app = express();
const PORT = 3000;
const NOTEBOOK_ID = 'a07b61c5-c1d3-47bb-a7c6-7c4e07163a30';

// ─── MCP Client Management ─────────────────────────────────────────────────
let mcpClient = null;
let mcpReady = false;

async function createMcpClient() {
    console.log('[MCP] Connecting to NotebookLM MCP server...');
    try {
        // Use npx without -y to prefer the local version installed in node_modules
        const transport = new StdioClientTransport({
            command: 'node',
            args: [path.join(__dirname, '../node_modules/notebooklm-mcp-server/dist/index.js')],
        });
        mcpClient = new Client({ name: 'python-learning-app', version: '1.0.0' }, { capabilities: {} });

        // Add timeout to connection
        await Promise.race([
            mcpClient.connect(transport),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 10000))
        ]);

        mcpReady = true;
        console.log('[MCP] ✅ Connected to NotebookLM MCP server');
    } catch (err) {
        console.error('[MCP] ❌ Failed to connect:', err.message);
        if (err.message.includes('auth') || err.message.includes('login')) {
            console.error('[MCP] 💡 Tip: Run "npx notebooklm-mcp-server auth" in your terminal to login.');
        }
        mcpReady = false;
    }
}

async function queryNotebook(notebookId, query) {
    const result = await mcpClient.callTool({
        name: 'notebook_query',
        arguments: { notebook_id: notebookId, query },
    });
    const text = result.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');
    return JSON.parse(text);
}

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Data loading will be dynamic now
const dataPath = path.join(__dirname, 'data');

function loadData() {
    try {
        const tq = JSON.parse(fs.readFileSync(path.join(dataPath, 'theory_questions.json')));
        const pq = JSON.parse(fs.readFileSync(path.join(dataPath, 'python_theory_questions.json')));
        const ce = JSON.parse(fs.readFileSync(path.join(dataPath, 'code_exercises.json')));
        return { theoryQuestions: tq, pythonTheoryQuestions: pq, codeExercises: ce };
    } catch (error) {
        console.error("Error loading data:", error.message);
        return { theoryQuestions: [], pythonTheoryQuestions: [], codeExercises: [] };
    }
}

// --- API Endpoints ---

// Get all theory programming questions
app.get('/api/questions/theory', (req, res) => {
    const { theoryQuestions } = loadData();
    // Send without the correct answer
    const safeData = theoryQuestions.map(q => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
    });
    res.json(safeData);
});

// Get answer for a specific theory question
app.get('/api/questions/theory/:id/answer', (req, res) => {
    const { theoryQuestions } = loadData();
    const q = theoryQuestions.find(q => q.id === req.params.id);
    if (q) {
        res.json({ correctAnswer: q.correctAnswer, explanation: q.explanation });
    } else {
        res.status(404).json({ error: "Question not found" });
    }
});

// Get all python theory questions
app.get('/api/questions/python', (req, res) => {
    const { pythonTheoryQuestions } = loadData();
    const safeData = pythonTheoryQuestions.map(q => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
    });
    res.json(safeData);
});

// Get answer for a specific python theory question
app.get('/api/questions/python/:id/answer', (req, res) => {
    const { pythonTheoryQuestions } = loadData();
    const q = pythonTheoryQuestions.find(q => q.id === req.params.id);
    if (q) {
        res.json({ correctAnswer: q.correctAnswer, explanation: q.explanation });
    } else {
        res.status(404).json({ error: "Question not found" });
    }
});

// Get all code exercises
app.get('/api/exercises', (req, res) => {
    const { codeExercises } = loadData();
    res.json(codeExercises);
});

// Execute Python Code

app.post('/api/execute', (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    // Generate a temporary file name
    const tempFileName = `temp_${crypto.randomBytes(8).toString('hex')}.py`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    // Save the code to the temporary file
    fs.writeFileSync(tempFilePath, code);

    // Execute the python script with a timeout to prevent infinite loops
    exec(`python "${tempFilePath}"`, { timeout: 3000 }, (error, stdout, stderr) => {
        // Clean up the temp file
        try {
            fs.unlinkSync(tempFilePath);
        } catch (cleanupErr) {
            console.error("Failed to clean up temp file:", cleanupErr);
        }

        if (error) {
            if (error.killed) {
                return res.json({ success: false, output: "Error: El proceso tomó demasiado tiempo (Timeout > 3s) y fue abortado. Posible bucle infinito o uso de input() interactivo (no soportado en este entorno web)." });
            }
            return res.json({ success: false, output: stderr || error.message });
        }

        res.json({ success: true, output: stdout });
    });
});


// Provide Real AI help endpoint for the code exercises + theory
app.post('/api/ai-help', async (req, res) => {
    const { exerciseId, currentCode, question } = req.body;

    if (!mcpReady || !mcpClient) {
        return res.status(503).json({
            help: 'El motor de IA NotebookLM no está disponible en este momento. Intenta redactar tu código nuevamente o revisar la pista.'
        });
    }

    try {
        // Build a detailed context prompt for the AI
        let fullQuery = `Contexto del estudiante: Está resolviendo el ejercicio #${exerciseId}.\n`;
        if (currentCode) {
            fullQuery += `\nDatos del desafío actual que el estudiante está viendo en pantalla:\n${currentCode}\n`;
        }
        fullQuery += `\nPregunta del estudiante: "${question}"\n`;
        fullQuery += `\nINSTRUCCIONES PARA EL AI: Responde de forma clara y directa como un tutor experto de Python. Utiliza la base de datos "Data Logic and the Global Reset Manipulation" como fundamento si es contenido teórico. Si el estudiante envía código, analízalo gentilmente e indícale por qué falla o cómo mejorarlo, sin darle la respuesta 100% entera si es un ejercicio. Ocupa viñetas si debes listar pasos. CRÍTICO: Formula tu respuesta lo más RÁPIDO posible, optimizando tu tiempo de procesamiento interno sin sacrificar la excelente calidad de la explicación.`;

        const result = await queryNotebook(NOTEBOOK_ID, fullQuery);
        res.json({ help: result?.answer || "Lo siento, mi motor cognitivo no pudo generar una respuesta clara." });
    } catch (err) {
        console.error('[AI] Fallo en la consulta:', err);
        res.json({ help: `Error cognitivo temporal. El servidor local AI encontró una anomalía: ${err.message}` });
    }
});

// Start the server
async function start() {
    await createMcpClient();

    app.listen(PORT, () => {
        console.log(`\n🚀 Python Learning App backend running at http://localhost:${PORT}`);
        console.log(`   MCP AI: ${mcpReady ? '✅ Conectado' : '❌ Desconectado'}`);
        console.log(`   Open index.html in your browser or visit http://localhost:${PORT}\n`);
    });
}

start();
