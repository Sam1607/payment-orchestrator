// routes/payment.routes.js
const express = require('express');
const { sendPayment, getPayments } = require('../controllers/payment.controller');

const router = express.Router();

router.post('/payments', sendPayment);
router.get('/payments', getPayments);

module.exports = router;
