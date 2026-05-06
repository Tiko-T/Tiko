# Tiko

Tiko is a creator commerce and ticketing platform built on CKB. It combines a familiar Web2-style storefront and operations flow with blockchain-backed payment confirmation, ownership, and fulfillment where that actually improves the product.

Today, Tiko supports:

- event listing and publishing
- buyer checkout
- CKB testnet xUDT payment confirmation
- QR-based ticket access
- operator check-in
- Spore-backed ownership after successful purchase
- invite-based private beta access
- public test-token faucet

This repository contains the standalone Tiko app, deployment configuration, local testnet tooling, and product planning docs.

## Repo Structure

```text
src/
  app/                Next.js routes for buyer, auth, admin, operator, faucet, and API surfaces
  components/         Buyer, seller, auth, admin, layout, and shared UI components
  lib/
    auth/             Session, invite, and role guards
    ckb/              CKB, xUDT, and Spore integration
    frontend/         View models, API client, and display formatting
    tiko/             Checkout, fulfillment, jobs, listings, faucet, and domain logic
prisma/               Prisma schema, migrations, and seed data
scripts/              Local devnet and testnet setup / smoke-test utilities
docs/                 Product overview, product spec, architecture, user journeys, and offering docs
vercel.json           Hosted cron configuration
```

## Current Product Areas

### Ticketing

- browse events
- create and publish events
- buy tickets
- submit payment transaction hashes
- receive ticket access
- check in guests

### Creator Commerce Foundation

- digital ownership issued after confirmed purchases
- buyer wallet linking
- creator-facing inventory setup
- public faucet for test-token distribution

### Hosted Operations

- managed Postgres support
- Vercel Blob-backed image storage
- background job processing for reconciliation and fulfillment
- private beta auth and invite management

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment

Start from:

```bash
cp .env.example .env
```

For the current local testnet flow, `.env` should point at a local Postgres instance and include valid CKB testnet settings.

### 3. Start local Postgres

The project expects Postgres locally. If you use the same Docker setup we used during development:

```bash
docker start tiko-postgres-test
```

### 4. Prepare the database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Start the app

For local testing, prefer the Webpack dev server because Turbopack was unstable for this project:

```bash
npm run dev:webpack -- --port 3001
```

Open:

```text
http://127.0.0.1:3001
```

## Local Testnet Workflow

The repo includes scripts for a full local app + CKB testnet flow.

### Generate a local testnet env and wallets

```bash
npm run testnet:generate
```

This creates a local `.env`, prints wallet addresses, and tells you which wallet must be funded first.

### Bootstrap token balances and app state

```bash
npm run testnet:bootstrap
```

This:

- funds the generated buyer / merchant / minter wallets from the issuer
- ensures the test token exists and is usable
- seeds the catalog

### Run an end-to-end local testnet order flow

```bash
npm run testnet:flow
```

This exercises:

- login
- checkout
- seeded-wallet payment
- tx-hash submission
- reconciliation
- fulfillment
- Spore minting

## Hosted Private Beta

Tiko is structured for a hosted private beta on Vercel with:

- managed Postgres
- Vercel Blob for event artwork
- cron-driven background jobs
- private beta auth and invites
- real CKB testnet payment verification
- optional real Spore minting

### Important note on Vercel Hobby

The current `vercel.json` schedules `/api/cron/process-jobs` every minute. That does **not** fit Vercel Hobby cron limits. For hosted beta you need either:

- Vercel Pro, or
- an external scheduler calling the cron endpoint

### Required environment

Start from [.env.example](./.env.example). At minimum, hosted beta needs:

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

Optional but strongly recommended:

- `BETA_ADMIN_EMAIL`
- `BETA_ADMIN_PASSWORD`
- `BETA_ADMIN_NAME`

### Database connection note for Supabase

If you deploy on Vercel with Supabase:

- use the **transaction pooler** for app runtime
- use `sslmode=no-verify` if needed for the Prisma + `pg` TLS path

The hosted app and migration path may require different connection strings depending on provider behavior, so verify with your provider docs.

### Initial hosted setup

1. Create the hosted Postgres database.
2. Add the Vercel environment variables.
3. Deploy from GitHub.
4. Run:

```bash
npm run db:migrate
npm run db:seed
```

5. Sign in with the seeded admin account.
6. Create tester/operator invites in `/admin`.
7. Verify `/api/health`, login, checkout, and cron processing.

## Public Faucet

The app includes a public faucet for test-token distribution:

- page: `/faucet`
- route: `/api/faucet`

Current behavior:

- public access
- capped per wallet
- intended for checkout and beta testing support

If you deploy this feature, make sure:

- the faucet migration is applied
- the issuer wallet has enough CKB and token balance

## Validation Commands

```bash
npm run db:generate
npm run typecheck
npm run lint
npm run build
```

Additional useful scripts:

```bash
npm run testnet:generate
npm run testnet:bootstrap
npm run testnet:flow
npm run test:backend
```

## Environment

Copy `.env.example` to `.env` and then fill in:

- local or hosted Postgres connection string
- session and cron secrets
- beta admin settings
- CKB network and RPC details
- token config
- Blob token if using hosted image uploads

Do not commit real secrets or production private keys.

## Product Docs

- [Product Overview](./docs/product-overview.md)
- [Product Spec](./docs/product-spec.md)
- [System Architecture](./docs/system-architecture.md)
- [User Journey Map](./docs/user-journey-map.md)
- [Creator Commerce Offering](./docs/creator-commerce-offering.md)

## Notes

- The repo ignores `.env*`, build artifacts, and local-only files.
- There is an untracked local file `docs/Untitled` in the workspace that is not part of the product documentation set.
