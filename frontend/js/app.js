document.getElementById('analyze-btn').addEventListener('click', async () => {
    const prompt = document.getElementById('pico-prompt').value;
    const btn = document.getElementById('analyze-btn');
    const resultArea = document.getElementById('result-area');
    const picoOutput = document.getElementById('pico-output');
    const jsonDebug = document.getElementById('json-debug');

    if (!prompt.trim()) {
        alert("Por favor, escriba una pregunta PICO.");
        return;
    }

    // UI Feedback
    btn.disabled = true;
    btn.innerText = "Analizando...";
    resultArea.style.display = "none";

    try {
        const response = await fetch('http://localhost:8000/api/pico/parse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: prompt }),
        });

        if (!response.ok) throw new Error('Error en la comunicación con el backend');

        const data = await response.json();
        
        // Show results
        resultArea.style.display = "block";
        const pico = data.pico;
        
        picoOutput.innerHTML = `
            <ul style="margin-top: 1rem; list-style: none;">
                <li><strong>Población:</strong> ${pico.population || 'No detectada'}</li>
                <li><strong>Intervención:</strong> ${pico.intervention || 'No detectada'}</li>
                <li><strong>Comparación:</strong> ${pico.comparison || 'No detectada'}</li>
                <li><strong>Resultado (Outcome):</strong> ${pico.outcome || 'No detectado'}</li>
            </ul>
        `;
        
        jsonDebug.innerText = JSON.stringify(data, null, 2);

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Analizar con Antigravity AI";
    }
});
