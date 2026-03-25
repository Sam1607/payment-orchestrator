// routes/ledger.routes.js
const express = require('express');
const { getLedger } = require('../controllers/ledger.controller');

const router = express.Router();

router.get('/ledger', getLedger);

module.exports = router;
