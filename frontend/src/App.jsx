import React, { useState } from 'react';
import Chat from './Chat';
import Upload from './Upload';
import History from './History';

const TABS = [
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'documents', label: 'Documents', icon: '📄' },
  { key: 'history', label: 'History', icon: '🕓' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [error, setError] = useState(null);

  // BUG: error is never cleared when switching tabs
  const handleTabSwitch = (tabKey) => {
    setActiveTab(tabKey);
    // Should call setError(null) here but doesn't
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>BotAssist</h1>
          <span className="sidebar-subtitle">AI Document Chat</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`sidebar-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabSwitch(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
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

        {activeTab === 'chat' && <Chat setError={setError} />}
        {activeTab === 'documents' && <Upload setError={setError} />}
        {activeTab === 'history' && <History setError={setError} />}
      </main>
    </div>
  );
}
