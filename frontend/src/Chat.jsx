import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Send, Copy, Check, FileUp } from 'lucide-react';
import { sendMessage, listDocuments } from './api';

const SUGGESTED_QUESTIONS = [
  'What are the main topics covered in the documents?',
  'Summarize the key findings.',
  'What recommendations are made?',
  'Are there any risks or concerns mentioned?',
];

function SourceCard({ source }) {
  return (
    <div className="source-card">
      <div className="source-card-filename">{source.filename}</div>
      <div className="source-card-excerpt">{source.chunk_content}</div>
      {source.relevance_score != null && (
        <div className="source-card-score">Relevance: {(source.relevance_score * 100).toFixed(0)}%</div>
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="btn btn-ghost btn-icon btn-sm copy-btn" onClick={handleCopy} title="Copy response">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat({ setError, resumeSession, onSessionResumed, onGoToDocuments }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [hasDocuments, setHasDocuments] = useState(null); // null = loading
  const messagesEndRef = useRef(null);

  useEffect(() => {
    listDocuments()
      .then((data) => setHasDocuments(data?.documents?.length > 0))
      .catch(() => setHasDocuments(false));
  }, []);

  // Load a resumed session from History
  useEffect(() => {
    if (!resumeSession) return;
    setSessionId(resumeSession.sessionId);
    setMessages(
      resumeSession.messages.map((m) => ({
        role: m.role,
        content: m.content,
        sources: m.sources ? (() => { try { return JSON.parse(m.sources); } catch { return []; } })() : [],
        timestamp: m.created_at ? new Date(m.created_at) : new Date(),
      }))
    );
    onSessionResumed?.();
  }, [resumeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    const userMsg = { role: 'user', content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessage(question, sessionId);
      if (response.session_id) setSessionId(response.session_id);
      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || 'Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput('');
    setError(null);
    // Re-check documents in case user uploaded something
    listDocuments()
      .then((data) => setHasDocuments(data?.documents?.length > 0))
      .catch(() => setHasDocuments(false));
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat with your Documents</h2>
        <button className="btn btn-outline btn-sm" onClick={handleNewChat}>
          New Chat
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            {hasDocuments === false ? (
              <>
                <div className="chat-empty-icon">
                  <FileUp size={48} strokeWidth={1.2} />
                </div>
                <h3>No documents uploaded</h3>
                <p>Upload a document first so BotAssist has something to answer questions about.</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={onGoToDocuments}
                >
                  Go to Documents
                </button>
              </>
            ) : hasDocuments === true ? (
              <>
                <div className="chat-empty-icon">
                  <MessageSquare size={48} strokeWidth={1.2} />
                </div>
                <h3>Start a conversation</h3>
                <p>Ask questions about your uploaded documents and get AI-powered answers.</p>
                <div className="suggested-questions">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      className="btn btn-outline btn-sm suggested-question"
                      onClick={() => handleSend(q)}
                      disabled={loading}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            ) : null /* still loading */}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
              <div className="bubble-label">
                {msg.role === 'user' ? 'You' : 'BotAssist'}
              </div>
              <div className="bubble">
                <div className="bubble-content">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === 'assistant' && (
                  <div className="bubble-actions">
                    <CopyButton text={msg.content} />
                  </div>
                )}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="chat-sources">
                    <div className="sources-label">Sources ({msg.sources.length})</div>
                    <div className="source-cards">
                      {msg.sources.map((s, i) => (
                        <SourceCard key={i} source={s} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="bubble-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="chat-message chat-assistant">
            <div className="bubble-label">BotAssist</div>
            <div className="bubble">
              <div className="bubble-content typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
          rows={2}
          disabled={loading}
        />
        <button
          className="btn btn-primary send-btn"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
