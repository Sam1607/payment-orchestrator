import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWallets, deposit, withdraw } from '../api/index.js';
import './Wallet.css';

// Seed demo data when backend is not connected
const DEMO_WALLETS = [
  { walletId: 'demo-w1', currency: 'USD', balance: 1250.00 },
  { walletId: 'demo-w2', currency: 'EUR', balance: 430.50  },
  { walletId: 'demo-w3', currency: 'GBP', balance: 200.00  },
];

export default function Wallet() {
  const { user } = useAuth();

  const [wallets,   setWallets]   = useState(DEMO_WALLETS);
  const [loading,   setLoading]   = useState(false);
  const [feedback,  setFeedback]  = useState(null); // { type: 'success'|'error', msg }
  const [isDemo,    setIsDemo]    = useState(true);

  const [form, setForm] = useState({
    walletId: '',
    action:   'deposit',
    amount:   '',
    currency: 'USD',
  });

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWallets(user.id);
      if (res.data && res.data.length > 0) {
        setWallets(res.data);
        setIsDemo(false);
      } else {
        setFeedback({ type: 'error', msg: 'No wallets found for this user in the database.' });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Cannot reach backend.';
      setFeedback({ type: 'error', msg: `Failed to load wallets: ${msg}` });
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', msg: 'Amount must be a positive number.' });
      return;
    }

    try {
      setLoading(true);
      // Use walletId matching selected currency, or fall back to any wallet the user owns
      const targetWalletId =
        wallets.find(w => w.currency === form.currency)?.walletId ||
        wallets[0]?.walletId;

      if (!targetWalletId || targetWalletId.startsWith('demo-')) {
        // Demo mode — simulate locally
        setWallets(prev => prev.map(w => {
          if (w.currency === form.currency) {
            const delta = form.action === 'deposit' ? amt : -amt;
            return { ...w, balance: Math.max(0, w.balance + delta) };
          }
          return w;
        }));
        setFeedback({ type: 'success', msg: `[Demo] ${form.action === 'deposit' ? 'Deposited' : 'Withdrew'} ${amt} ${form.currency}.` });
        setForm(f => ({ ...f, amount: '' }));
        return;
      }

      if (form.action === 'deposit') {
        await deposit(targetWalletId, amt, form.currency);
      } else {
        await withdraw(targetWalletId, amt, form.currency);
      }
      setFeedback({ type: 'success', msg: `${form.action === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${amt} ${form.currency} successful!` });
      setForm(f => ({ ...f, amount: '' }));
      fetchWallets();
    } catch (err) {
      // Show the real backend error message
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      setFeedback({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wallet-page">
      <h2 className="page-title">My Wallets</h2>

      {/* Balance cards */}
      <div className="wallet-cards">
        {wallets.map(w => (
          <div key={w.walletId || w.id} className="wallet-card">
            <span className="wc-currency">{w.currency}</span>
            <span className="wc-balance">{Number(w.balance).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Deposit / Withdraw form */}
      <div className="wallet-form-card">
        <h3 className="form-title">Deposit / Withdraw</h3>

        {feedback && (
          <div className={`alert ${feedback.type}`}>
            {feedback.msg}
            <button className="alert-close" onClick={() => setFeedback(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Action
            <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>
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

          <div className="full">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing…' : form.action === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
