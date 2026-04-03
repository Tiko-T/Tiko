# Tiko System Architecture

## 1. Architectural Goal

Design a platform that behaves like a standard commerce and ticketing SaaS at the application layer while using CKB and Spore as the ownership and provenance layer. For the MVP, the payment rail is intentionally narrow: one whitelisted token on CKB testnet, preferably a stablecoin, otherwise an approved CKB-based token.

The system should tolerate delayed confirmations, support operator overrides, and preserve a clean separation between immutable ownership records and mutable business state.

## 2. High-Level Architecture

### Frontend surfaces

- merchant admin web app
- buyer storefront web app
- buyer mobile web ticket wallet
- operator check-in interface
- support and operations console

### Backend services

- identity and session service
- catalog service
- order and checkout service
- token payment service
- chain monitoring and confirmation service
- fulfillment service
- ticketing and access service
- buyer wallet linking service
- Spore minting service
- notification service
- analytics and reporting service
- support and risk service

### Infrastructure layers

- relational database for transactional state
- cache for session and read optimization
- job queue for asynchronous confirmation, fulfillment, and minting
- object storage for media and attachments
- audit/event log
- observability stack

## 3. Core Principle: Split State

Tiko should maintain two categories of state:

### Off-chain application state

- user accounts
- merchant accounts
- inventory
- order status
- payment intent status
- confirmation status
- refund or void status
- check-in and redemption status
- customer support actions
- fraud review or manual override data

### Onchain ownership state

- collection identity
- digital object identity
- creator provenance
- holder address
- payment transaction reference
- transfer history visible through chain indexing

This split is non-negotiable. A ticket can be owned onchain while still being invalid for entry if it was refunded or voided in the platform state.

## 4. Suggested Domain Model

### Merchant domain

- `Merchant`
- `Storefront`
- `Venue`
- `Event`
- `Campaign`

### Commerce domain

- `Product`
- `ProductVariant`
- `InventoryUnit`
- `Order`
- `OrderLine`
- `PaymentIntent`
- `SettlementLedgerEntry`
- `Refund`

### Access domain

- `TicketTier`
- `TicketInstance`
- `CheckInRecord`
- `RedemptionRule`

### Web3 domain

- `SupportedPaymentToken`
- `BuyerWalletLink`
- `SporeCollection`
- `SporeObject`
- `OwnershipBinding`
- `TransferPolicy`
- `ChainTransfer`

## 5. Reference Purchase Flow

1. Buyer adds a ticket or digital product to cart.
2. Checkout service creates a pending order.
3. Token payment service creates a `PaymentIntent` denominated in the supported testnet token.
4. Frontend renders a wallet-connect step, deeplink, or QR payment handoff.
5. Buyer submits the token transfer from a supported wallet.
6. Chain monitoring service detects the transfer and validates token, amount, recipient, and expiry window.
7. After the configured confirmation threshold, order status becomes `paid`.
8. Fulfillment service generates the ticket or entitlement.
9. Buyer wallet linking service binds the payer wallet to the buyer profile or order.
10. Spore minting service issues the relevant digital object.
11. Notification service sends email or SMS confirmation with the web access link.
12. Buyer dashboard shows the item, QR code, and payment transaction status.

Payment confirmation is asynchronous. The checkout UI must support `awaiting payment`, `payment seen`, and `payment confirmed` states.

## 6. Minting Strategy

### MVP default mode

- the buyer's payment wallet is the default receiving wallet
- the platform also creates or updates a web account keyed to email or phone for support and access
- no separate custodial wallet is required in the first release

### Later mode

- optional custodial issuance
- deferred claim to self-custody
- transfer flows separated from the original payment wallet

This keeps the MVP simpler while preserving room for later custody abstraction.

## 7. Ticketing Model

A ticket should be represented by:

- a platform-level `TicketInstance`
- a scannable access credential used by operators
- a linked `SporeObject` for ownership and provenance

The QR code used for event entry should be platform-controlled and revocable. Do not rely on the raw chain object alone as the gate credential because entry logic must support voids, reissues, refunds, fraud review, and offline operations.

## 8. Check-In And Redemption

### Requirements

- fast mobile scanning
- eventual offline support
- duplicate scan detection
- operator roles and permissions
- auditability for every scan or override

### Rule

`onchain ownership is not equal to access validity`

Access validity is determined by Tiko's access service, which checks:

- ticket status
- event window
- prior scan history
- refund or void flags
- transfer lock rules

## 9. Data Integrity And Idempotency

The payment, fulfillment, and minting path must be idempotent. Chain indexers, watchers, or callback layers may emit repeated or delayed events.

Required controls:

- unique idempotency keys per order and payment intent
- replay-safe processing for transfer detection
- confirmation-threshold handling that is reorg-aware
- outbox or job queue pattern for downstream actions
- immutable audit entries for state transitions
- replay-safe notification handling

## 10. Spore Collection Strategy

Suggested organization:

- one collection per merchant brand for evergreen assets
- one collection per event or campaign for event-specific drops
- one object per purchased entitlement or edition

Metadata should be designed for:

- tier identification
- campaign or event association
- media preview
- provenance fields
- optional rarity or edition semantics where relevant

Avoid encoding operational status directly into object metadata.

## 11. Payments And Settlement

### MVP payment assumptions

- one whitelisted token per environment
- preferred payment asset: testnet stablecoin on CKB
- fallback payment asset: approved CKB token such as a testnet xUDT
- supported network: CKB testnet
- pricing may be token-denominated, with optional fiat reference display

### Payment service responsibilities

- create payment intents with amount and expiry
- generate wallet deeplinks or QR instructions
- monitor inbound token transfers
- validate sender, recipient, token, amount, and timing
- store the transaction hash and confirmation state
- mark orders as paid only after threshold confirmation

### Settlement responsibilities

- maintain an internal merchant ledger
- show merchant balances in token units
- support testnet demo settlement or manual internal accounting in the MVP

There are no card chargebacks in this model, but there are still support and reconciliation concerns if buyers use the wrong wallet, wrong network, or wrong token.

## 12. Security Model

### Account security

- email or phone-based login with strong OTP flows
- merchant role-based access control
- device/session management

### Wallet and treasury security

- verified wallet connection flow for supported wallets
- platform-controlled signing isolated from app servers for minting or treasury actions
- allowlisted token and network validation
- payment-address integrity checks to reduce phishing risk

### Platform security

- trusted chain indexing or RPC infrastructure
- strict audit logs
- encryption for sensitive personal data
- admin action tracing
- rate limiting on checkout, payment status, and support endpoints

## 13. Observability

Track:

- payment intent creation volume
- wallet handoff success rate
- transfer detection latency
- confirmation latency
- fulfillment job latency
- mint success and failure rate
- notification success rate
- scan throughput and failure cases

Dashboards should separate:

- conversion metrics
- operations metrics
- blockchain service metrics

## 14. External Integrations

- supported CKB wallet connectors
- SMS providers
- email providers
- CKB RPC or infrastructure providers
- chain indexer service

## 15. Rollout Strategy

### Stage 1

- one testnet token only
- wallet-based payment
- event tickets and digital drops only
- no open resale

### Stage 2

- additional token options or a production stablecoin
- optional custodial or deferred-claim flow
- gifting and merchant-approved transfers
- proof-of-attendance campaigns

### Stage 3

- broader payment rails
- resale marketplace
- sponsor campaigns
- cross-merchant loyalty

## 16. Non-Goals For MVP

- multiple payment rails at launch
- walletless checkout
- fully onchain event-entry validation
- encoding mutable support state in chain metadata
- decentralized governance mechanics
