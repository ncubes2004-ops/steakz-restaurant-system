import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_DASH: Record<string, string> = {
  ADMIN: '/admin',
  HQ_MANAGER: '/hq',
  BRANCH_MANAGER: '/branch-manager',
  CHEF: '/chef',
  CASHIER: '/cashier',
  CUSTOMER: '/customer',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate(ROLE_DASH[data.user.role] ?? '/');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed.');
    }
  }

  return (
    <div className="auth-wrapper auth-steak">
      <div className="auth-box auth-box-steak">
        <h2>Welcome Back</h2>
        <p>Sign in to your Steakz account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
        </form>
        <p style={{ marginTop: '1.2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No account? <Link to="/register" style={{ color: 'var(--gold-light)' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
