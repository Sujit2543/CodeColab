import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // verifying | valid | invalid | success
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-reset-token/${token}`);
        if (data.valid) {
          setUsername(data.username);
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch {
        setStatus('invalid');
      }
    };
    verify();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4
    : 3;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'var(--danger)', 'var(--warning)', '#3fb950', '#388bfd'];

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💻</div>
          CodeCollab
        </div>

        {/* ── Verifying ──────────────────────────────────── */}
        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)' }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>🔑</div>
            <p>Verifying your reset link…</p>
          </div>
        )}

        {/* ── Invalid / Expired ──────────────────────────── */}
        {status === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link invalid or expired</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              This password reset link is either invalid or has expired (links expire after 1 hour).
            </p>
            <Link to="/forgot-password" className="btn btn-primary btn-full" style={{ display: 'flex', marginBottom: 10 }}>
              Request a new link →
            </Link>
            <Link to="/login" className="btn btn-ghost btn-full" style={{ display: 'flex' }}>
              ← Back to Sign in
            </Link>
          </div>
        )}

        {/* ── Success ────────────────────────────────────── */}
        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Password reset!</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Your password has been updated successfully. Redirecting you to sign in…
            </p>
            <div style={{
              height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 20
            }}>
              <div style={{
                height: '100%', background: 'var(--green)',
                animation: 'progressBar 3s linear forwards',
                borderRadius: 2,
              }} />
            </div>
            <Link to="/login" className="btn btn-primary btn-full" style={{ display: 'flex' }}>
              Sign in now →
            </Link>
          </div>
        )}

        {/* ── Reset Form ─────────────────────────────────── */}
        {status === 'valid' && (
          <>
            <h1 className="auth-title">Create new password</h1>
            <p className="auth-subtitle">
              Hi <strong style={{ color: 'var(--text)' }}>{username}</strong>, set a strong new password below.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                    autoComplete="new-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text3)', fontSize: 14, padding: 4,
                    }}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{
                      display: 'flex', gap: 3, marginBottom: 4
                    }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= strength ? strengthColor[strength] : 'var(--bg4)',
                          transition: 'background 0.2s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 600 }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm">Confirm Password</label>
                <input
                  id="confirm"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{
                    borderColor: confirm && confirm !== password ? 'var(--danger)' : undefined,
                  }}
                />
                {confirm && confirm !== password && (
                  <span className="form-hint" style={{ color: 'var(--danger)' }}>
                    Passwords don't match
                  </span>
                )}
                {confirm && confirm === password && (
                  <span className="form-hint" style={{ color: 'var(--green)' }}>
                    ✓ Passwords match
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading || password !== confirm || password.length < 6}
                style={{ marginTop: 4 }}
              >
                {loading ? 'Updating password…' : 'Set new password →'}
              </button>
            </form>

            <p className="auth-footer">
              <Link to="/login">← Back to Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
