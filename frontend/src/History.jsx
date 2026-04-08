import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { fetchHistory, fetchSessionMessages, deleteSession, clearAllHistory } from './api';

function sessionTitle(session) {
  const raw = session.first_user_message || session.last_message || '';
  if (!raw) return 'Untitled Session';
  return raw.length > 60 ? raw.slice(0, 60).trimEnd() + '…' : raw;
}

export default function History({ setError, onOpenSession }) {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingId, setLoadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const LIMIT = 10;

  useEffect(() => {
    loadHistory();
  }, [page, searchTerm]);

  const loadHistory = async () => {
    try {
      const data = await fetchHistory(page, LIMIT);
      if (data && data.sessions) {
        setSessions(data.sessions);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load history.');
    }
  };

  const handleSelectSession = async (session) => {
    if (loadingId || deletingId) return;
    setLoadingId(session.session_id);
    try {
      const data = await fetchSessionMessages(session.session_id);
      onOpenSession(session.session_id, data.messages || []);
    } catch (err) {
      setError(err.message || 'Failed to load session messages.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteSession = async (e, session) => {
    e.stopPropagation(); // don't open the session
    if (!window.confirm(`Delete "${sessionTitle(session)}"?`)) return;
    setDeletingId(session.session_id);
    try {
      await deleteSession(session.session_id);
      setSessions((prev) => prev.filter((s) => s.session_id !== session.session_id));
      setTotalCount((c) => c - 1);
    } catch (err) {
      setError(err.message || 'Failed to delete session.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all chat history? This cannot be undone.')) return;
    setClearingAll(true);
    try {
      await clearAllHistory();
      setSessions([]);
      setTotalCount(0);
    } catch (err) {
      setError(err.message || 'Failed to clear history.');
    } finally {
      setClearingAll(false);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    sessionTitle(s).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / LIMIT);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Chat History</h2>
        {sessions.length > 0 && (
          <button
            className="btn btn-outline btn-sm"
            onClick={handleClearAll}
            disabled={clearingAll}
            style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive) / 0.4)' }}
          >
            <Trash2 size={14} />
            {clearingAll ? 'Clearing…' : 'Clear All'}
          </button>
        )}
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
              style={{
                opacity: loadingId === session.session_id || deletingId === session.session_id ? 0.5 : 1,
                cursor: loadingId || deletingId ? 'wait' : 'pointer',
              }}
            >
              <div className="history-card-body">
                <div className="history-card-title">{sessionTitle(session)}</div>
                <div className="history-card-meta">
                  <span>{formatDate(session.created_at)}</span>
                  <span>{session.message_count} messages</span>
                </div>
                <div className="history-card-preview">
                  {session.last_message || 'No messages'}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm history-delete-btn"
                onClick={(e) => handleDeleteSession(e, session)}
                disabled={deletingId === session.session_id}
                title="Delete session"
              >
                <Trash2 size={15} />
              </button>
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
