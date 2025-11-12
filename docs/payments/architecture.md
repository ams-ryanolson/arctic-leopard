% Payments Architecture

# Overview

The payments domain provides a gateway-agnostic foundation for processing one-time and recurring transactions, handling entitlements, and coordinating downstream flows such as tips, wishlist purchases, pay-per-view unlocks, and subscriptions. The system is designed to work offline-first by front-loading persistence and dispatching asynchronous events that listeners can react to.

# Data Model

- `payments`: canonical record for all financial activity; stores provider metadata, statuses, and monetary breakdowns (gross/fees/net).
- `payment_intents`: tracks the lifecycle of authentication/authorization flows before capture.
- `payment_methods`: tokenized payment instruments bound to users.
- `payment_subscriptions`: recurring agreements, linked to `subscription_plans`.
- `payment_items`: granular line items associated with a `payment`.
- `payment_refunds`: refund history including provider references.
- `wallet_transactions` & `ledger_entries`: immutable bookkeeping layers for credits and debits.
- `payment_webhooks`: raw ingress store for third-party webhook payloads.
- `payment_gateway_configs`: extensible key/value configuration per provider or creator.
- Feature-specific tables (`tips`, `wishlist_*`, `post_purchases`) link back to `payments`.

# Services

## PaymentGatewayManager

Resolves drivers via `config/payments.php`, supports custom extensions, and exposes `driver()` / `subscriptionDriver()` APIs. Defaults to the in-memory `FakeGateway`, which allows deterministic flows in development and automated tests.

## PaymentService

Central orchestrator for payment intents, captures, cancellations, and refunds. Every mutation dispatches domain events (`PaymentInitiated`, `PaymentCaptured`, `PaymentRefunded`, etc.) which power queued listeners:

- `CompleteTipOnPaymentCaptured`, `CompletePostPurchaseOnPaymentCaptured`, `FulfillWishlistPurchaseOnPaymentCaptured`
- `UpdateLedgerOnPaymentCaptured` and `UpdateLedgerOnPaymentRefunded`
- `LogPaymentLifecycle` for activity logging
- Failure & refund listeners mirror the success path

## SubscriptionService

Creates, renews, expires, and cancels subscriptions. Handles grace periods, renewals, and failure states, emitting events like `SubscriptionRenewed`, `SubscriptionEnteredGrace`, and `SubscriptionPaymentFailed`.

## EntitlementService

Provides read-layer helpers (`hasActiveSubscription`, `hasUnlockedPost`) used by policies and feed logic.

## Feature Services

- `TipService`, `WishlistService`, and `PostLockService` all compose the payment service to initiate payments tied to specific domain entities. Status transitions rely on queued listeners to react to payment events.
- `AdminReportingService` surfaces aggregate analytics (gross/net revenue, outstanding volume, channel breakdowns, recurring revenue by creator) with short-lived cache layers.

# Gateway Abstraction

`App\Payments\Contracts\PaymentGatewayContract` and `SubscriptionGatewayContract` define gateway capabilities using DTOs under `App\Payments\Data`. Adding a real provider requires implementing these contracts and registering the driver in `config/payments.php`.

# Scheduling & Commands

- `payments:expire-pending` – cancels stale intents/payments and dispatches lifecycle events.
- `subscriptions:expire` – finalizes billing cycles and grace periods.
- `subscriptions:send-renewal-reminders` – dispatches `SubscriptionRenewalReminder` events ahead of renewals/grace expiry.

The commands are scheduled in `routes/console.php` (every fifteen minutes to twice daily cadence). All commands support a `--dry-run` mode for safe introspection.

# Webhooks

`POST /api/webhooks/payments/{provider}` writes inbound payloads to `payment_webhooks` and enqueues `ProcessPaymentWebhook`. The job currently marks records as processed; when integrating a live provider, extend the job to map payloads to domain events. Sample fixtures live under `tests/Fixtures/Payments/`.

# Activity Logging

Queued listeners push lifecycle entries into `activity_log` with log names `payments`, `payment_intents`, and `subscriptions`. Each log stores event class names and payloads so administrators can audit transitions without combing through raw logs.

# Testing Strategy

- **Unit:** `tests/Unit/Payments/PaymentServiceTest.php` exercises core service flows (intent, capture, cancel, refund) and event dispatch.
- **Feature:** `tests/Feature/Payments/SubscriptionEndpointsTest.php` validates API endpoints; `PaymentWebhookTest.php` asserts webhook intake; `TipIntegrationTest.php` walks through capture and refund flows, checking ledger and activity side effects.
- **Fixtures:** JSON payloads under `tests/Fixtures/Payments/` seed deterministic webhook simulations.

# Configuration & Environment

`config/payments.php` centralises defaults:

- `default` gateway (env: `PAYMENTS_DEFAULT_GATEWAY`)
- Supported currencies & platform fee knobs
- Per-gateway options (the fake gateway exposes toggles for status overrides)
- Webhook secrets and replay protection window

Environment variables should be defined in `.env` / deployment secrets before enabling live providers.

# Next Integration Steps

1. Implement a real gateway adapter (e.g., CCBill) by subclassing the contracts.
2. Extend `ProcessPaymentWebhook` to translate provider events into domain `Payment*` / `Subscription*` events.
3. Align `AdminReportingService` output with product analytics dashboards (Wayfinder/React client).
4. Harden renewal reminders by connecting `SubscriptionRenewalReminder` to notification channels once messaging UX is ready.


