/* ==============================================
   Statistics AI Assistant - Frontend Logic
   Queries the local Express backend which connects
   to NotebookLM via MCP
   ============================================== */

const SERVER_URL = 'http://localhost:3000';

// DOM references
const messagesContainer = document.getElementById('messagesContainer');
const questionInput = document.getElementById('questionInput');
const sendBtn = document.getElementById('sendBtn');
const notebookSelect = document.getElementById('notebookSelect');
const welcomeSplash = document.getElementById('welcomeSplash');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

let conversationHistory = [];
let isLoading = false;

// ─── Server health check ───────────────────────────────────────────────────
async function checkServerHealth() {
    statusDot.className = 'status-dot connecting';
    statusText.textContent = 'Conectando...';
    try {
        const res = await fetch(`${SERVER_URL}/health`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Motor conectado';
        } else {
            throw new Error('Server not OK');
        }
    } catch {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Motor desconectado';
    }
}

// ─── Message rendering ─────────────────────────────────────────────────────
function appendMessage(role, content, sources = []) {
    // Remove welcome splash on first message
    if (welcomeSplash && welcomeSplash.parentNode) {
        welcomeSplash.remove();
    }

    const msg = document.createElement('div');
    msg.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'Tú' : 'AI';

    const body = document.createElement('div');
    body.className = 'message-body';

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    if (role === 'assistant') {
        // Render Markdown for AI responses
        contentEl.innerHTML = marked.parse(content);
    } else {
        contentEl.textContent = content;
    }

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    body.appendChild(contentEl);

    // Source chips for assistant messages
    if (role === 'assistant' && sources.length > 0) {
        const chips = document.createElement('div');
        chips.className = 'source-chips';
        sources.forEach(s => {
            const chip = document.createElement('span');
            chip.className = 'source-chip';
            chip.textContent = `📖 ${s}`;
            chips.appendChild(chip);
        });
        body.appendChild(chips);
    }

    body.appendChild(meta);
    msg.appendChild(avatar);
    msg.appendChild(body);

    messagesContainer.appendChild(msg);
    scrollToBottom();
    return msg;
}

function showThinking() {
    const msg = document.createElement('div');
    msg.className = 'message assistant';
    msg.id = 'thinkingMessage';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';

    const body = document.createElement('div');
    body.className = 'message-body';

    const indicator = document.createElement('div');
    indicator.className = 'thinking-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'thinking-dot';
        indicator.appendChild(dot);
    }

    body.appendChild(indicator);
    msg.appendChild(avatar);
    msg.appendChild(body);
    messagesContainer.appendChild(msg);
    scrollToBottom();
}

function removeThinking() {
    const el = document.getElementById('thinkingMessage');
    if (el) el.remove();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ─── Send question to backend ──────────────────────────────────────────────
async function sendQuestion() {
    const question = questionInput.value.trim();
    if (!question || isLoading) return;

    const notebook = notebookSelect.value;

    isLoading = true;
    sendBtn.disabled = true;
    questionInput.value = '';
    questionInput.style.height = 'auto';

    // Add user message
    appendMessage('user', question);
    conversationHistory.push({ role: 'user', content: question });

    // Show thinking
    showThinking();

    try {
        const res = await fetch(`${SERVER_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, notebook }),
        });

        removeThinking();

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
            appendMessage('assistant', `❌ **Error del servidor:** ${err.error || res.statusText}`);
            return;
        }

        const data = await res.json();
        const answer = data.answer || 'No se recibió respuesta.';
        const sources = data.sources || [];

        appendMessage('assistant', answer, sources);
        conversationHistory.push({ role: 'assistant', content: answer });

    } catch (err) {
        removeThinking();
        const isOffline = err.message.includes('fetch') || err.name === 'TypeError';
        const errorMsg = isOffline
            ? `❌ **Motor desconectado.** Asegúrate de que el servidor esté corriendo:\n\n\`\`\`\ncd app/StatisticsAI\nnode server.js\n\`\`\``
            : `❌ **Error:** ${err.message}`;
        const errEl = appendMessage('assistant', errorMsg);
        errEl.classList.add('error-message');
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        questionInput.focus();
    }
}

// ─── Auto-resize textarea ──────────────────────────────────────────────────
questionInput.addEventListener('input', () => {
    questionInput.style.height = 'auto';
    questionInput.style.height = Math.min(questionInput.scrollHeight, 160) + 'px';
});

// ─── Keyboard handling ─────────────────────────────────────────────────────
questionInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendQuestion();
    }
});

sendBtn.addEventListener('click', sendQuestion);

// ─── Topic chips ───────────────────────────────────────────────────────────
document.querySelectorAll('.topic-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        questionInput.value = prompt;
        questionInput.dispatchEvent(new Event('input'));
        sendQuestion();
    });
});

// ─── Knowledge base sidebar items ─────────────────────────────────────────
document.querySelectorAll('.kb-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.kb-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const nb = item.dataset.notebook;
        notebookSelect.value = nb === 'statistics' ? 'statistics' : nb === 'biostat' ? 'biostat' : 'both';
    });
});

// ─── Sidebar toggle (mobile) ───────────────────────────────────────────────
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Close sidebar on outside click (mobile)
document.addEventListener('click', e => {
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// ─── Notebook selector sync ────────────────────────────────────────────────
notebookSelect.addEventListener('change', () => {
    const val = notebookSelect.value;
    document.querySelectorAll('.kb-item').forEach(i => {
        i.classList.remove('active');
        if (i.dataset.notebook === val ||
            (val === 'both' && i.dataset.notebook === 'both')) {
            i.classList.add('active');
        }
    });
});

// ─── Init ──────────────────────────────────────────────────────────────────
checkServerHealth();
// Recheck every 30 seconds
setInterval(checkServerHealth, 30000);
