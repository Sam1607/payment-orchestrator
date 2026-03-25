import { useState, useEffect, useCallback } from 'react';
import { getAllPayments, reverseTransaction } from '../api/index.js';
import './Admin.css';

// ── Demo data ────────────────────────────────────────────────
const DEMO_ALL_TX = [
  { id: 'tx1', from: 'u1', to: 'u2', amount: 50,  currency: 'USD', status: 'SETTLED',  createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx2', from: 'u2', to: 'u1', amount: 20,  currency: 'EUR', status: 'SETTLED',  createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'tx3', from: 'u1', to: 'u3', amount: 100, currency: 'USD', status: 'REVERSED', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tx4', from: 'u3', to: 'u1', amount: 75,  currency: 'GBP', status: 'SETTLED',  createdAt: new Date(Date.now() - 43200000).toISOString() },
];

const STATUS_COLOR = {
  REQUESTED:  '#fbbf24',
  RESERVED:   '#60a5fa',
  COMPLETED:  '#34d399',
  SETTLED:    '#34d399',
  REVERSED:   '#f87171',
  FAILED:     '#f87171',
};

export default function Admin() {
  const [transactions, setTransactions] = useState(DEMO_ALL_TX);
  const [loading,      setLoading]      = useState(false);
  const [reversing,    setReversing]    = useState(null); // txId being reversed
  const [feedback,     setFeedback]     = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPayments();
      setTransactions(res.data);
    } catch {
      // keep demo data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleReverse(txId) {
    if (!window.confirm(`Reverse transaction ${txId}? This will create compensating ledger entries and cannot be undone.`)) return;

    try {
      setReversing(txId);
      await reverseTransaction(txId);
      setFeedback({ type: 'success', msg: `Transaction ${txId} reversed successfully.` });
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Backend not connected — demo mode.';
      // Simulate locally
      setTransactions(prev => prev.map(tx =>
        tx.id === txId ? { ...tx, status: 'REVERSED' } : tx
      ));
      setFeedback({ type: 'success', msg: `[Demo] Transaction ${txId} reversed. (${msg})` });
    } finally {
      setReversing(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2 className="page-title">Admin Panel</h2>
        <span className="admin-warn-badge">⚠️ Admin Only</span>
      </div>

      <p className="admin-desc">
        Reverse settled transactions. Each reversal produces new compensating ledger entries while keeping the original history intact.
      </p>

      {feedback && (
        <div className={`alert ${feedback.type}`} style={{ marginBottom: '1.25rem' }}>
          {feedback.msg}
          <button className="alert-close" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Transactions</span>
          <span className="stat-val">{transactions.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-val green">{transactions.filter(t => t.status === 'COMPLETED' || t.status === 'SETTLED').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Reversed</span>
          <span className="stat-val red">{transactions.filter(t => t.status === 'REVERSED').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Other</span>
          <span className="stat-val">{transactions.filter(t => !['COMPLETED','SETTLED','REVERSED'].includes(t.status)).length}</span>
        </div>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <p className="empty-msg">Loading…</p>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>ID</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td className="mono">{tx.id}</td>
                  <td className="mono">{tx.from_wallet_id || tx.from}</td>
                  <td className="mono">{tx.to_wallet_id || tx.to}</td>
                  <td className="amount">{tx.amount} {tx.currency}</td>
                  <td>
                    <span className="status-pill" style={{ background: (STATUS_COLOR[tx.status] || '#9ca3af') + '30', color: STATUS_COLOR[tx.status] || '#9ca3af' }}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="date">{new Date(tx.created_at || tx.createdAt).toLocaleString()}</td>
                  <td>
                    {(tx.status === 'COMPLETED' || tx.status === 'SETTLED') ? (
                      <button
                        className="btn-danger-sm"
                        disabled={reversing === tx.id}
                        onClick={() => handleReverse(tx.id)}
                      >
                        {reversing === tx.id ? '…' : 'Reverse'}
                      </button>
                    ) : (
                      <span className="no-action">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
