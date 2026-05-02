import './Auth.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

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
      <div className="auth-card">
        <div className="auth-logo">
          <h1>⚡ TaskFlow</h1>
          <p>Create your account</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input id="signup-name" type="text" className="form-input" placeholder="John Doe"
              value={form.name} onChange={e => setForm(f=>({...f, name:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input id="signup-email" type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span style={{color:'var(--text-muted)',fontSize:'0.75rem'}}>(min 6 chars)</span></label>
            <input id="signup-password" type="password" className="form-input" placeholder="••••••••"
              value={form.password} onChange={e => setForm(f=>({...f, password:e.target.value}))} required />
          </div>
          <button id="signup-submit" type="submit" className="btn btn-primary" disabled={loading} style={{marginTop:'0.5rem'}}>
            {loading ? 'Creating account...' : 'Get Started →'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
        <p style={{textAlign:'center',fontSize:'0.72rem',color:'var(--text-muted)',marginTop:'1rem'}}>
          New accounts default to Member role. Ask an Admin to upgrade.
        </p>
      </div>
    </div>
  );
}
