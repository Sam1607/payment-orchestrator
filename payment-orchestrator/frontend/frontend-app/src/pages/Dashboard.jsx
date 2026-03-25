import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const ROLE_DESC = {
  USER:    'You can manage your wallets, send payments, and view your ledger.',
  ADMIN:   'You have full access including transaction reversals and admin tools.',
  AUDITOR: 'You have read-only access to the full ledger and transaction history.',
};

const CARDS = [
  {
    path: '/wallet',
    icon: '🏦',
    title: 'Wallet',
    desc: 'Multi-currency wallets — deposit, withdraw, and check balances.',
    roles: ['USER', 'ADMIN'],
  },
  {
    path: '/payments',
    icon: '↗️',
    title: 'Payments',
    desc: 'Send P2P transfers with idempotency keys and double-spend protection.',
    roles: ['USER', 'ADMIN'],
  },
  {
    path: '/ledger',
    icon: '📒',
    title: 'Ledger',
    desc: 'Immutable, append-only transaction ledger with full audit trail.',
    roles: ['USER', 'ADMIN', 'AUDITOR'],
  },
  {
    path: '/admin',
    icon: '🔧',
    title: 'Admin',
    desc: 'Reverse transactions and manage all payments across users.',
    roles: ['ADMIN'],
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  const visible = CARDS.filter(c => c.roles.includes(user?.role));

  return (
    <div className="dashboard">
      <div className="dash-hero">
        <h1 className="dash-title">Welcome back, {user?.name} 👋</h1>
        <p className="dash-subtitle">{ROLE_DESC[user?.role]}</p>
      </div>

      <div className="dash-grid">
        {visible.map(card => (
          <Link key={card.path} to={card.path} className="dash-card">
            <span className="dash-card-icon">{card.icon}</span>
            <h3 className="dash-card-title">{card.title}</h3>
            <p className="dash-card-desc">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
