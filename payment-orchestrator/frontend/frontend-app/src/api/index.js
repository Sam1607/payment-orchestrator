import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ── Wallet ──────────────────────────────────────────────────
export const getWallets = (userId) => api.get(`/wallets/${userId}`);
export const getBalance = (walletId) => api.get(`/wallets/${walletId}/balance`);
export const deposit    = (walletId, amount, currency) =>
  api.post(`/wallets/${walletId}/deposit`,  { amount, currency });
export const withdraw   = (walletId, amount, currency) =>
  api.post(`/wallets/${walletId}/withdraw`, { amount, currency });

// ── Payments ─────────────────────────────────────────────────
export const sendPayment = (payload, idempotencyKey) =>
  api.post('/payments', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
export const getPayments = (userId)  => api.get(`/payments?userId=${userId}`);

// ── Ledger ───────────────────────────────────────────────────
export const getLedger      = ()            => api.get('/ledger');
export const getUserLedger  = (userId)      => api.get(`/ledger?userId=${userId}`);

// ── Admin ────────────────────────────────────────────────────
export const reverseTransaction = (txId) => api.post(`/payments/${txId}/reverse`);
export const getAllPayments      = ()     => api.get('/admin/payments');

export default api;
