---database table data
-- Users
CREATE TABLE IF NOT EXISTS users (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'USER',  -- USER | ADMIN | AUDITOR
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Wallets  (one user can have one wallet; wallet holds multiple currencies via wallet_balances)
CREATE TABLE IF NOT EXISTS wallets (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Per-currency balances for each wallet
CREATE TABLE IF NOT EXISTS wallet_balances (
  wallet_id   UUID           NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  currency    VARCHAR(10)    NOT NULL,
  balance     NUMERIC(18,2)  NOT NULL DEFAULT 0,
  PRIMARY KEY (wallet_id, currency)
);

-- Payments (peer-to-peer transfers)
CREATE TABLE IF NOT EXISTS payments (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_wallet_id   UUID           NOT NULL REFERENCES wallets(id),
  to_wallet_id     UUID           NOT NULL REFERENCES wallets(id),
  amount           NUMERIC(18,2)  NOT NULL,
  currency         VARCHAR(10)    NOT NULL,
  status           VARCHAR(20)    NOT NULL DEFAULT 'COMPLETED',  -- COMPLETED | REVERSED
  idempotency_key  VARCHAR(255)   UNIQUE,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Append-only ledger
CREATE TABLE IF NOT EXISTS ledger (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id     UUID           NOT NULL REFERENCES wallets(id),
  type          VARCHAR(20)    NOT NULL,   -- CREDIT | DEBIT
  amount        NUMERIC(18,2)  NOT NULL,
  currency      VARCHAR(10)    NOT NULL,
  reference_id  VARCHAR(255),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Seed demo users (IDs match frontend AuthContext)
-- ─────────────────────────────────────────────
INSERT INTO users (id, name, email, role) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Shubham', 'shubham@demo.com', 'USER'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Rajan',   'rajan@demo.com',   'ADMIN'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Sammy',   'sammy@demo.com',   'AUDITOR')
ON CONFLICT (email) DO NOTHING;

-- Seed wallets
INSERT INTO wallets (id, user_id) VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
ON CONFLICT (id) DO NOTHING;

-- Seed starting balances
INSERT INTO wallet_balances (wallet_id, currency, balance) VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'USD', 1250.00),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'EUR',  430.50),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'USD',  800.00)
ON CONFLICT (wallet_id, currency) DO NOTHING;
