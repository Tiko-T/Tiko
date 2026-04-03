# Tiko User Journey Map

## 1. Objective

This document maps how Tiko should feel for merchants, buyers, and operators. The product should preserve familiar Web2 expectations while using CKB and Spore beneath the surface. In the MVP, payment is handled with one supported token on CKB testnet, so the interface must hide as much complexity as possible until the buyer reaches the final payment step.

## 2. Merchant Journey

### Stage 1: Discover and onboard

Merchant goals:

- understand what Tiko sells and why it is useful
- create an account quickly
- configure brand identity, contact details, and basic settlement settings

Desired experience:

- simple onboarding wizard
- no protocol expertise required
- clear explanation of the MVP payment constraint: one supported token on CKB testnet

Key platform behaviors:

- merchant account creation
- storefront setup
- event or product creation templates
- settlement profile or internal ledger setup

### Stage 2: Create an event or drop

Merchant goals:

- define ticket tiers or product variants
- set inventory, pricing, and sales windows
- upload artwork and descriptions

Desired experience:

- familiar CMS-like workflow
- clear preview of storefront listing
- clear choice of token-denominated pricing
- simple toggles for whether the item includes a collectible, certificate, or transferable object

Key platform behaviors:

- create event, product, ticket tier, and campaign records
- preconfigure Spore collection strategy in the background
- generate shareable storefront links

### Stage 3: Launch and sell

Merchant goals:

- drive traffic and conversions
- monitor sales in real time
- support buyers without operational confusion

Desired experience:

- clean mobile storefront
- fast reporting on orders and confirmation status
- simple messaging around supported wallet and token requirements

Key platform behaviors:

- checkout
- payment intent generation
- chain confirmation
- order fulfillment
- notification dispatch
- inventory decrement

### Stage 4: Operate and fulfill

Merchant goals:

- validate tickets at the door
- manage support issues
- reissue, refund, or void where needed

Desired experience:

- dependable check-in tools
- one-click operational actions
- no need to inspect chain details for normal support cases

Key platform behaviors:

- QR validation
- support console workflows
- refund and void controls
- post-event reporting

### Stage 5: Re-engage the audience

Merchant goals:

- reward attendees
- sell follow-up drops
- retain buyers across future campaigns

Desired experience:

- simple post-purchase campaign tools
- audience segmentation based on ownership or attendance

Key platform behaviors:

- issue proof-of-attendance objects
- send member offers or sponsor rewards
- analyze repeat-buyer cohorts

## 3. Buyer Journey

### Stage 1: Discover

Buyer goals:

- find an event, product, or drop
- trust the seller
- decide quickly on mobile

Desired experience:

- standard storefront browsing
- clear prices and descriptions
- visible trust markers such as verified organizer, support options, and payment-token clarity

### Stage 2: Purchase

Buyer goals:

- complete checkout quickly
- avoid unnecessary account friction
- pay with a supported CKB wallet and one whitelisted token

Desired experience:

- normal web checkout until the payment step
- connect wallet or scan a wallet deeplink or QR
- clear network, token, amount, and expiry instructions

Key platform behaviors:

- create pending order
- generate payment intent
- detect onchain payment
- confirm purchase after threshold confirmation

### Stage 3: Receive access

Buyer goals:

- get proof of purchase quickly
- access the ticket or digital item from phone
- understand what to do next while the chain confirms

Desired experience:

- confirmation screen with `awaiting payment`, `payment seen`, or `confirmed` states
- QR code or access button once confirmed
- email and SMS delivery
- optional note explaining digital ownership without jargon overload

Key platform behaviors:

- fulfill order
- create access credential
- mint or assign Spore object
- display in buyer dashboard

### Stage 4: Use the item

For ticket buyers:

- open QR code at venue
- scan successfully without confusion
- keep a collectible afterward

For digital goods buyers:

- download, unlock, or view the product
- understand whether the item is collectible, transferable, or just access-gated

Desired experience:

- predictable mobile behavior
- no extra wallet prompt at the point of use

### Stage 5: Post-purchase ownership

Buyer goals:

- keep proof of attendance
- reconnect the same wallet later if needed
- transfer when allowed in later phases

Desired experience:

- clear distinction between `use now` and `you also own this onchain`
- buyer can revisit the order through web login or wallet reconnect
- transfer guidance appears only where policy allows it

Key platform behaviors:

- display ownership state
- show payment wallet linkage
- enforce transfer policy

## 4. Event Check-In Journey

### Actor: operator

Operator goals:

- scan quickly
- prevent duplicate entry
- handle edge cases confidently

Desired experience:

- focused scanner interface
- immediate success or error feedback
- override controls for authorized users only

Key validation steps:

- verify ticket status
- verify event and time window
- verify unused or allowed state
- log scan result

Important rule:

The operator validates platform access state, not just raw onchain ownership.

## 5. Support Journey

### Common support cases

- buyer did not receive confirmation
- buyer paid with the wrong token or wrong network
- payment was sent but confirmation is delayed
- buyer wants reissue to a new phone or email
- refund requested

Desired experience:

- support agent sees the order timeline and payment transaction status
- blockchain detail is abstracted unless needed for investigation
- agent can resend, void, refund, or escalate safely

## 6. Wallet Management Journey

### Trigger

Buyer wants to reconnect the wallet used for payment or recover access to the web view of the order.

### Steps

1. Buyer logs in with email or phone, or reconnects the supported wallet.
2. Platform verifies ownership of the wallet or session.
3. Platform rehydrates the order history and owned items.
4. Buyer sees access credentials and linked onchain objects.

### UX notes

- a separate `claim to wallet` flow is not required in the MVP because the payment wallet is the default receiving wallet
- later custody abstraction can add a more explicit claim or transfer journey

## 7. Resale Or Gifting Journey

This should not be enabled blindly for every item.

Conditions:

- merchant has allowed transfer or resale
- event timing and fraud rules permit transfer
- platform policy around pricing and fees is enforced

Desired experience:

- simple send or list action
- clear fee and rule disclosure
- updated access state after completion

## 8. Experience Principles Across All Journeys

- familiar language first, blockchain language second
- wallet complexity should appear as late as possible
- confirmation and recovery paths must be obvious
- mobile performance matters more than visual novelty
- supportability is part of UX, not a separate concern
