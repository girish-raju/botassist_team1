import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { fetchHistory, fetchSessionMessages } from './api';

export default function History({ setError }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const LIMIT = 10;

  // BUG: missing `searchTerm` in dependency array — search doesn't trigger refetch
  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    const data = await fetchHistory(page, LIMIT);
    if (data && data.sessions) {
      setSessions(data.sessions);
      setTotalCount(data.total || 0);
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setLoadingMessages(true);
    const data = await fetchSessionMessages(session.session_id);
    if (data && data.messages) {
      setSessionMessages(data.messages);
    } else {
      setError('Failed to load session messages.');
    }
    setLoadingMessages(false);
  };

  const handleBack = () => {
    setSelectedSession(null);
    setSessionMessages([]);
  };

  // BUG: case-sensitive search — "Hello" won't match "hello"
  const filteredSessions = sessions.filter((s) =>
    (s.title || s.session_id).includes(searchTerm)
  );

  // BUG: Math.floor instead of Math.ceil — last page of results is lost
  const totalPages = Math.floor(totalCount / LIMIT);

  // BUG: raw ISO date strings displayed without formatting
  const formatDate = (dateStr) => {
    return dateStr;
  };

  if (selectedSession) {
    return (
      <div className="history-container">
        <div className="history-header">
          <button className="btn btn-outline btn-sm" onClick={handleBack}>
            <ArrowLeft size={14} />
            Back
          </button>
          <h2>Session: {selectedSession.title || selectedSession.session_id}</h2>
        </div>

        <div className="session-messages">
          {loadingMessages ? (
            <div className="loading-spinner">Loading messages...</div>
          ) : (
            sessionMessages.map((msg, idx) => (
              <div key={idx} className={`history-bubble ${msg.role}`}>
                <div className="bubble-label">
                  {msg.role === 'user' ? 'You' : 'BotAssist'}
                </div>
                <div className="bubble-content">
                  <p>{msg.content}</p>
                </div>
                <div className="bubble-time">{formatDate(msg.timestamp)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Chat History</h2>
      </div>

      <div className="history-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="sessions-list">
        {filteredSessions.length === 0 ? (
          <div className="sessions-empty">
            <p>No chat sessions found.</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.session_id}
              className="history-card"
              onClick={() => handleSelectSession(session)}
            >
              <div className="history-card-title">
                {session.title || 'Untitled Session'}
              </div>
              <div className="history-card-meta">
                <span>{formatDate(session.created_at)}</span>
                <span>{session.message_count} messages</span>
              </div>
              <div className="history-card-preview">
                {session.last_message || 'No messages'}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline btn-sm btn-icon"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline btn-sm btn-icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
