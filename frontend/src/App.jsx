import React, { useState } from 'react';
import { MessageSquare, FileUp, Clock } from 'lucide-react';
import Chat from './Chat';
import Upload from './Upload';
import History from './History';

const TABS = [
  { key: 'chat', label: 'Chat', icon: MessageSquare },
  { key: 'documents', label: 'Documents', icon: FileUp },
  { key: 'history', label: 'History', icon: Clock },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [error, setError] = useState(null);
  // When a history session is opened, store { sessionId, messages } here
  const [resumeSession, setResumeSession] = useState(null);

  const handleTabSwitch = (tabKey) => {
    setActiveTab(tabKey);
    setError(null);
  };

  const handleOpenSession = (sessionId, messages) => {
    setResumeSession({ sessionId, messages });
    setActiveTab('chat');
    setError(null);
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>BotAssist</h1>
          <span className="sidebar-subtitle">AI Document Chat</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className={`sidebar-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabSwitch(tab.key)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <p>Powered by AI</p>
        </div>
      </aside>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <Chat
            setError={setError}
            resumeSession={resumeSession}
            onSessionResumed={() => setResumeSession(null)}
            onGoToDocuments={() => handleTabSwitch('documents')}
          />
        )}
        {activeTab === 'documents' && <Upload setError={setError} />}
        {activeTab === 'history' && (
          <History setError={setError} onOpenSession={handleOpenSession} />
        )}
      </main>
    </div>
  );
}
