import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV = [
  { path: '/',         label: 'Dashboard', roles: ['USER','ADMIN','AUDITOR'] },
  { path: '/wallet',   label: 'Wallet',    roles: ['USER','ADMIN']           },
  { path: '/payments', label: 'Payments',  roles: ['USER','ADMIN']           },
  { path: '/ledger',   label: 'Ledger',    roles: ['USER','ADMIN','AUDITOR'] },
  { path: '/admin',    label: 'Admin',     roles: ['ADMIN']                  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const links = NAV.filter(n => !user || n.roles.includes(user.role));

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-icon">💳</span>
          <span className="brand-name">PayOrchestrator</span>
        </div>
        <nav className="topbar-nav">
          {links.map(n => (
            <Link
              key={n.path}
              to={n.path}
              className={`nav-link${pathname === n.path ? ' active' : ''}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="topbar-user">
            <span className="user-badge" data-role={user.role}>{user.role}</span>
            <span className="user-name">{user.name}</span>
            <button className="btn-logout" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </header>
      <main className="page-content">{children}</main>
    </div>
  );
}
