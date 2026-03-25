const express = require('express');
const pool = require('./db.config.js');
const userRouter = require('./routes/wallet.routes.js');
const paymentRouter = require('./routes/payment.routes.js');
const ledgerRouter = require('./routes/ledger.routes.js');
const adminRouter = require('./routes/admin.routes.js');
const cors = require('cors');


const app = express();
app.use(express.json());

app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    credentials: true,
  })
);

// Mount routes
app.use('/api/v1/', userRouter);
app.use('/api/v1/', paymentRouter);
app.use('/api/v1/', ledgerRouter);
app.use('/api/v1/', adminRouter);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
