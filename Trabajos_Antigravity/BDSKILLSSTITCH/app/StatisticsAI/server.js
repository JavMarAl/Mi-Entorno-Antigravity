/**
 * Statistics AI Assistant - Backend Engine
 * 
 * This Express server acts as the bridge between the frontend
 * and the NotebookLM MCP server. It receives chat questions
 * and queries the configured NotebookLM notebooks.
 * 
 * Notebooks:
 *   - Principles and Methods of Modern Statistics (e934201d-2c50-4fc3-a54b-fc35096e358c)
 *   - Bioestadística Avanzada para el Metaanálisis Clínico (bc243a58-2e8d-4512-af9a-6f856869a745)
 */

const express = require('express');
const cors = require('cors');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const app = express();
const PORT = 3000;

// ─── Notebook IDs ──────────────────────────────────────────────────────────
const NOTEBOOKS = {
    statistics: {
        id: 'e934201d-2c50-4fc3-a54b-fc35096e358c',
        label: 'Principles and Methods of Modern Statistics',
    },
    biostat: {
        id: 'bc243a58-2e8d-4512-af9a-6f856869a745',
        label: 'Bioestadística Avanzada para el Metaanálisis Clínico',
    },
};

// ─── MCP Client Management ─────────────────────────────────────────────────
let mcpClient = null;
let mcpReady = false;

async function createMcpClient() {
    console.log('[MCP] Connecting to NotebookLM MCP server...');
    try {
        const transport = new StdioClientTransport({
            command: 'npx',
            args: ['-y', '@google/notebooklm-mcp-server'],
        });
        mcpClient = new Client({ name: 'statistics-ai', version: '1.0.0' }, { capabilities: {} });
        await mcpClient.connect(transport);
        mcpReady = true;
        console.log('[MCP] ✅ Connected to NotebookLM MCP server');
    } catch (err) {
        console.error('[MCP] ❌ Failed to connect:', err.message);
        mcpReady = false;
    }
}

// ─── Query a single notebook ───────────────────────────────────────────────
async function queryNotebook(notebookId, query, conversationId = null) {
    const args = { notebook_id: notebookId, query };
    if (conversationId) args.conversation_id = conversationId;

    const result = await mcpClient.callTool({
        name: 'notebook_query',
        arguments: args,
    });

    // MCP result is an array of content parts
    const text = result.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

    return JSON.parse(text);
}

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// ─── Health endpoint ───────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: mcpReady ? 'ok' : 'degraded',
        mcp: mcpReady,
        notebooks: Object.keys(NOTEBOOKS),
    });
});

// ─── Chat endpoint ─────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { question, notebook = 'both' } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ error: 'El campo "question" es requerido.' });
    }

    if (!mcpReady || !mcpClient) {
        // Fallback: return an informative error
        return res.status(503).json({
            error: 'El motor NotebookLM no está disponible. Por favor reinicia el servidor.',
        });
    }

    try {
        const q = question.trim();
        let answer = '';
        let sources = [];

        if (notebook === 'both') {
            // Query both notebooks in parallel
            const [statsResult, biostatResult] = await Promise.allSettled([
                queryNotebook(NOTEBOOKS.statistics.id, q),
                queryNotebook(NOTEBOOKS.biostat.id, q),
            ]);

            const parts = [];

            if (statsResult.status === 'fulfilled' && statsResult.value?.answer) {
                parts.push(`### 📊 Modern Statistics\n\n${statsResult.value.answer}`);
                sources.push(NOTEBOOKS.statistics.label);
            }
            if (biostatResult.status === 'fulfilled' && biostatResult.value?.answer) {
                parts.push(`### 🔬 Bioestadística Avanzada\n\n${biostatResult.value.answer}`);
                sources.push(NOTEBOOKS.biostat.label);
            }

            answer = parts.length > 0
                ? parts.join('\n\n---\n\n')
                : 'No se encontró información relevante en ninguno de los cuadernos.';

        } else {
            // Query a single notebook
            const nbConfig = NOTEBOOKS[notebook];
            if (!nbConfig) {
                return res.status(400).json({ error: `Cuaderno no reconocido: ${notebook}` });
            }

            const result = await queryNotebook(nbConfig.id, q);
            answer = result?.answer || 'No se encontró información relevante.';
            sources = [nbConfig.label];
        }

        return res.json({ answer, sources });

    } catch (err) {
        console.error('[Chat] Error querying NotebookLM:', err);
        return res.status(500).json({ error: `Error al consultar NotebookLM: ${err.message}` });
    }
});

// ─── Start server ──────────────────────────────────────────────────────────
async function start() {
    await createMcpClient();

    app.listen(PORT, () => {
        console.log(`\n🚀 Statistics AI backend running at http://localhost:${PORT}`);
        console.log(`   MCP ready: ${mcpReady ? '✅' : '❌'}`);
        console.log(`   Open index.html in your browser or visit http://localhost:${PORT}\n`);
    });
}

start();
