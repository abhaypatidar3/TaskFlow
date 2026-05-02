import './Auth.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const brandFeatures = [
  'Role-based access control (Admin & Member)',
  'Project & task lifecycle management',
  'Time tracking & work logs',
  'Performance analytics & heatmaps',
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      login(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
          <h2>Welcome<br />back to <em>TaskFlow</em></h2>
          <p>
            Your team's command centre for projects, tasks,
            and performance — all in one place.
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
            <h1>Sign In</h1>
            <p>Enter your credentials to access your workspace</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/signup">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
