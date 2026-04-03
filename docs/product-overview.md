# Tiko

Tiko is a global, Web2-style creator commerce, ticketing, and digital merchandise platform built on CKB. It keeps the interface, support model, and fulfillment flow familiar while using Spore Digital Objects as the ownership layer for tickets, memberships, collectibles, and authenticity certificates.

For the initial MVP, Tiko supports one whitelisted CKB payment token on testnet. The preferred option is a CKB stablecoin on testnet; if that is not practical, the fallback is an approved CKB-based token such as an xUDT-issued test token. Buyers still browse and manage purchases through a normal web flow, but the final payment step is wallet-based in the first release.

## Documents

- `product-spec.md`: product vision, scope, users, feature set, roadmap, and KPIs
- `system-architecture.md`: platform architecture, components, data model, lifecycle, and security model
- `user-journey-map.md`: merchant, buyer, and operator journeys across purchase, fulfillment, check-in, and wallet-based payment

## Positioning

Tiko should feel closer to a polished commerce and ticketing SaaS than to a crypto marketplace. The product should look and behave like a normal web platform:

- merchants create storefronts, events, drops, and campaigns
- buyers browse and reserve products through a standard web interface
- the final payment step uses a supported CKB wallet and one whitelisted token
- digital ownership is issued automatically after confirmed payment
- broader payment rails can be added after the MVP

## Core Thesis

Spore Digital Objects are most valuable when they represent things users already care about:

- event tickets that become collectibles
- memberships and fan passes
- digital merchandise and editioned drops
- proof of attendance
- certificates tied to premium physical goods

Mutable operational state such as `checked_in`, `refunded`, `redeemed`, or `voided` should remain in Tiko's application layer and audit systems. The chain should anchor ownership and provenance, not carry every business workflow.
