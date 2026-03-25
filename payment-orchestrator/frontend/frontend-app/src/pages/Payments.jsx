import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendPayment, getPayments } from '../api/index.js';
import './Payments.css';

function generateIdempotencyKey() {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
const DEMO_TX = [
  { id: 'tx1', from: 'u1', to: 'u2', amount: 50,  currency: 'USD', status: 'SETTLED',     createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx2', from: 'u2', to: 'u1', amount: 20,  currency: 'EUR', status: 'SETTLED',     createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'tx3', from: 'u1', to: 'u3', amount: 100, currency: 'USD', status: 'REVERSED',    createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const STATUS_COLOR = {
  REQUESTED: '#fbbf24',
  RESERVED:  '#60a5fa',
  SETTLED:   '#34d399',
  REVERSED:  '#f87171',
  FAILED:    '#f87171',
};

export default function Payments() {
  const { user } = useAuth();
  const [txList,    setTxList]    = useState(DEMO_TX);
  const [loading,   setLoading]   = useState(false);
  const [feedback,  setFeedback]  = useState(null);

  const [form, setForm] = useState({
    toUserId:       '',
    amount:         '',
    currency:       'USD',
    idempotencyKey: generateIdempotencyKey(),
    note:           '',
  });

  const fetchPayments = useCallback(async () => {
    try {
      const res = await getPayments(user.id);
      setTxList(res.data);
    } catch {
      // keep demo data
    }
  }, [user.id]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', msg: 'Amount must be positive.' });
      return;
    }
    if (!form.toUserId.trim()) {
      setFeedback({ type: 'error', msg: 'Recipient ID is required.' });
      return;
    }

    try {
      setLoading(true);
      await sendPayment(
        {
          fromUserId: user.id,
          toUserId:   form.toUserId.trim(),
          amount:     amt,
          currency:   form.currency,
          note:       form.note,
        },
        form.idempotencyKey
      );
      setFeedback({ type: 'success', msg: `Payment of ${amt} ${form.currency} sent!` });
      fetchPayments();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Request failed.';
      setFeedback({ type: 'error', msg });
    } finally {
      setLoading(false);
      setForm(f => ({ ...f, amount: '', toUserId: '', note: '', idempotencyKey: generateIdempotencyKey() }));
    }
  }

  return (
    <div className="payments-page">
      <h2 className="page-title">Payments</h2>

      <div className="payments-layout">
        {/* ── Send form ── */}
        <div className="wallet-form-card">
          <h3 className="form-title">Send Money</h3>

          {feedback && (
            <div className={`alert ${feedback.type}`}>
              {feedback.msg}
              <button className="alert-close" onClick={() => setFeedback(null)}>✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid">
            <label className="full">
              Recipient User ID
              <input
                type="text"
                placeholder="e.g. b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12"
                value={form.toUserId}
                onChange={e => setForm(f => ({ ...f, toUserId: e.target.value }))}
                required
              />
              <span className="hint">Enter the recipient&apos;s User UUID from the database.</span>
            </label>

            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </label>

            <label>
              Currency
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>JPY</option>
              </select>
            </label>

            <label className="full">
              Idempotency Key
              <div className="idem-row">
                <input
                  type="text"
                  value={form.idempotencyKey}
                  onChange={e => setForm(f => ({ ...f, idempotencyKey: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setForm(f => ({ ...f, idempotencyKey: generateIdempotencyKey() }))}
                >
                  Regen
                </button>
              </div>
              <span className="hint">Prevents duplicate payments on retry.</span>
            </label>

            <label className="full">
              Note (optional)
              <input
                type="text"
                placeholder="Rent, lunch…"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              />
            </label>

            <div className="full">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending…' : 'Send Payment'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Transaction history ── */}
        <div className="tx-history">
          <h3 className="form-title">My Transactions</h3>
          {txList.length === 0 ? (
            <p className="empty-msg">No transactions yet.</p>
          ) : (
            <table className="tx-table">
              <thead>
                <tr>
                  <th>ID</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {txList.map(tx => (
                  <tr key={tx.id}>
                    <td className="mono">{tx.id}</td>
                    <td className="mono">{tx.from_wallet_id || tx.from}</td>
                    <td className="mono">{tx.to_wallet_id || tx.to}</td>
                    <td className="amount">{tx.amount} {tx.currency}</td>
                    <td>
                      <span className="status-pill" style={{ background: STATUS_COLOR[tx.status] + '30', color: STATUS_COLOR[tx.status] }}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="date">{new Date(tx.created_at || tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
