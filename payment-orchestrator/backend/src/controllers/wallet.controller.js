// controllers/wallet.controller.js
const pool = require('../db.config');
const { randomUUID } = require('crypto');

const getWallets = async (req, res) => {
  const { userId } = req.params;

  try {
    // 1️⃣ Get wallets
    const walletsRes = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    );

    const wallets = walletsRes.rows;

    // 2️⃣ For each wallet, get balances
    const result = [];

    for (const wallet of wallets) {
      const balancesRes = await pool.query(
        `SELECT currency, balance 
         FROM wallet_balances 
         WHERE wallet_id = $1`,
        [wallet.id]
      );

      for (const row of balancesRes.rows) {
        result.push({
          id: `${wallet.id}-${row.currency}`,
          walletId: wallet.id,
          userId: wallet.user_id,
          currency: row.currency,
          balance: Number(row.balance),
        });
      }
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /wallets/:walletId/balance
const getBalance = async (req, res) => {
  console.log(req,'req')
  const { walletId } = req.params;
  try {
    const result = await pool.query(
      'SELECT currency, balance FROM wallet_balances WHERE wallet_id = $1',
      [walletId]
    );
    res.json(result.rows.map((r) => ({ currency: r.currency, balance: Number(r.balance) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /wallets/:walletId/deposit
const deposit = async (req, res) => {
  const { walletId } = req.params;
  const { amount, currency } = req.body;

  if (!amount || !currency) {
    return res.status(400).json({ error: 'amount and currency are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO wallet_balances (wallet_id, currency, balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (wallet_id, currency) DO UPDATE SET balance = wallet_balances.balance + $3`,
      [walletId, currency, amount]
    );

    await client.query(
      `INSERT INTO ledger (id, wallet_id, type, amount, currency, reference_id)
       VALUES ($1, $2, 'CREDIT', $3, $4, $2)`,
      [randomUUID(), walletId, amount, currency]
    );

    await client.query('COMMIT');

    const updated = await pool.query(
      'SELECT currency, balance FROM wallet_balances WHERE wallet_id = $1 AND currency = $2',
      [walletId, currency]
    );
    res.json({ walletId, currency, balance: Number(updated.rows[0].balance) });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// POST /wallets/:walletId/withdraw
const withdraw = async (req, res) => {
  const { walletId } = req.params;
  const { amount, currency } = req.body;

  if (!amount || !currency) {
    return res.status(400).json({ error: 'amount and currency are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const balanceRes = await client.query(
      'SELECT balance FROM wallet_balances WHERE wallet_id = $1 AND currency = $2 FOR UPDATE',
      [walletId, currency]
    );

    if (balanceRes.rows.length === 0 || Number(balanceRes.rows[0].balance) < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    await client.query(
      'UPDATE wallet_balances SET balance = balance - $1 WHERE wallet_id = $2 AND currency = $3',
      [amount, walletId, currency]
    );

    await client.query(
      `INSERT INTO ledger (id, wallet_id, type, amount, currency, reference_id)
       VALUES ($1, $2, 'DEBIT', $3, $4, $2)`,
      [randomUUID(), walletId, amount, currency]
    );

    await client.query('COMMIT');

    const updated = await pool.query(
      'SELECT currency, balance FROM wallet_balances WHERE wallet_id = $1 AND currency = $2',
      [walletId, currency]
    );
    res.json({ walletId, currency, balance: Number(updated.rows[0].balance) });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { getWallets, getBalance, deposit, withdraw };