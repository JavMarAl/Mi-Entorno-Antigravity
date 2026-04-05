/**
 * ai-assistant.js
 * Handles the logic for the Global Expert AI Assistant panel.
 */

document.addEventListener('DOMContentLoaded', () => {
    const fabButton = document.getElementById('ai-fab');
    const aiPanel = document.getElementById('ai-panel');
    const closeBtn = document.getElementById('ai-close');
    const sendBtn = document.getElementById('ai-send');
    const inputField = document.getElementById('ai-input');
    const messagesContainer = document.getElementById('ai-messages');

    // Estado del asistente
    let isFirstOpen = true;

    // ----- UI TOGGLES -----
    function togglePanel() {
        const isOpen = aiPanel.classList.contains('open');
        if (isOpen) {
            aiPanel.classList.remove('open');
        } else {
            aiPanel.classList.add('open');
            if (isFirstOpen) {
                showInitialGreeting();
                isFirstOpen = false;
            }
            inputField.focus();
        }
    }

    fabButton.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', togglePanel);

    // Cierra el panel si el usuario hace clic fuera (opcional, pero útil)
    document.addEventListener('click', (e) => {
        if (aiPanel.classList.contains('open') &&
            !aiPanel.contains(e.target) &&
            !fabButton.contains(e.target)) {
            togglePanel();
        }
    });

    // ----- MESSAGE HANDLING -----

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${sender}`;

        // Process text for basic markdown-like formatting if needed (bolding)
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Handle newlines
        formattedText = formattedText.split('\n').map(line => `<p>${line}</p>`).join('');

        msgDiv.innerHTML = formattedText;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesContainer.appendChild(indicator);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ----- BOT LOGIC (SIMULATED EXPERT) -----

    function showInitialGreeting() {
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            const greeting = "¡Hola! Soy tu asistente de IA experto en **metaanálisis y estadística**.\n\nEstoy aquí en todas las pestañas para ayudarte a interpretar tus *Forest Plots*, analizar la heterogeneidad (I², Q de Cochran), detectar sesgos de publicación o configurar tu modelo de efectos aleatorios.\n\n¿En qué te puedo asesorar hoy?";
            appendMessage(greeting, 'bot');
        }, 1000);
    }

    function processUserMessage(msg) {
        const lowerMsg = msg.toLowerCase();
        let response = "Interesante pregunta. Como tu experto en metaanálisis, te sugiero que revisemos los datos en tus gráficas actuales.";

        // Basic keyword matching for expert simulation
        if (lowerMsg.includes('i2') || lowerMsg.includes('heterogeneidad')) {
            response = "**Sobre la Heterogeneidad (I²):**\nEl estadístico I² describe el porcentaje de variación a través de los estudios que se debe a heterogeneidad y no al azar.\n- < 25%: Baja\n- 25% a 75%: Moderada\n- > 75%: Alta.\n\nSi tu I² es alto, un modelo de efectos aleatorios es tu mejor opción, y deberías buscar fuentes clínicas o metodológicas de esta variabilidad utilizando la tabla de Sensibilidad.";
        } else if (lowerMsg.includes('forest') || lowerMsg.includes('plot')) {
            response = "**Interpretando el Forest Plot:**\nCada cuadro representa una estimación del tamaño del efecto del estudio. El tamaño del cuadro refleja su peso en el metaanálisis. \n\nEl diamante en la parte inferior es nuestro efecto global. Si las puntas del diamante cruzan la línea de no-efecto (usualmente 0 para diferencias, o 1 para ratios), tu resultado no es estadísticamente significativo globalmente.";
        } else if (lowerMsg.includes('sesgo') || lowerMsg.includes('funnel') || lowerMsg.includes('egger')) {
            response = "**Sesgo de Publicación:**\nEl Funnel Plot asume que los estudios con mayor precisión (n grandes) se agruparán simétricamente alrededor del efecto real.\n\nUn Test de Egger con **p < 0.05** nos indica asimetría significativa. Si esto ocurre, te sugiero mirar el algoritmo de *Trim-and-Fill* para imputar los estudios que posiblemente no fueron publicados debido a resultados negativos.";
        } else if (lowerMsg.includes('fijo') || lowerMsg.includes('aleatorio') || lowerMsg.includes('modelo')) {
            response = "**Efectos Fijos vs. Aleatorios:**\n- Usa **Fijos** solo si asumes que todos los estudios comparten exactamente el mismo tamaño de efecto verdadero (muy raro en medicina/psicología).\n- Usa **Aleatorios** (RE Model) de forma predeterminada, ya que asume que el universo de estudios tiene una distribución de efectos genuinamente diferentes.";
        } else if (lowerMsg.includes('hola') || lowerMsg.includes('ayuda')) {
            response = "¡Hola nuevamente! Pregúntame sobre cualquier concepto complejo de metaanálisis, como la Tau-cuadrado, interpretación de intervalos de predicción, gráficos de Galbraith, o cómo estructurar tu reporte PRISMA.";
        }

        setTimeout(() => {
            hideTypingIndicator();
            appendMessage(response, 'bot');
        }, 1500 + Math.random() * 1000); // Simulate "thinking" delay 1.5s - 2.5s
    }

    // ----- INPUT EVENT HANDLERS -----

    function handleSend() {
        const text = inputField.value.trim();
        if (text) {
            appendMessage(text, 'user');
            inputField.value = '';
            inputField.style.height = '40px'; // reset height
            showTypingIndicator();
            processUserMessage(text);
        }
    }

    sendBtn.addEventListener('click', handleSend);

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-resize textarea
    inputField.addEventListener('input', function () {
        this.style.height = '40px';
        this.style.height = (this.scrollHeight) + 'px';
    });
});
