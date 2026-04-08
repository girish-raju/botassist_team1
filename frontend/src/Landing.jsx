import React from 'react';
import { MessageSquare, FileText, Search, ArrowRight, Shield, Zap, Database } from 'lucide-react';

export default function Landing({ onSignIn, onSignUp }) {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="landing-logo-icon">B</span>
            <span>BotAssist</span>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-btn-ghost" onClick={onSignIn}>Sign In</button>
            <button className="landing-btn-primary" onClick={onSignUp}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">AI-Powered Document Intelligence</div>
          <h1 className="landing-hero-title">
            Ask anything about<br />your documents
          </h1>
          <p className="landing-hero-subtitle">
            Upload your documents and get instant, accurate answers powered by Claude AI.
            No more searching through files manually.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-btn-primary landing-btn-lg" onClick={onSignUp}>
              Start for Free <ArrowRight size={18} />
            </button>
            <button className="landing-btn-ghost landing-btn-lg" onClick={onSignIn}>
              Sign In
            </button>
          </div>
        </div>

        {/* Hero visual */}
        <div className="landing-hero-visual">
          <div className="landing-chat-preview">
            <div className="landing-chat-msg landing-chat-msg-user">
              What are the key findings in the Q3 report?
            </div>
            <div className="landing-chat-msg landing-chat-msg-ai">
              <div className="landing-chat-ai-header">
                <span className="landing-ai-dot"></span> BotAssist
              </div>
              Based on the Q3 report, the key findings are: revenue grew 23% YoY, customer acquisition cost decreased by 15%, and the new product line exceeded targets by 40%...
              <div className="landing-chat-source">
                <FileText size={11} /> Q3_Report.pdf · Page 4
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-features-inner">
          <h2 className="landing-section-title">Everything you need</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><Zap size={20} /></div>
              <h3>Instant Answers</h3>
              <p>Get accurate answers from your documents in seconds, not hours.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><Shield size={20} /></div>
              <h3>Source Citations</h3>
              <p>Every answer includes exact source references so you can verify.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><Database size={20} /></div>
              <h3>Multi-Document</h3>
              <p>Upload multiple documents and query across all of them at once.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><Search size={20} /></div>
              <h3>Chat History</h3>
              <p>All your conversations are saved and searchable for future reference.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>Ready to get started?</h2>
          <p>Join teams using BotAssist to unlock knowledge in their documents.</p>
          <button className="landing-btn-primary landing-btn-lg" onClick={onSignUp}>
            Create Free Account <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span>© 2025 BotAssist. All rights reserved.</span>
          <span>Powered by Claude AI</span>
        </div>
      </footer>
    </div>
  );
}
