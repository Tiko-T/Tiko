# Tiko Product Spec

## 1. Product Overview

Tiko is a creator commerce and ticketing platform that combines a Web2-style buyer journey with CKB-backed digital ownership. The platform enables merchants, artists, event organizers, communities, and brands to sell event tickets, digital products, memberships, and premium merchandise while automatically issuing Spore Digital Objects in the background.

Tiko should solve two problems at once:

1. give merchants better monetization, loyalty, and authenticity tools
2. give buyers portable, verifiable proof of purchase and access without turning the product into a crypto-native experience

## 2. Product Vision

Build a global commerce and ticketing platform for creators, communities, brands, and event operators who need:

- familiar browsing and fulfillment flows
- a simple, reliable payment path for the MVP
- mobile-first ticket delivery
- fraud resistance
- portable digital ownership
- post-purchase fan engagement

## 3. Problem Statement

Current commerce and ticketing platforms often have one or more of these weaknesses:

- tickets and digital goods are trapped inside one database
- resale and gifting workflows are fragmented or unsafe
- premium physical goods lack verifiable authenticity
- fan loyalty is hard to prove across merchants and events
- event attendance data is useful operationally but not portable to the customer
- many web3-native products introduce too much friction too early in the journey

Tiko addresses this by keeping the interface and operational model familiar while moving ownership primitives onto CKB.

## 4. Users

### Primary users

- event organizers
- music artists and labels
- creators selling digital goods
- fashion and lifestyle brands selling limited drops
- community operators running memberships or passes

### Secondary users

- event attendees
- fans and collectors
- affiliates and promoters
- sponsors and brand partners
- support and operations teams

## 5. Key Jobs To Be Done

### Merchant jobs

- create an event or product quickly
- accept the supported CKB payment token in the MVP
- distribute tickets or digital goods instantly
- verify ownership at entry or redemption
- reward fans after purchase
- prevent fraud and manage support cases

### Buyer jobs

- buy with minimal friction
- pay from a supported wallet only at the final step
- receive proof of purchase immediately after confirmation
- access the event or asset on mobile
- keep a collectible or proof of attendance after use

## 6. Product Principles

- Web2-style UX: browsing, checkout structure, support, and fulfillment should feel familiar even when payment uses a wallet
- Wallet-at-payment MVP: a supported CKB wallet is required only at the final payment step in the first release
- Single-token scope: start with one whitelisted payment token on CKB testnet, preferably a stablecoin, otherwise an approved CKB token
- Mobile-first: every critical path must work well on mobile, including wallet deeplinks and QR handoff
- Operational safety: mutable business state remains off-chain
- Merchant utility first: every blockchain feature must improve conversion, trust, retention, or resale control

## 7. Product Scope

### MVP

- merchant storefronts
- event creation and ticket tiers
- digital product listings
- checkout with one supported CKB testnet stablecoin or approved CKB-based token
- wallet connect, deeplink, or QR handoff for payment
- automatic issuance of Spore Digital Objects after onchain payment confirmation
- email and SMS delivery of access links
- buyer dashboard with QR code, purchase history, and digital inventory
- operator check-in app or scanner workflow
- post-event proof-of-attendance collectible issuance
- merchant analytics for sales, confirmations, scans, and fulfillment status

### MVP payment model

- one whitelisted token per environment
- preferred asset: CKB stablecoin on testnet
- fallback asset: approved CKB token such as a testnet xUDT
- supported network: CKB testnet
- buyer pays from a supported wallet
- broader payment options are deferred to later phases

### Phase 2

- memberships and subscription-like fan passes
- creator drops and collectible campaigns
- gifting and merchant-approved transfers
- optional custodial or deferred-claim wallet flow
- broader payment rails, including additional tokens or non-crypto methods
- sponsor perks and targeted airdrops to holders
- premium physical goods with authenticity certificates

### Phase 3

- compliant resale marketplace
- cross-merchant loyalty graph
- programmable bundles across events and products
- onchain reputation for merchants and collections
- open APIs and widgets for third-party partners

## 8. Core Use Cases

### 8.1 Ticketing

Each ticket purchase creates:

- an internal order record
- a ticket entitlement record
- a buyer access credential
- a Spore Digital Object representing ownership and provenance

In the MVP, the digital object is typically issued to the buyer wallet used for payment.

### 8.2 Digital Merch

Artists and creators can sell:

- posters
- behind-the-scenes content
- limited audio or video drops
- ebooks
- templates
- premium fan editions

Tiko handles payment confirmation and delivery, while Spore objects act as collectible receipts, access keys, or edition certificates.

### 8.3 Memberships And Passes

Communities and brands can issue:

- VIP passes
- season passes
- alumni or campus passes
- backstage or partner badges
- gated access memberships

These can unlock benefits across multiple campaigns and events.

### 8.4 Physical Goods Authenticity

Limited physical goods can be sold with a linked authenticity object. This is useful for signed items, apparel drops, collectibles, and premium merchandise where resale trust matters.

## 9. User Experience Requirements

### Buyer experience

- no wallet required for discovery or browsing
- wallet connection should happen only at the final payment step in the MVP
- checkout completion target under 2 minutes once the buyer reaches payment
- clear `pending payment` and `payment confirmed` states
- QR or access link available immediately after confirmation
- clear distinction between `your ticket/access` and `onchain ownership`

### Merchant experience

- product creation in under 10 minutes for a basic event
- simple inventory and tier management
- clear token-denominated pricing and settlement views
- accessible customer support actions: refund, reissue, void, resend
- lightweight analytics without blockchain jargon

## 10. Blockchain Design Choices

### Use Spore for

- immutable proof of creation
- collection membership and provenance
- ownership and transferability
- collectible ticket and drop representation
- authenticity certificates

### Use a CKB token payment rail in the MVP for

- a narrow, testable checkout flow
- direct chain-verifiable payment confirmation
- simple demonstration of commerce plus ownership on one stack

### Do not use Spore directly for

- mutable redemption state
- refund status
- support case workflows
- operational seat reassignment
- event-entry validity by itself

Those stay in Tiko's application database and audit logs.

## 11. Business Model

- merchant subscription tiers
- per-transaction commission
- optional resale fee split in later phases
- premium analytics and CRM features
- sponsor campaign tooling
- white-label enterprise plans

## 12. KPI Framework

### Growth

- merchant signups
- active merchants per month
- GMV or token-denominated transaction volume
- paid order volume

### Conversion

- checkout completion rate
- payment confirmation rate
- mobile conversion rate
- drop-off rate before wallet payment

### Retention

- repeat buyer rate
- repeat merchant rate
- pass renewal rate
- event-to-event buyer carryover

### Web3 utility

- percentage of fulfilled orders with issued digital objects
- percentage of purchases issued directly to buyer wallets
- transfer or gifting volume when enabled
- proof-of-attendance claim or retention rate

## 13. Risks

- overexposing blockchain language and hurting conversion
- wallet friction at checkout
- poor availability or usability of the chosen testnet token
- chain confirmation delays creating support load
- mismatch between off-chain business state and onchain ownership perception

## 14. Mitigations

- keep browsing and support flows web2-style
- support one token only in the MVP
- provide clear wallet, network, and amount instructions
- surface payment pending states clearly
- preserve a canonical platform state for redemption and access
- build strong event operations and support tools before enabling open transfers or resale

## 15. Recommended MVP Launch Narrative

Tiko is not "an NFT ticketing app." It is:

"A web2-style commerce and ticketing platform where buyers pay with a simple CKB token flow and receive portable digital ownership by default."
