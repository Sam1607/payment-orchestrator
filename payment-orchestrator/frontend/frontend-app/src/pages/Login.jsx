import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (login(email, password)) navigate('/');
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">💳</div>
        <h1 className="login-title">PayOrchestrator</h1>
        <p className="login-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alice@demo.com"
              required
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary login-btn">Sign in</button>
        </form>

        <div className="demo-creds">
          <p className="demo-label">Demo credentials</p>
          <table>
            <thead><tr><th>Role</th><th>Email</th><th>Password</th></tr></thead>
            <tbody>
              <tr><td><span className="badge user">USER</span></td>    <td>shubham@demo.com</td><td>pass</td></tr>
              <tr><td><span className="badge admin">ADMIN</span></td>  <td>rajan@demo.com</td>  <td>pass</td></tr>
              <tr><td><span className="badge auditor">AUDITOR</span></td><td>sammy@demo.com</td><td>pass</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
