import './Auth.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const brandFeatures = [
  'Get started in under 2 minutes',
  'Free to use — no credit card needed',
  'Collaborate with your whole team',
  'Full analytics and reporting built-in',
];

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.signup(form);
      login(data.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Signup failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left: Branding ── */}
      <div className="auth-brand">
        <div className="auth-brand-content">
          <Link to="/" className="auth-brand-logo">
            <div className="auth-brand-logo-icon">⚡</div>
            <span>TaskFlow</span>
          </Link>
          <h2>Join <em>TaskFlow</em><br />today</h2>
          <p>
            Create your free account and start managing
            your team's projects, tasks, and performance.
          </p>
          <div className="auth-brand-features">
            {brandFeatures.map(f => (
              <div key={f} className="auth-brand-feature">
                <div className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <Link to="/" className="auth-back-link">← Back to home</Link>
          <div className="auth-logo">
            <h1>Create Account</h1>
            <p>Fill in the details below to get started</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                id="signup-name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Password <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 400 }}>(min 6 characters)</span>
              </label>
              <input
                id="signup-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button
              id="signup-submit"
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Get Started →'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
          <p className="auth-note">
            New accounts default to Member role.<br />
            Ask an Admin to upgrade your permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
