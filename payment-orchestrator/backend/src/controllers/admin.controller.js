// controllers/admin.controller.js
const pool = require('../db.config');
const { randomUUID } = require('crypto');

// POST /payments/:txId/reverse
const reverseTransaction = async (req, res) => {
  const { txId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const paymentRes = await client.query(
      'SELECT * FROM payments WHERE id = $1',
      [txId]
    );
    if (paymentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const payment = paymentRes.rows[0];
    if (payment.status === 'REVERSED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Transaction already reversed' });
    }

    // Restore sender balance
    await client.query(
      'UPDATE wallet_balances SET balance = balance + $1 WHERE wallet_id = $2 AND currency = $3',
      [payment.amount, payment.from_wallet_id, payment.currency]
    );

    // Deduct from receiver
    await client.query(
      'UPDATE wallet_balances SET balance = balance - $1 WHERE wallet_id = $2 AND currency = $3',
      [payment.amount, payment.to_wallet_id, payment.currency]
    );

    // Mark as reversed
    await client.query(
      "UPDATE payments SET status = 'REVERSED' WHERE id = $1",
      [txId]
    );

    // Append reversal ledger entries (original entries stay immutable)
    await client.query(
      `INSERT INTO ledger (id, wallet_id, type, amount, currency, reference_id)
       VALUES ($1, $2, 'CREDIT', $3, $4, $5), ($6, $7, 'DEBIT', $3, $4, $5)`,
      [randomUUID(), payment.from_wallet_id, payment.amount, payment.currency, txId, randomUUID(), payment.to_wallet_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Transaction reversed successfully', transactionId: txId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET /admin/payments
const getAllPayments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { reverseTransaction, getAllPayments };
