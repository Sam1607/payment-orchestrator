// routes/admin.routes.js
const express = require('express');
const { reverseTransaction, getAllPayments } = require('../controllers/admin.controller');

const router = express.Router();

router.post('/payments/:txId/reverse', reverseTransaction);
router.get('/admin/payments', getAllPayments);

module.exports = router;
