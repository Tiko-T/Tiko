# Tiko

Tiko is a Web2-style creator commerce and ticketing product built on CKB. The MVP combines a familiar storefront and operator workflow with:

- xUDT-backed ticket payments on CKB devnet
- Spore-backed digital ownership after payment confirmation
- platform-controlled ticket validity and check-in

This repository contains the standalone Tiko app, backend services, local devnet test tooling, and product planning docs.

## Repo Structure

```text
src/
  app/                Next.js routes for buyer, order, operator, and API surfaces
  components/         Buyer, operator, layout, and shared UI components
  lib/
    ckb/              CKB, xUDT, and Spore integration
    frontend/         View models, API client, and display formatting
    tiko/             Checkout, fulfillment, bootstrap, and domain logic
prisma/               Prisma schema and seed data
scripts/              Local devnet bootstrap and backend smoke tests
docs/                 Product overview, product spec, architecture, and user journeys
```

## Core Flows

- Buyer storefront and product detail
- Checkout and payment-intent creation
- Manual devnet tx-hash submission and reconciliation
- Ticket wallet page with QR/access code
- Operator check-in console
- Backend-triggered Spore minting

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare the database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 3. Start the local CKB devnet

```bash
npm run ckb:devnet
```

In another terminal, bootstrap the wallets and token balances:

```bash
npm run test:bootstrap
```

### 4. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run test:backend
```

## Environment

Copy `.env.example` to `.env` if you want to override defaults. The current devnet-first setup includes sensible local defaults for:

- SQLite database path
- CKB devnet RPC
- test wallet private keys
- xUDT symbol and decimals
- Spore minting mode

Do not commit real secrets or production keys.

## Product Docs

- [Product Overview](./docs/product-overview.md)
- [Product Spec](./docs/product-spec.md)
- [System Architecture](./docs/system-architecture.md)
- [User Journey Map](./docs/user-journey-map.md)

## GitHub Push Prep

This repo ignores local-only artifacts such as:

- `node_modules`
- `.next`
- `.env*`
- `prisma/dev.db`

Recommended initial push flow:

```bash
git init
git branch -M main
git add .
git commit -m "Initial Tiko"
git remote add origin <your-github-url>
git push -u origin main
```
