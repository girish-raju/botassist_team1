import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react';
import { signIn, signUp } from './api';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One number', ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="auth-pwd-checks">
      {checks.map((c) => (
        <li key={c.label} className={c.ok ? 'auth-pwd-check ok' : 'auth-pwd-check'}>
          {c.ok ? <Check size={11} /> : <X size={11} />} {c.label}
        </li>
      ))}
    </ul>
  );
}

function Field({ label, type, value, onChange, error, showToggle, onToggle, showPwd, autoComplete, placeholder }) {
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        <input
          className={`auth-input${error ? ' auth-input-error' : ''}`}
          type={showToggle ? (showPwd ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        {showToggle && (
          <button type="button" className="auth-eye-btn" onClick={onToggle} tabIndex={-1}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <span className="auth-field-error">{error}</span>}
    </div>
  );
}

export function SignIn({ onSignIn, onGoSignUp, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const data = await signIn(email.trim(), password);
      localStorage.setItem('botassist_token', data.token);
      localStorage.setItem('botassist_user', JSON.stringify(data.user));
      onSignIn(data.user);
    } catch (err) {
      setApiError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="auth-back-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="auth-brand">
          <span className="auth-brand-logo">B</span>
          <span className="auth-brand-name">BotAssist</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        {apiError && <div className="auth-api-error">{apiError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
            error={errors.email}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
            error={errors.password}
            showToggle
            showPwd={showPwd}
            onToggle={() => setShowPwd((v) => !v)}
            autoComplete="current-password"
            placeholder="Your password"
          />
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <button className="auth-link" onClick={onGoSignUp}>Create one</button>
        </p>
      </div>
    </div>
  );
}

export function SignUp({ onSignUp, onGoSignIn, onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required.';
    else if (name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(password)) e.password = 'Password must contain an uppercase letter.';
    else if (!/[0-9]/.test(password)) e.password = 'Password must contain a number.';
    if (!confirm) e.confirm = 'Please confirm your password.';
    else if (confirm !== password) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const data = await signUp(name.trim(), email.trim(), password);
      localStorage.setItem('botassist_token', data.token);
      localStorage.setItem('botassist_user', JSON.stringify(data.user));
      onSignUp(data.user);
    } catch (err) {
      setApiError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="auth-back-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="auth-brand">
          <span className="auth-brand-logo">B</span>
          <span className="auth-brand-name">BotAssist</span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start chatting with your documents</p>
        {apiError && <div className="auth-api-error">{apiError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
            error={errors.name}
            autoComplete="name"
            placeholder="John Doe"
          />
          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
            error={errors.email}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
            error={errors.password}
            showToggle
            showPwd={showPwd}
            onToggle={() => setShowPwd((v) => !v)}
            autoComplete="new-password"
            placeholder="Create a strong password"
          />
          <PasswordStrength password={password} />
          <Field
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((prev) => ({ ...prev, confirm: '' })); }}
            error={errors.confirm}
            showToggle
            showPwd={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            autoComplete="new-password"
            placeholder="Repeat your password"
          />
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account?{' '}
          <button className="auth-link" onClick={onGoSignIn}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
