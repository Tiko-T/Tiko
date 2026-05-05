# Tiko

Tiko is a Web2-style creator commerce and ticketing product built on CKB. The MVP combines a familiar storefront and operator workflow with:

- xUDT-backed ticket payments on CKB testnet
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
- Manual `tx-hash` submission and reconciliation
- Ticket wallet page with QR/access code
- Operator check-in console
- Background reconciliation and Spore minting
- Invite-based beta access control
- Admin invite and retry tooling

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

The app now assumes Postgres even for local development. The example `DATABASE_URL` in [.env.example](./.env.example) points to a local Postgres instance.

### 3. Optional: start the local CKB devnet

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

## Hosted Private Beta

Tiko is now structured for a hosted private beta on Vercel:

- managed Postgres instead of local SQLite
- Vercel Blob for uploaded event artwork
- Vercel Cron driving background payment reconciliation and fulfillment jobs
- invite-only buyer/operator/admin access
- real CKB testnet payment verification
- optional real Spore minting on hosted environments

### Required environment

Start from [.env.example](./.env.example). For a real hosted beta you must set:

- `APP_URL`
- `DATABASE_URL`
- `SESSION_SECRET`
- `CRON_SECRET`
- `CKB_NETWORK=testnet`
- `CKB_RPC_URL`
- `PAYMENT_RECEIVER_ADDRESS`
- `CKB_XUDT_ARGS`
- `CKB_ISSUER_ADDRESS` or `CKB_ISSUER_PRIVATE_KEY`
- `CKB_SPORE_MINTER_PRIVATE_KEY` when `SPORE_MINTING_MODE=real`
- `BLOB_READ_WRITE_TOKEN`

### Initial hosted setup

1. Create the Postgres database and configure `DATABASE_URL`.
2. Add the Vercel env vars from `.env.example`.
3. Run migrations and seed the first admin:

```bash
npm run db:migrate
npm run db:seed
```

4. Set `BETA_ADMIN_EMAIL` and `BETA_ADMIN_PASSWORD` before seeding so the initial admin account is created.
5. Deploy to Vercel from GitHub.
6. Ensure the cron job in [vercel.json](./vercel.json) is active so `/api/cron/process-jobs` runs every minute.
7. Sign in as the seeded admin, create tester/operator invites from `/admin`, and distribute the invite links.

## Validation Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run db:migrate
npm run test:backend
```

## Environment

Copy `.env.example` to `.env` if you want to override defaults. The current devnet-first setup includes sensible local defaults for:

- local Postgres connection string
- session and cron secrets
- beta invite settings
- CKB testnet/devnet RPC and token config
- optional Vercel Blob uploads

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
