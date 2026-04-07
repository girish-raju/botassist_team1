import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMessage } from './api';

export default function Chat({ setError }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // BUG: no auto-scroll — scrollIntoView is never called after messages update

  const handleSend = async () => {
    // BUG: allows empty messages — no check for empty/whitespace input
    const userMsg = { role: 'user', content: input };

    // BUG: reverse sort — new messages prepended instead of appended
    setMessages((prev) => [userMsg, ...prev]);
    setInput('');
    setLoading(true);

    const response = await sendMessage(input, sessionId);

    if (response) {
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        // BUG: sources may be undefined, leading to "Sources: undefined" display
        sources: response.sources,
      };

      // BUG: again reversed — prepended
      setMessages((prev) => [assistantMsg, ...prev]);
    } else {
      setError('Failed to get a response. Please try again.');
    }

    setLoading(false);
    // BUG: no send disable while loading — button stays enabled, user can spam
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
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat with your Documents</h2>
        <button className="btn btn-secondary" onClick={handleNewChat}>
          New Chat
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">🤖</div>
            <h3>Start a conversation</h3>
            <p>Ask questions about your uploaded documents and get AI-powered answers.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              <div className="bubble-label">
                {msg.role === 'user' ? 'You' : 'BotAssist'}
              </div>
              <div className="bubble-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {/* BUG: displays "Sources: undefined" when sources is undefined */}
              {msg.role === 'assistant' && (
                <div className="bubble-sources">
                  Sources: {msg.sources ? msg.sources.join(', ') : msg.sources}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="chat-bubble assistant">
            <div className="bubble-label">BotAssist</div>
            <div className="bubble-content typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
          rows={2}
        />
        {/* BUG: button is never disabled while loading */}
        <button className="btn btn-primary send-btn" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
