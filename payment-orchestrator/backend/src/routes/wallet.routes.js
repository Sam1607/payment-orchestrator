// routes/wallet.routes.js
const express = require('express');
const { getWallets, getBalance, deposit, withdraw } = require('../controllers/wallet.controller');
const router = express.Router();

// Specific routes must come before the generic /:userId wildcard
router.get('/wallets/:walletId/balance', getBalance);
router.post('/wallets/:walletId/deposit', deposit);
router.post('/wallets/:walletId/withdraw', withdraw);
router.get('/wallets/:userId', getWallets);

module.exports = router;