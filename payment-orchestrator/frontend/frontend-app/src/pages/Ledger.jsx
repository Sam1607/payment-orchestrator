import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLedger, getUserLedger } from '../api/index.js';
import './Ledger.css';

// ── Demo ledger entries ─────────────────────────────────────
const DEMO_ENTRIES = [
  { id: 'le1', type: 'DEPOSIT',  userId: 'u1', walletId: 'w1', amount: 500,  currency: 'USD', ref: null,    createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'le2', type: 'DEBIT',    userId: 'u1', walletId: 'w1', amount: 50,   currency: 'USD', ref: 'tx1',   createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'le3', type: 'CREDIT',   userId: 'u2', walletId: 'w2', amount: 50,   currency: 'USD', ref: 'tx1',   createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'le4', type: 'DEPOSIT',  userId: 'u2', walletId: 'w2', amount: 200,  currency: 'EUR', ref: null,    createdAt: new Date(Date.now() - 86400000).toISOString()     },
  { id: 'le5', type: 'REVERSAL', userId: 'u1', walletId: 'w1', amount: 100,  currency: 'USD', ref: 'tx3',   createdAt: new Date(Date.now() - 3600000).toISOString()      },
  { id: 'le6', type: 'CREDIT',   userId: 'u1', walletId: 'w1', amount: 100,  currency: 'USD', ref: 'tx3-rev', createdAt: new Date(Date.now() - 3600000 + 1).toISOString() },
];

const TYPE_COLOR = {
  DEPOSIT:  '#34d399',
  CREDIT:   '#60a5fa',
  DEBIT:    '#f87171',
  WITHDRAW: '#f87171',
  REVERSAL: '#fbbf24',
  FEE:      '#a78bfa',
};

export default function Ledger() {
  const { user } = useAuth();
  const isAuditor = user?.role === 'AUDITOR';
  const isAdmin   = user?.role === 'ADMIN';

  const [entries,  setEntries]  = useState(DEMO_ENTRIES);
  const [filter,   setFilter]   = useState('ALL');
  const [search,   setSearch]   = useState('');

  const fetchLedger = useCallback(async () => {
    try {
      const res = isAuditor || isAdmin ? await getLedger() : await getUserLedger(user.id);
      setEntries(res.data);
    } catch {
      // keep demo data
    }
  }, [user.id, isAuditor, isAdmin]);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  const filtered = entries.filter(e => {
    const matchType   = filter === 'ALL' || e.type === filter;
    const matchSearch = !search || JSON.stringify(e).toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="ledger-page">
      <div className="ledger-header">
        <h2 className="page-title">Ledger</h2>
        <span className="immutable-badge">🔒 Append-only · Immutable</span>
      </div>

      <div className="ledger-controls">
        <input
          className="ledger-search"
          type="text"
          placeholder="Search by ID, user, ref…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="ledger-filter" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="ALL">All types</option>
          <option>DEPOSIT</option>
          <option>WITHDRAW</option>
          <option>DEBIT</option>
          <option>CREDIT</option>
          <option>REVERSAL</option>
          <option>FEE</option>
        </select>
      </div>

      <div className="ledger-table-wrap">
        <table className="tx-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Entry ID</th>
              <th>Type</th>
              {(isAuditor || isAdmin) && <th>User</th>}
              <th>Wallet</th>
              <th>Amount</th>
              <th>Ref</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="empty-msg">No entries found.</td></tr>
            ) : (
              filtered.map((e, i) => (
                <tr key={e.id}>
                  <td className="row-num">{i + 1}</td>
                  <td className="mono">{e.id}</td>
                  <td>
                    <span className="type-pill" style={{ background: (TYPE_COLOR[e.type] || '#9ca3af') + '25', color: TYPE_COLOR[e.type] || '#9ca3af' }}>
                      {e.type}
                    </span>
                  </td>
                  {(isAuditor || isAdmin) && <td className="mono">{e.userId || '—'}</td>}
                  <td className="mono">{e.wallet_id || e.walletId}</td>
                  <td className="amount">{Number(e.amount).toFixed(2)} {e.currency}</td>
                  <td className="mono">{e.reference_id ?? e.ref ?? '—'}</td>
                  <td className="date">{new Date(e.created_at || e.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="ledger-notice">
        Entries are never modified or deleted. Each row is an immutable fact about the system.
      </p>
    </div>
  );
}
