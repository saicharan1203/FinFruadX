import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiMessageCircle, FiX, FiSend, FiCpu, FiZap, FiShield, FiAlertTriangle, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';
import API_URL from '../apiConfig';
import './AIAssistant.css';

// Quick action suggestions for the user
const QUICK_ACTIONS = [
    { icon: <FiShield />, label: 'Explain Risk Scores', prompt: 'Explain how fraud risk scores work and what different risk levels mean in FinFraudX.' },
    { icon: <FiAlertTriangle />, label: 'Suspicious Patterns', prompt: 'What are the most common suspicious transaction patterns I should look for when investigating financial fraud?' },
    { icon: <FiTrendingUp />, label: 'Investigation Tips', prompt: 'Give me step-by-step investigation tips for a flagged high-risk transaction.' },
    { icon: <FiZap />, label: 'Model Accuracy', prompt: 'How can I improve my fraud detection model accuracy? What features matter most?' },
];

const TypingIndicator = () => (
    <div className="ai-typing-indicator">
        <span></span>
        <span></span>
        <span></span>
    </div>
);

// Markdown-like formatting for chat messages
const formatMessage = (text) => {
    if (!text) return '';

    // Split into lines and process
    const lines = text.split('\n');
    let result = [];
    let inCodeBlock = false;
    let codeContent = [];

    lines.forEach((line, index) => {
        // Code blocks
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                result.push(
                    <pre key={`code-${index}`} className="ai-code-block">
                        <code>{codeContent.join('\n')}</code>
                    </pre>
                );
                codeContent = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            return;
        }

        if (inCodeBlock) {
            codeContent.push(line);
            return;
        }

        // Headers
        if (line.startsWith('### ')) {
            result.push(<h4 key={index} className="ai-msg-h3">{line.slice(4)}</h4>);
            return;
        }
        if (line.startsWith('## ')) {
            result.push(<h3 key={index} className="ai-msg-h2">{line.slice(3)}</h3>);
            return;
        }
        if (line.startsWith('# ')) {
            result.push(<h2 key={index} className="ai-msg-h1">{line.slice(2)}</h2>);
            return;
        }

        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const content = line.trim().slice(2);
            result.push(
                <div key={index} className="ai-bullet">
                    <span className="ai-bullet-dot">•</span>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
                </div>
            );
            return;
        }

        // Numbered lists
        const numberedMatch = line.trim().match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
            result.push(
                <div key={index} className="ai-numbered">
                    <span className="ai-number">{numberedMatch[1]}.</span>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(numberedMatch[2]) }} />
                </div>
            );
            return;
        }

        // Empty lines
        if (line.trim() === '') {
            result.push(<div key={index} className="ai-spacer" />);
            return;
        }

        // Regular text
        result.push(
            <p key={index} className="ai-text" dangerouslySetInnerHTML={{ __html: formatInlineText(line) }} />
        );
    });

    return result;
};

// Format bold, italic, code inline
const formatInlineText = (text) => {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="ai-inline-code">$1</code>');
};


export const AIAssistant = ({ predictions, fileInfo }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `👋 Hello! I'm your **AI Fraud Investigation Assistant** powered by Google Gemini.

I can help you with:
- **Analyzing** suspicious transactions and patterns
- **Explaining** risk scores and model predictions
- **Suggesting** investigation steps for flagged cases
- **Answering** questions about fraud detection best practices

How can I assist your investigation today?`,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [pulseNotification, setPulseNotification] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 300);
        }
    }, [isOpen]);

    // Clear pulse after opening once
    useEffect(() => {
        if (isOpen) {
            setPulseNotification(false);
        }
    }, [isOpen]);

    // Build context from current app state
    const buildContext = useCallback(() => {
        let context = '';

        if (predictions) {
            const fraudCount = predictions.filter?.(p => p.prediction === 'Fraud' || p.is_fraud === 1)?.length || 0;
            const totalCount = predictions.length || 0;
            const fraudRate = totalCount > 0 ? ((fraudCount / totalCount) * 100).toFixed(1) : 0;
            context += `\nCurrent Analysis Context: ${totalCount} transactions analyzed, ${fraudCount} flagged as potentially fraudulent (${fraudRate}% fraud rate).`;

            // Get high risk transactions
            const highRisk = predictions.filter?.(p =>
                (p.risk_level === 'Critical' || p.risk_level === 'High') ||
                (p.probability && p.probability > 0.8)
            )?.slice(0, 5);

            if (highRisk && highRisk.length > 0) {
                context += `\nTop high-risk transactions: ${JSON.stringify(highRisk.map(t => ({
                    amount: t.amount || t.amt,
                    merchant: t.merchant || t.merchant_category,
                    risk: t.risk_level,
                    confidence: t.confidence_score || t.probability
                })))}`;
            }
        }

        if (fileInfo) {
            context += `\nUploaded file: ${fileInfo.filename || 'Unknown'}, Rows: ${fileInfo.rows || 'N/A'}, Columns: ${fileInfo.columns || 'N/A'}`;
        }

        return context;
    }, [predictions, fileInfo]);

    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        const userMessage = {
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setShowQuickActions(false);

        try {
            const context = buildContext();

            const response = await fetch(`${API_URL}/api/ai-assistant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    context: context,
                    history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();

            const assistantMessage = {
                role: 'assistant',
                content: data.response || 'I apologize, I encountered an issue generating a response. Please try again.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Assistant error:', error);
            const errorMessage = {
                role: 'assistant',
                content: `⚠️ I'm having trouble connecting right now. This could be because:
- The backend server isn't running
- The AI service is temporarily unavailable

**Tip:** Make sure the backend server is running on port 5000 and the Gemini API key is configured.

Error: ${error.message}`,
                timestamp: new Date(),
                isError: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: `🔄 Chat cleared! I'm ready for a fresh investigation.

What would you like to analyze?`,
            timestamp: new Date(),
        }]);
        setShowQuickActions(true);
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                className={`ai-fab ${isOpen ? 'ai-fab-hidden' : ''} ${pulseNotification ? 'ai-fab-pulse' : ''}`}
                onClick={() => setIsOpen(true)}
                title="AI Fraud Assistant"
                aria-label="Open AI Assistant"
                id="ai-assistant-fab"
            >
                <div className="ai-fab-inner">
                    <FiCpu className="ai-fab-icon" />
                    <div className="ai-fab-glow"></div>
                </div>
                {pulseNotification && <span className="ai-fab-badge">AI</span>}
            </button>

            {/* Chat Panel */}
            <div className={`ai-chat-panel ${isOpen ? 'ai-chat-open' : ''}`}>
                {/* Header */}
                <div className="ai-chat-header">
                    <div className="ai-chat-header-info">
                        <div className="ai-chat-avatar">
                            <FiCpu />
                            <span className="ai-status-dot"></span>
                        </div>
                        <div>
                            <h3>AI Fraud Assistant</h3>
                            <span className="ai-status-text">
                                <FiZap size={10} /> Powered by Gemini
                            </span>
                        </div>
                    </div>
                    <div className="ai-chat-header-actions">
                        <button onClick={clearChat} className="ai-header-btn" title="Clear chat">
                            <FiRefreshCw size={16} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="ai-header-btn ai-close-btn" title="Close">
                            <FiX size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="ai-chat-messages" ref={chatContainerRef}>
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`ai-message ${msg.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'} ${msg.isError ? 'ai-message-error' : ''}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="ai-message-avatar">
                                    <FiCpu size={14} />
                                </div>
                            )}
                            <div className="ai-message-content">
                                <div className="ai-message-bubble">
                                    {formatMessage(msg.content)}
                                </div>
                                <span className="ai-message-time">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="ai-message ai-message-assistant">
                            <div className="ai-message-avatar">
                                <FiCpu size={14} />
                            </div>
                            <div className="ai-message-content">
                                <div className="ai-message-bubble">
                                    <TypingIndicator />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {showQuickActions && (
                    <div className="ai-quick-actions">
                        {QUICK_ACTIONS.map((action, index) => (
                            <button
                                key={index}
                                className="ai-quick-btn"
                                onClick={() => sendMessage(action.prompt)}
                                disabled={isLoading}
                            >
                                {action.icon}
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="ai-chat-input-area">
                    <div className="ai-input-wrapper">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about fraud patterns, risk analysis..."
                            className="ai-chat-input"
                            rows={1}
                            disabled={isLoading}
                            id="ai-assistant-input"
                        />
                        <button
                            className={`ai-send-btn ${input.trim() ? 'ai-send-active' : ''}`}
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            title="Send message"
                        >
                            <FiSend size={16} />
                        </button>
                    </div>
                    <p className="ai-disclaimer">AI responses are for investigation support only. Always verify findings.</p>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && <div className="ai-overlay" onClick={() => setIsOpen(false)} />}
        </>
    );
};
