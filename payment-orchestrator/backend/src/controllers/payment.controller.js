// controllers/payment.controller.js
const pool = require('../db.config');
const { randomUUID } = require('crypto');

// Extract a bare UUID from a value that might be a full URL or already a UUID
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
function extractUUID(value) {
  if (!value) return value;
  const match = String(value).match(UUID_REGEX);
  return match ? match[0] : value;
}

// POST /payments  —  transfer between wallets
const sendPayment = async (req, res) => {
  try {
    let { fromWalletId, toWalletId, fromUserId, toUserId, amount, currency } = req.body;

    // Sanitize: extract bare UUID in case a full URL was accidentally passed
    fromWalletId = extractUUID(fromWalletId);
    toWalletId   = extractUUID(toWalletId);
    fromUserId   = extractUUID(fromUserId);
    toUserId     = extractUUID(toUserId);

    // Read idempotency key from header (per spec: Idempotency-Key: <value>)
    const idempotencyKey = req.headers['idempotency-key'] || null;

    if (!amount || !currency) {
      return res.status(400).json({ error: 'amount and currency are required' });
    }

    // Resolve wallet IDs from user IDs when wallet IDs are not provided directly
    if (!fromWalletId && fromUserId) {
      const found = await pool.query('SELECT id FROM wallets WHERE user_id = $1 LIMIT 1', [fromUserId]);
      if (found.rows.length === 0) return res.status(404).json({ error: 'Sender wallet not found' });
      fromWalletId = found.rows[0].id;
    }
    if (!toWalletId && toUserId) {
      const found = await pool.query('SELECT id FROM wallets WHERE user_id = $1 LIMIT 1', [toUserId]);
      if (found.rows.length === 0) return res.status(404).json({ error: 'Recipient wallet not found' });
      toWalletId = found.rows[0].id;
    }

    if (!fromWalletId || !toWalletId) {
      return res.status(400).json({ error: 'fromWalletId/fromUserId and toWalletId/toUserId are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Idempotency: return existing result if key already used
      if (idempotencyKey) {
        const existing = await client.query(
          'SELECT * FROM payments WHERE idempotency_key = $1',
          [idempotencyKey]
        );
        if (existing.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(200).json(existing.rows[0]);
        }
      }

      // Pessimistic lock on sender balance to prevent race conditions
      const senderBalance = await client.query(
        'SELECT balance FROM wallet_balances WHERE wallet_id = $1 AND currency = $2 FOR UPDATE',
        [fromWalletId, currency]
      );

      if (senderBalance.rows.length === 0 || Number(senderBalance.rows[0].balance) < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Deduct from sender
      await client.query(
        'UPDATE wallet_balances SET balance = balance - $1 WHERE wallet_id = $2 AND currency = $3',
        [amount, fromWalletId, currency]
      );

      // Credit receiver (upsert in case they don't hold that currency yet)
      await client.query(
        `INSERT INTO wallet_balances (wallet_id, currency, balance)
         VALUES ($1, $2, $3)
         ON CONFLICT (wallet_id, currency) DO UPDATE SET balance = wallet_balances.balance + $3`,
        [toWalletId, currency, amount]
      );

      // Record payment
      const paymentRes = await client.query(
        `INSERT INTO payments (id, from_wallet_id, to_wallet_id, amount, currency, status, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6)
         RETURNING *`,
        [randomUUID(), fromWalletId, toWalletId, amount, currency, idempotencyKey || null]
      );
      const payment = paymentRes.rows[0];

      // Append-only ledger entries
      await client.query(
        `INSERT INTO ledger (id, wallet_id, type, amount, currency, reference_id)
         VALUES ($1, $2, 'DEBIT', $3, $4, $5), ($6, $7, 'CREDIT', $3, $4, $5)`,
        [randomUUID(), fromWalletId, amount, currency, payment.id, randomUUID(), toWalletId]
      );

      await client.query('COMMIT');
      res.status(201).json(payment);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[sendPayment] error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /payments?userId=...
const getPayments = async (req, res) => {
  const { userId } = req.query;

  try {
    if (userId) {
      const walletsRes = await pool.query(
        'SELECT id FROM wallets WHERE user_id = $1',
        [userId]
      );
      const walletIds = walletsRes.rows.map((r) => r.id);
      if (walletIds.length === 0) return res.json([]);

      const result = await pool.query(
        `SELECT * FROM payments
         WHERE from_wallet_id = ANY($1) OR to_wallet_id = ANY($1)
         ORDER BY created_at DESC`,
        [walletIds]
      );
      return res.json(result.rows);
    }

    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { sendPayment, getPayments };
