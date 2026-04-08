import React, { useState, useEffect } from 'react';
import { MessageSquare, FileUp, Clock, LogOut } from 'lucide-react';
import Chat from './Chat';
import Upload from './Upload';
import History from './History';
import Landing from './Landing';
import { SignIn, SignUp } from './AuthPages';

const TABS = [
  { key: 'chat', label: 'Chat', icon: MessageSquare },
  { key: 'documents', label: 'Documents', icon: FileUp },
  { key: 'history', label: 'History', icon: Clock },
];

export default function App() {
  const [screen, setScreen] = useState('landing'); // 'landing' | 'signin' | 'signup' | 'app'
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [error, setError] = useState(null);
  const [resumeSession, setResumeSession] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('botassist_token');
    const savedUser = localStorage.getItem('botassist_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setScreen('app');
      } catch (_) {
        localStorage.removeItem('botassist_token');
        localStorage.removeItem('botassist_user');
      }
    }
  }, []);

  const handleSignIn = (userData) => {
    setUser(userData);
    setScreen('app');
    setError(null);
  };

  const handleSignUp = (userData) => {
    setUser(userData);
    setScreen('app');
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('botassist_token');
    localStorage.removeItem('botassist_user');
    setUser(null);
    setScreen('landing');
    setActiveTab('chat');
    setResumeSession(null);
    setError(null);
  };

  const handleTabSwitch = (tabKey) => {
    setActiveTab(tabKey);
    setError(null);
  };

  const handleOpenSession = (sessionId, messages) => {
    setResumeSession({ sessionId, messages });
    setActiveTab('chat');
    setError(null);
  };

  if (screen === 'landing') {
    return (
      <Landing
        onSignIn={() => setScreen('signin')}
        onSignUp={() => setScreen('signup')}
      />
    );
  }

  if (screen === 'signin') {
    return (
      <SignIn
        onSignIn={handleSignIn}
        onGoSignUp={() => setScreen('signup')}
        onBack={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <SignUp
        onSignUp={handleSignUp}
        onGoSignIn={() => setScreen('signin')}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // Main app
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
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-email">{user.email}</span>
              </div>
            </div>
          )}
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
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
