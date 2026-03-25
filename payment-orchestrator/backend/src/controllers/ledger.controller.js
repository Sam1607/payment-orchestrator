// controllers/ledger.controller.js
const pool = require('../db.config');

// GET /ledger  or  GET /ledger?userId=...
const getLedger = async (req, res) => {
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
        'SELECT * FROM ledger WHERE wallet_id = ANY($1) ORDER BY created_at DESC',
        [walletIds]
      );
      return res.json(result.rows);
    }

    const result = await pool.query('SELECT * FROM ledger ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getLedger };
