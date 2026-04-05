import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Sparkles, ChevronDown } from 'lucide-react';
import './AIChatDialog.css';

const PAGE_LABELS = {
    dashboard: '📊 Dashboard',
    workflow: '🔬 Workflow',
    monitor: '📡 Monitor Ambiental',
    inventario: '📦 Inventario',
    firmas: '✍️ Firma Electrónica',
    analiticas: '📈 Analíticas',
    'formulario-qc': '🧪 Formulario QC',
    'detalle-lote': '📋 Detalle de Lote',
    general: '🧬 CAR-T Lab',
};

const SESSION_ID = 'sess_' + Math.random().toString(36).slice(2, 10);

const SUGGESTED_QUESTIONS = {
    dashboard: ['¿Qué lotes están en riesgo?', '¿Cuál es el estado de las alertas críticas?', '¿Cómo está la viabilidad media?'],
    workflow: ['¿Qué lotes tienen etapas atrasadas?', '¿En qué etapa hay más retrasos?', 'Explícame el proceso CAR-T'],
    monitor: ['¿Hay parámetros ambientales fuera de spec?', '¿Cómo está la temperatura de las salas ISO?', '¿Qué equipos necesitan atención?'],
    inventario: ['¿Qué reactivos están por agotarse?', '¿Hay lotes de reactivos caducados?', '¿Cuáles son los más críticos?'],
    firmas: ['¿Qué lotes requieren firma urgente?', '¿Cuántas firmas faltan para liberar?', 'Explícame el proceso de firma electrónica GMP'],
    analiticas: ['¿Cuál es el First Pass Yield?', '¿Quién tiene mejor tasa de aprobación?', '¿Cómo mejorar la viabilidad?'],
    'formulario-qc': ['¿Cuáles son las specs de viabilidad CAR-T?', '¿Qué parámetros son críticos en QC release?', 'Explícame qué es OOS'],
    general: ['¿Qué es CAR-T?', '¿Qué normativas GMP aplican?', '¿Cómo funciona el sistema?'],
};

function TypingIndicator() {
    return (
        <div className="aria-msg">
            <div className="aria-avatar"><Bot size={14} /></div>
            <div className="aria-bubble typing">
                <span /><span /><span />
            </div>
        </div>
    );
}

function Message({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={isUser ? 'user-msg' : 'aria-msg'}>
            {!isUser && <div className="aria-avatar"><Bot size={14} /></div>}
            <div className={isUser ? 'user-bubble' : 'aria-bubble'}>
                {msg.content.split('\n').map((line, i) => (
                    <p key={i} dangerouslySetInnerHTML={{
                        __html: line
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/⚠️/g, '<span class="warn-icon">⚠️</span>')
                            .replace(/📋/g, '<span>📋</span>')
                    }} />
                ))}
            </div>
        </div>
    );
}

export default function AIChatDialog({ pageContext = 'general' }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `¡Hola! Soy **ARIA**, tu asistente especializada en CAR-T y GMP. Tengo acceso en tiempo real a los datos del sistema.\n\n¿En qué puedo ayudarte hoy?`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const pageLabel = PAGE_LABELS[pageContext] || PAGE_LABELS.general;
    const suggestions = SUGGESTED_QUESTIONS[pageContext] || SUGGESTED_QUESTIONS.general;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    const sendMessage = useCallback(async (text) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        setInput('');
        setShowSuggestions(false);
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setLoading(true);

        try {
            const historyToSend = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, pageContext, sessionId: SESSION_ID, history: historyToSend })
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error al conectar con Gemini: ' + data.error }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ No se pudo conectar con el servidor.' }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, pageContext]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <>
            {/* Floating trigger button */}
            <button
                className={`aria-trigger ${open ? 'aria-trigger--active' : ''}`}
                onClick={() => setOpen(o => !o)}
                title="Asistente IA ARIA"
            >
                <div className="aria-trigger__ring" />
                {open ? <X size={22} /> : <Sparkles size={22} />}
            </button>

            {/* Chat panel */}
            <div className={`aria-panel ${open ? 'aria-panel--open' : ''}`}>
                {/* Header */}
                <div className="aria-header">
                    <div className="aria-header__info">
                        <div className="aria-header__icon"><Bot size={18} /></div>
                        <div>
                            <div className="aria-header__title">Asistente ARIA</div>
                            <div className="aria-header__sub">Gemini 1.5 Flash · CAR-T GMP</div>
                        </div>
                    </div>
                    <button className="aria-header__close" onClick={() => setOpen(false)}><X size={16} /></button>
                </div>

                {/* Context badge */}
                <div className="aria-context-bar">
                    <span className="aria-context-badge">{pageLabel}</span>
                    <span className="aria-context-label">Contexto activo</span>
                </div>

                {/* Messages */}
                <div className="aria-messages">
                    {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                    {loading && <TypingIndicator />}

                    {/* Suggested questions */}
                    {showSuggestions && messages.length === 1 && (
                        <div className="aria-suggestions">
                            <div className="aria-suggestions__label">
                                <Sparkles size={11} /> Preguntas sugeridas
                            </div>
                            {suggestions.map((q, i) => (
                                <button key={i} className="aria-suggestion-btn" onClick={() => sendMessage(q)}>{q}</button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="aria-input-area">
                    <textarea
                        ref={inputRef}
                        className="aria-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pregunta sobre los datos actuales..."
                        rows={1}
                        disabled={loading}
                    />
                    <button
                        className="aria-send-btn"
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="aria-footer">Powered by Gemini · datos en tiempo real</div>
            </div>

            {/* Backdrop on mobile */}
            {open && <div className="aria-backdrop" onClick={() => setOpen(false)} />}
        </>
    );
}
