import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      // Only show success if backend confirmed it
      if (data.message) setSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo" style={{ justifyContent: 'center' }}>
            <div className="auth-logo-icon">💻</div>
            CodeCollab
          </div>
          <div style={{ fontSize: 52, margin: '16px 0' }}>📬</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Check your inbox</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            We've sent a password reset link to<br />
            <strong style={{ color: 'var(--text)' }}>{email}</strong>.<br />
            The link expires in <strong style={{ color: 'var(--text)' }}>1 hour</strong>.
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left', fontSize: 12, marginBottom: 16 }}>
            💡 Don't see it? Check your <strong>spam / junk</strong> folder.
          </div>
          <button onClick={() => { setSent(false); setEmail(''); }}
            className="btn btn-secondary btn-full" style={{ marginBottom: 8 }}>
            Try a different email
          </button>
          <Link to="/login" className="btn btn-primary btn-full" style={{ display: 'flex' }}>
            ← Back to Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💻</div>
          CodeCollab
        </div>

        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-subtitle">Enter your registered email and we'll send a reset link.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="fp-email">Email address</label>
            <input
              id="fp-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? '⏳ Sending…' : 'Send reset link →'}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
