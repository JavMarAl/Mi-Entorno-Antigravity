const API_URL = 'http://localhost:3000/api';

// State
let currentData = [];
let currentCodeExercises = [];
let currentMode = 'theory-basics'; // theory-basics | theory-python | code-practice
let currentIndex = 0;
let answeredQuestions = {}; // To store if a question has been answered

// DOM Elements
const sectionTitle = document.getElementById('section-title');
const modeBadge = document.getElementById('mode-badge');
const quizSection = document.getElementById('quiz-section');
const quizContainer = document.getElementById('quiz-container');
const codePracticeSection = document.getElementById('code-practice');

const navBtns = document.querySelectorAll('.nav-btn');
const progressOverall = document.getElementById('overall-progress');

// Code Practice Elements
const elExTitle = document.getElementById('exercise-title');
const elExDesc = document.getElementById('exercise-desc');
const elExHint = document.getElementById('exercise-hint');
const elHintText = document.getElementById('hint-text');
const elExCounter = document.getElementById('exercise-counter');
const btnPrevEx = document.getElementById('prev-exercise');
const btnNextEx = document.getElementById('next-exercise');
const codeEditor = document.getElementById('code-editor');
let editor = null; // CodeMirror instance
const terminalOutput = document.getElementById('terminal-output');
const btnRunCode = document.getElementById('run-code');

// Solution Elements
const btnShowSolution = document.getElementById('show-solution');
const solutionPanel = document.getElementById('solution-panel');
const solutionCode = document.getElementById('solution-code');
const solutionExplanation = document.getElementById('solution-explanation');

// AI Elements
const btnAskAI = document.getElementById('ask-ai');
const aiChatPanel = document.getElementById('ai-chat-panel');
const btnCloseAI = document.getElementById('close-ai');
const aiMessages = document.getElementById('ai-messages');
const aiInput = document.getElementById('ai-input');
const btnSendAI = document.getElementById('send-ai');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupCodePractice();
    setupAI();
    loadSection('theory-basics');
});

// --- Navigation ---
function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const target = e.currentTarget.dataset.target;
            loadSection(target);
        });
    });
}

async function loadSection(target) {
    currentMode = target;
    currentIndex = 0;

    if (target === 'theory-basics') {
        sectionTitle.textContent = "Teoría sobre Programación";
        modeBadge.textContent = "Modo Cuestionario";
        quizSection.classList.add('active');
        codePracticeSection.classList.remove('active');
        await fetchQuizData('/questions/theory');
    } else if (target === 'theory-python') {
        sectionTitle.textContent = "Conceptos de Python";
        modeBadge.textContent = "Modo Cuestionario";
        quizSection.classList.add('active');
        codePracticeSection.classList.remove('active');
        await fetchQuizData('/questions/python');
    } else if (target === 'code-practice') {
        sectionTitle.textContent = "Práctica de Código";
        modeBadge.textContent = "Modo Editor";
        quizSection.classList.remove('active');
        codePracticeSection.classList.add('active');
        await fetchCodeExercises();
    }
}

// --- Quiz Logic ---
async function fetchQuizData(endpoint) {
    quizContainer.innerHTML = '<div class="loading-spinner">Cargando preguntas...</div>';
    try {
        const res = await fetch(`${API_URL}${endpoint}?v=${new Date().getTime()}`);
        currentData = await res.json();
        renderQuestion(currentIndex);
        updateGamificationUI();
    } catch (err) {
        console.error("Fetch Data Error:", err);
        quizContainer.innerHTML = '<div style="color:red">Error cargando los datos. Asegúrate de que el servidor local (Backend) esté corriendo.</div>';
    }
}

function renderQuestion(index) {
    if (!currentData || currentData.length === 0) return;
    const q = currentData[index];
    const isAnswered = answeredQuestions[q.id] !== undefined;
    const selectedObj = answeredQuestions[q.id];

    let html = `
        <div class="question-text">${index + 1}. ${q.question}</div>
        <div class="options-list">
    `;

    q.options.forEach((opt, i) => {
        let btnClass = 'option-btn';
        if (isAnswered) {
            if (i === selectedObj.selected) btnClass += ' selected';
            if (i === selectedObj.correctAnswer) btnClass += ' correct';
            if (i === selectedObj.selected && selectedObj.selected !== selectedObj.correctAnswer) btnClass += ' incorrect';
        }

        html += `<button class="${btnClass}" ${isAnswered ? 'disabled' : ''} data-index="${i}">${opt}</button>`;
    });

    html += `</div>`;

    if (isAnswered) {
        const isCorrect = selectedObj.selected === selectedObj.correctAnswer;
        const feedbackHeader = isCorrect
            ? `<h4 style="color: #10b981; margin-top: 0; margin-bottom: 0.5rem;">✅ ¡Correcto!</h4>`
            : `<h4 style="color: #ef4444; margin-top: 0; margin-bottom: 0.5rem;">❌ Incorrecto.</h4>`;

        html += `
            <div class="explanation-box" style="display:block;">
                ${feedbackHeader}
                <p><strong>Explicación de Experto:</strong><br/> ${selectedObj.explanation}</p>
            </div>
        `;
    }

    html += `
        <div class="quiz-controls">
            <button class="btn secondary" id="prev-q" ${index === 0 ? 'disabled' : ''}>Anterior</button>
            <span>Pregunta ${index + 1} de ${currentData.length}</span>
            <button class="btn primary" id="next-q" ${index === currentData.length - 1 ? 'disabled' : ''}>Siguiente</button>
        </div>
    `;

    quizContainer.innerHTML = html;

    // Attach Selection Event
    if (!isAnswered) {
        const optBtns = quizContainer.querySelectorAll('.option-btn');
        optBtns.forEach(btn => {
            btn.addEventListener('click', () => handleAnswerSubmit(q.id, parseInt(btn.dataset.index)));
        });
    }

    // Attach Nav Events
    document.getElementById('prev-q').addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; renderQuestion(currentIndex); }
    });
    document.getElementById('next-q').addEventListener('click', () => {
        if (currentIndex < currentData.length - 1) { currentIndex++; renderQuestion(currentIndex); }
    });
}

async function handleAnswerSubmit(questionId, selectedIndex) {
    // Determine the type to fetch the correct answer
    const type = currentMode === 'theory-basics' ? 'theory' : 'python';

    try {
        const res = await fetch(`${API_URL}/questions/${type}/${questionId}/answer`);
        const data = await res.json();

        answeredQuestions[questionId] = {
            selected: selectedIndex,
            correctAnswer: data.correctAnswer,
            explanation: data.explanation
        };

        if (selectedIndex === data.correctAnswer) {
            addXP(10, 'Pregunta respondida correctamente');
        } else {
            updateGamificationUI();
        }

        renderQuestion(currentIndex);
    } catch (err) {
        console.error("Error validating answer", err);
    }
}

// --- Code Practice Logic ---
async function fetchCodeExercises() {
    try {
        const res = await fetch(`${API_URL}/exercises?v=${new Date().getTime()}`);
        currentCodeExercises = await res.json();
        renderExercise(currentIndex);
        updateGamificationUI();
    } catch (err) {
        console.error("Fetch Code Practice Error:", err);
        elExTitle.textContent = "Error";
        elExDesc.textContent = "No se pudieron cargar los ejercicios.";
    }
}

function renderExercise(index) {
    if (!currentCodeExercises || currentCodeExercises.length === 0) return;
    const ex = currentCodeExercises[index];

    elExTitle.textContent = ex.title;
    elExDesc.textContent = ex.description;
    elExHint.style.display = 'none';
    elHintText.textContent = ex.hint;

    solutionPanel.style.display = 'none';
    solutionCode.textContent = ex.solution || 'Solución no disponible.';
    solutionExplanation.textContent = ex.solutionExplanation || '';

    elExCounter.textContent = `${index + 1} / ${currentCodeExercises.length}`;
    if (editor) {
        editor.setValue(ex.initialCode || '# Escribe tu código aquí\n');
        // Small delay to ensure layout is correctly calculated
        setTimeout(() => editor.refresh(), 50);
    } else {
        codeEditor.value = ex.initialCode || '# Escribe tu código aquí\n';
    }
    terminalOutput.innerHTML = 'Listo para ejecutar...';

    btnPrevEx.disabled = index === 0;
    btnNextEx.disabled = index === currentCodeExercises.length - 1;
}

function setupCodePractice() {
    // Initialize CodeMirror instance
    if (!editor && codeEditor) {
        editor = CodeMirror.fromTextArea(codeEditor, {
            mode: 'python',
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            indentWithTabs: false
        });
        editor.setSize("100%", "350px");
        editor.getWrapperElement().style.fontSize = "15px";
    }

    btnPrevEx.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; renderExercise(currentIndex); }
    });
    btnNextEx.addEventListener('click', () => {
        if (currentIndex < currentCodeExercises.length - 1) { currentIndex++; renderExercise(currentIndex); }
    });

    btnShowSolution.addEventListener('click', () => {
        solutionPanel.style.display = solutionPanel.style.display === 'none' ? 'block' : 'none';
    });

    const btnExplainError = document.getElementById('btn-explain-error');

    // Setup Explain Error AI Feature
    btnExplainError.addEventListener('click', () => {
        aiChatPanel.style.display = 'flex';
        // Force the AI chat input to have a robust prompt about the specific error
        const exTitle = currentCodeExercises[currentIndex]?.title || 'Ejercicio de Código';
        aiInput.value = `¡Ayuda IA! Estaba haciendo el ejercicio "${exTitle}". \nMi código actual falló con este error:\n\n${terminalOutput.innerText}\n\nPor favor, explícame en español sencillo por qué ocurrió este error y dame unas pistas conceptuales (sin darme el código resuelto) de cómo puedo arreglarlo.`;
        // Scroll to AI
        setTimeout(() => sendAIMessage(), 300);
    });

    btnRunCode.addEventListener('click', async () => {
        terminalOutput.innerHTML = '<span style="color:#d1d5db">Transmitiendo código al servidor...</span><br/>';
        btnExplainError.style.display = 'none'; // Hide explanation button by default

        const code = editor ? editor.getValue().trim() : codeEditor.value.trim();

        if (!code) {
            terminalOutput.innerHTML = '<span style="color:#ef4444">Error: El editor está vacío.</span>';
            return;
        }

        try {
            const res = await fetch(`${API_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();

            terminalOutput.innerHTML = '<span style="color:#d1d5db">Ejecutando script localmente...</span><br/>';

            if (data.success) {
                // Formatting newlines properly
                const formattedOutput = data.output.replace(/\n/g, '<br/>');
                terminalOutput.innerHTML += `<span style="color:#10b981">${formattedOutput || '(Script ejecutado sin salida en consola)'}</span>`;
                // Mark exercise 
                if (!answeredQuestions[`code_${currentIndex}`]) {
                    answeredQuestions[`code_${currentIndex}`] = true;
                    addXP(25, 'Código ejecutado sin errores');
                } else {
                    updateGamificationUI();
                }
            } else {
                const formattedOutput = data.output.replace(/\n/g, '<br/>');
                terminalOutput.innerHTML += `<span style="color:#ef4444">${formattedOutput}</span>`;
                // Show AI Assistance button since there was an error
                btnExplainError.style.display = 'inline-block';
            }

        } catch (err) {
            terminalOutput.innerHTML += '<span style="color:#ef4444">Error crítico de red contactando al motor Python local.</span>';
        }
    });
}

// --- AI Chat Logic ---
function setupAI() {
    btnAskAI.addEventListener('click', () => {
        aiChatPanel.style.display = 'flex';
        // Show the hint if applicable as a shortcut
        if (currentMode === 'code-practice' && currentCodeExercises[currentIndex]) {
            elExHint.style.display = 'block';
        }
    });

    btnCloseAI.addEventListener('click', () => {
        aiChatPanel.style.display = 'none';
    });

    btnSendAI.addEventListener('click', sendAIMessage);
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendAIMessage();
    });
}

async function sendAIMessage() {
    const text = aiInput.value.trim();
    if (!text) return;

    // Add user msg
    addAIMessage(text, 'user');
    aiInput.value = '';

    // Disable input while fetching
    aiInput.disabled = true;
    btnSendAI.disabled = true;

    try {
        let exId = 'Desconocido';
        let contextText = '';

        if (currentMode === 'code-practice') {
            exId = `Práctica de Código #${currentIndex + 1} (${currentCodeExercises[currentIndex]?.title || ''})`;
            contextText = editor ? editor.getValue() : codeEditor.value;
        } else {
            const q = currentData[currentIndex];
            exId = `Cuestionario Teórico #${currentIndex + 1}`;
            if (q) {
                contextText = `Pregunta: ${q.question}\nOpciones: ${q.options.join(', ')}`;
            }
        }

        const res = await fetch(`${API_URL}/ai-help`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exerciseId: exId, currentCode: contextText, question: text })
        });

        const data = await res.json();
        addAIMessage(data.help, 'system');
    } catch (err) {
        addAIMessage("Error conectando con la IA.", 'system');
    } finally {
        aiInput.disabled = false;
        btnSendAI.disabled = false;
        aiInput.focus();
    }
}

function addAIMessage(msg, sender) {
    const div = document.createElement('div');
    div.className = `ai-msg ${sender}`;
    // very basic markdown rendering for new lines
    div.innerHTML = msg.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
    aiMessages.appendChild(div);
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

// --- Global Progress & Gamification ---
let userXP = parseInt(localStorage.getItem('python_master_xp')) || 0;
const elUserLevelText = document.getElementById('user-level-text');

function getLevelFromXP(xp) {
    if (xp < 100) return 'Aprendiz';
    if (xp < 500) return 'Desarrollador Junior';
    if (xp < 1500) return 'Desarrollador Mid-Level';
    return 'Arquitecto Python';
}

function addXP(amount, reason = '') {
    userXP += amount;
    localStorage.setItem('python_master_xp', userXP);
    updateGamificationUI();

    // Optional floating text effect could go here
    if (reason) {
        console.log(`+${amount} XP: ${reason}`);
    }
}

function updateGamificationUI() {
    const level = getLevelFromXP(userXP);
    if (elUserLevelText) {
        elUserLevelText.textContent = `${level} (${userXP} XP)`;
    }

    const totalItems = 55 + 55 + 105;
    const completed = Object.keys(answeredQuestions).length;
    const percentage = Math.min((completed / totalItems) * 100, 100);
    progressOverall.style.width = `${percentage}%`;
}

// Ensure gamification UI is set on load
document.addEventListener('DOMContentLoaded', () => {
    updateGamificationUI();
});

