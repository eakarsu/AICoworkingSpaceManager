import { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const autoFill = () => {
    setEmail('admin@coworkspace.com');
    setPassword('password123');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🏢</div>
          <h1>CoWork Space</h1>
          <p>AI-Powered Coworking Space Manager</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="toast toast-error" style={{ position: 'relative', margin: '0 0 16px 0' }}><div className="toast-message">{error}</div></div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }} onClick={autoFill}>
            Auto-Fill Demo Credentials
          </button>
        </form>
      </div>
    </div>
  );
}
