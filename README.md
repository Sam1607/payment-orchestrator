# Distributed Ledger & Payment Orchestration System

## Important Note (Read First)

This is a **two-week take-home engineering project** designed to evaluate system design thinking, engineering judgement, and implementation quality.

You are **explicitly encouraged to use any resources available to you**, including but not limited to:

* AI tools (ChatGPT, Claude, Copilot, etc.)
* Documentation
* StackOverflow
* Open-source repositories
* Libraries and frameworks
* Code templates

**Use of AI is expected.**

Modern engineering involves effectively leveraging tools that increase productivity. What matters here is **how you design the system, structure the solution, and make engineering decisions**, not whether the code was written entirely by hand.

You may use AI to:

* Generate boilerplate
* Assist with architecture exploration
* Help debug issues
* Accelerate development

However, you should still be able to **understand, explain, and justify everything in your solution**.

Estimated effort: **~15–25 hours across two weeks** (assuming you have a full-time job).

---

# Project Overview

Build a **mini distributed payment orchestration platform** that simulates how modern fintech systems process transactions across multiple services.

The system should support:

* Multi-currency wallet accounts
* Payment processing
* Event-driven transaction settlement
* Idempotent transaction handling
* Role-based access control (RBAC)
* Observability and system resilience

This project is designed to test **system design ability, distributed systems thinking, and pragmatic engineering decisions**, rather than just API implementation.

---

# Problem Statement

Build a simplified **Payment Orchestration Platform** where users can:

* Create wallets
* Deposit funds
* Transfer money to other users
* Handle multi-currency transactions
* Ensure consistency across services

The system should simulate **how real payment infrastructure works internally**.

---

# Core Features

## 1. Wallet Service

Users should be able to:

* Create a wallet
* Maintain balances in multiple currencies

Example wallet:

```
Wallet {
  id
  userId
  balances: {
    USD: 1200
    INR: 40000
  }
}
```

Capabilities:

* Deposit funds
* Withdraw funds
* Query balances

---

## 2. Payment Service

Supports peer-to-peer transfers.

Example:

```
POST /payments/transfer
{
  fromWalletId
  toWalletId
  amount
  currency
  idempotencyKey
}
```

Requirements:

* Prevent double spending
* Handle retries safely using **idempotency keys**
* Validate sufficient balance

---

## 3. Event Driven Processing

Payments should **emit events instead of directly mutating all services**.

Example event flow:

```
Payment Requested
        ↓
Funds Reserved
        ↓
Payment Settled
        ↓
Ledger Updated
```

Recommended tools:

* Kafka
* RabbitMQ
* or simple event bus abstraction

---

## 4. Ledger System

Implement an **append-only ledger**.

Example entry:

```
LedgerEntry {
  id
  walletId
  type: DEBIT | CREDIT
  amount
  currency
  referenceId
  timestamp
}
```

Requirements:

* Immutable
* Wallet balances derived from ledger
* Support reconciliation

---

## 5. Role Based Access Control

Add an RBAC system.

Roles:

```
ADMIN
USER
AUDITOR
```

Permissions:

| Role    | Capabilities         |
| ------- | -------------------- |
| USER    | transfer funds       |
| ADMIN   | reverse transactions |
| AUDITOR | read ledger          |

---

## 6. Transaction Reversal

Admins should be able to:

```
POST /payments/reverse/{transactionId}
```

Rules:

* Reversal must produce new ledger entries
* Ledger history must remain immutable

---

# System Architecture Expectations

You are encouraged to design a **multi-service architecture**.

Example:

```
API Gateway
     |
----------------------------
| Wallet Service           |
| Payment Service          |
| Ledger Service           |
----------------------------
     |
Event Bus (Kafka/RabbitMQ)
```

However, a **modular monolith** is also acceptable if justified.

---

# Technical Expectations

You may use any stack.

Suggested (based on your background):

* Node.js / TypeScript
* NestJS / Express
* PostgreSQL / MongoDB
* Redis
* Kafka / RabbitMQ
* Docker

Optional:

* gRPC
* GraphQL
* CQRS
* Event sourcing

---

# Engineering Challenges to Solve

You should address some of the following:

### Idempotency

Prevent duplicate payments if the client retries.

Example:

```
Idempotency-Key: 3b41ac
```

---

### Race Conditions

Prevent simultaneous transfers draining a wallet.

Possible strategies:

* pessimistic locking
* optimistic concurrency
* Redis locks

---

### Consistency Tradeoffs

Document:

* where strong consistency is required
* where eventual consistency is acceptable

---

### Fault Tolerance

Handle cases where:

* events fail
* services restart
* duplicate events occur

---

# Observability

Implement basic observability:

* request logging
* transaction tracing
* structured logs

Optional:

* OpenTelemetry
* Prometheus metrics

---

# Deliverables

Your repository should include:

### 1. Source Code

Organized clearly.

Example:

```
/services
  wallet
  payments
  ledger

/shared
/infrastructure
```

---

### 2. Architecture Document

Include:

```
/docs/architecture.md
```

Should cover:

* architecture decisions
* tradeoffs
* scaling strategy

---

### 3. API Documentation

Options:

* OpenAPI / Swagger
* Postman collection

---

### 4. Local Setup

Provide instructions to run the system:

```
docker compose up
```

or

```
npm install
npm run dev
```

---

# Bonus Challenges

These are optional but impressive.

### 1. Fraud Detection Rule Engine

Implement rules like:

```
IF amount > $10,000
THEN flag transaction
```

---

### 2. Currency Conversion Service

Support conversion between currencies.

---

### 3. Saga Pattern

Implement a saga for payment settlement.

---

### 4. Event Replay

Allow rebuilding wallet balances from ledger events.

---

# Evaluation Criteria

Submissions will be evaluated on several factors, **including but not limited to**:

### Engineering Principles

* Adherence to **DRY (Don't Repeat Yourself)**
* Proper application of **SOLID design principles**
* Clean architecture and separation of concerns

### Feature Completion

* Correct implementation of required features
* Stability and correctness of the system
* Handling of edge cases and failure scenarios

### Code Quality

* Readability
* Maintainability
* Logical project structure
* Proper error handling and validation

### Distributed Systems Thinking

* Idempotency handling
* Concurrency control
* Consistency tradeoffs
* Event-driven design

### UI / UX Design

If a UI is implemented, we will evaluate:

* Clarity and usability
* Logical workflow
* Thoughtful interaction design

A minimal but well-designed UI is preferable to a complex but confusing one.

### Documentation

* Clear setup instructions
* Architecture explanation
* Reasoning behind major decisions

---

# Time Expectation

This project should be achievable in **~20 hours over two weeks**.

You are **not expected to build a production-grade system**, but we do expect:

* thoughtful architecture
* working core flows
* clear documentation

---

# Submission

Submit a GitHub repository containing:

```
code
documentation
setup instructions
```

Include a **short Loom or screen recording (5–10 minutes)** explaining:

* architecture
* key decisions
* tradeoffs
