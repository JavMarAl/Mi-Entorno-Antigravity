const fs = require('fs');
const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const NOTEBOOK_ID = 'a07b61c5-c1d3-47bb-a7c6-7c4e07163a30'; // same as server.js
const DATA_DIR = path.join(__dirname, 'data');

const CATEGORIES = [
    {
        id: 'theory',
        file: 'theory_questions.json',
        goal: 200,
        batchSize: 10,
        prompt: `Eres un experto creador de exámenes de programación. Genera un array en formato JSON con estrictamente {BATCH_SIZE} preguntas teóricas generales sobre conceptos de programación (NO solo Python, sino lógica general, arquitecturas, redes, bases de datos, algoritmos, etc.). Las preguntas deben tener una dificultad de {DIFFICULTY}/10. 
        DEBES RESPONDER EXCLUSIVAMENTE CON EL ARRAY JSON (sin markdown, sin \`\`\`json).
        El formato de cada objeto en el array DEBE SER EXACTAMENTE:
        {
          "id": "gen_th_{RANDOM}",
          "question": "Pregunta de nivel {DIFFICULTY}...",
          "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
          "correctAnswer": 0, // índice de la opción correcta (0 a 4)
          "explanation": "Explicación detallada de por qué es la correcta."
        }`
    },
    {
        id: 'python',
        file: 'python_theory_questions.json',
        goal: 200,
        batchSize: 10,
        prompt: `Eres un experto creador de exámenes de Python. Genera un array en formato JSON con estrictamente {BATCH_SIZE} preguntas teóricas sobre sintaxis, librerías, y peculiaridades específicas de Python 3. Dificultad: {DIFFICULTY}/10.
        DEBES RESPONDER EXCLUSIVAMENTE CON EL ARRAY JSON (sin markdown, sin \`\`\`json).
        El formato de cada objeto en el array DEBE SER EXACTAMENTE:
        {
          "id": "gen_py_{RANDOM}",
          "question": "Pregunta de python de nivel {DIFFICULTY}...",
          "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
          "correctAnswer": 0,
          "explanation": "Explicación detallada."
        }`
    },
    {
        id: 'code',
        file: 'code_exercises.json',
        goal: 200,
        batchSize: 5, // smaller batch for code because it requires more text
        prompt: `Eres un experto creador de ejercicios de Python. Genera un array en formato JSON con estrictamente {BATCH_SIZE} ejercicios prácticos de código en Python. Dificultad: {DIFFICULTY}/10.
        DEBES RESPONDER EXCLUSIVAMENTE CON EL ARRAY JSON (sin markdown, sin \`\`\`json).
        El formato de cada objeto en el array DEBE SER EXACTAMENTE:
        {
          "id": "gen_ex_{RANDOM}",
          "title": "Título corto y descriptivo del ejercicio",
          "description": "Explicación de nivel {DIFFICULTY} de lo que debe hacer el código...",
          "hint": "Una pequeña pista...",
          "initialCode": "# Escribe tu código aquí\\ndef resolver():\\n    pass\\n",
          "solution": "def resolver():\\n    return True\\n",
          "solutionExplanation": "Por qué esta solución es la mejor."
        }`
    }
];

let mcpClient = null;

async function connectMCP() {
    console.log('[MCP] Conectando a NotebookLM...');
    const transport = new StdioClientTransport({
        command: 'node',
        args: [path.join(__dirname, '../node_modules/notebooklm-mcp-server/dist/index.js')],
    });
    mcpClient = new Client({ name: 'generator', version: '1.0' }, { capabilities: {} });
    await mcpClient.connect(transport);
    console.log('[MCP] Conectado.');
}

async function queryNotebook(query) {
    const result = await mcpClient.callTool({
        name: 'notebook_query',
        arguments: { notebook_id: NOTEBOOK_ID, query },
    });
    return result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
}

function cleanJSON(text) {
    let start = text.indexOf('[');
    let end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && start < end) {
        return text.substring(start, end + 1);
    }
    throw new Error("No array brackets found in NotebookLM response");
}

async function generateCategory(category) {
    console.log(`\n--- Generando ${category.goal} items para ${category.id} ---`);
    let results = [];
    let iterations = Math.ceil(category.goal / category.batchSize);
    
    // We already have some items in the file? 
    // If the user wants 200 fresh ones, we will start from scratch.
    
    for (let i = 0; i < iterations; i++) {
        // Calculate dynamic difficulty (from 1 to 10 linearly)
        let difficulty = Math.min(10, Math.max(1, Math.ceil(((i + 1) / iterations) * 10)));
        console.log(`Iteración ${i+1}/${iterations} | Dificultad: ${difficulty}/10 | Solicitando ${category.batchSize} items...`);
        
        let randomIdBase = Math.floor(Math.random() * 1000000);
        let currentPrompt = category.prompt
            .replace(/{BATCH_SIZE}/g, category.batchSize)
            .replace(/{DIFFICULTY}/g, difficulty)
            .replace(/{RANDOM}/g, randomIdBase);
            
        // To force variety, pass previous topics as "Do not repeat these"
        let avoidTopics = results.length > 0 ? "Asegúrate de NO REPETIR temas de iteraciones anteriores." : "";
        currentPrompt += "\n" + avoidTopics;

        retries = 3;
        while(retries > 0) {
            try {
                let response = await queryNotebook(currentPrompt);
                let jsonStr = cleanJSON(response);
                let parsed = JSON.parse(jsonStr);
                
                if (!Array.isArray(parsed)) throw new Error("La respuesta no es un Array");
                
                // Add an incremental index to the ID to ensure absolute uniqueness
                parsed = parsed.map((item, idx) => {
                    item.id = item.id + "_" + Date.now() + "_" + idx;
                    return item;
                });
                
                results.push(...parsed);
                console.log(`✅ ¡Éxito! Obtenidos ${parsed.length} items. Total acumulado: ${results.length}`);
                
                // Save progress aggressively to not lose data
                fs.writeFileSync(path.join(DATA_DIR, category.file), JSON.stringify(results, null, 2));
                break; // success, break retry loop

            } catch (err) {
                console.error(`❌ Error parseando JSON en iteración ${i+1}. Intentos restantes: ${retries-1}`);
                retries--;
                if (retries === 0) {
                    console.log("⚠️ Saltando este lote tras fallar 3 veces.");
                }
            }
        }
    }
    console.log(`🎉 Terminado ${category.id}. Total final: ${results.length} items.`);
}

async function main() {
    await connectMCP();
    for (const cat of CATEGORIES) {
        // To restart safely, we allow partial. But for now we just overwrite
        await generateCategory(cat);
    }
    console.log('\n✅ ¡TODA LA GENERACIÓN HA SIDO COMPLETADA!');
    process.exit(0);
}

main().catch(console.error);
