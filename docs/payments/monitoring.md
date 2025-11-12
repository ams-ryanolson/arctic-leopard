# Payments Monitoring Guide

## Logs & Activity

- **Laravel Logs (`storage/logs/laravel.log`)**
  - Search for `payment.lifecycle`, `payment_intent.lifecycle`, `subscription.lifecycle`.
  - Each entry includes payload metadata and mirrors the activity log for quick tailing.
- **Activity Log (`activity_log` table)**
  - Log names: `payments`, `payment_intents`, `subscriptions`.
  - Key columns: `event`, `subject_id`, `causer_id`, `properties`.
  - Use for audit-ready history or constructing dashboards.

## Metrics & Counters

While a metrics backend is not yet wired, the following queries can power dashboards:

- Total gross/net volume – `AdminReportingService::paymentsSummary()`
- Monthly revenue trend – `AdminReportingService::monthlyRevenue()`
- Outstanding captured volume – `AdminReportingService::outstandingCapturedVolume()`
- Channel mix (tips/wishlist/unlocks) – `AdminReportingService::oneTimeChannelBreakdown()`
- Recurring MRR by creator – `AdminReportingService::topCreatorsByRecurringRevenue()`

## Scheduled Jobs

Monitor scheduler outputs (every job writes to logs when invoked):

- `payments:expire-pending`
- `subscriptions:expire`
- `subscriptions:send-renewal-reminders`
- Cron output can be redirected to a log file or systemd journal for alerting.

## Queue Health

- Queue connection runs in `sync` locally but should be `redis` or another persistent driver in production.
- Ensure:
  ```bash
  php artisan queue:work --queue=default
  ```
  is supervised (systemd, supervisor, etc.). Watch for failed jobs (`php artisan queue:failed`).

## Webhooks

- `payment_webhooks` table: inspect `status`, `processed_at`, and `exception`.
- For failures, replay by re-queuing the job:
  ```bash
  php artisan queue:retry {job-id}
  ```

## Alerts & Thresholds (Suggested)

- Alert on:
  - High count of failed payments in a rolling window.
  - Webhook processing failures.
  - `payments:test-gateway` command failure (use automation to run nightly).
  - Subscriptions entering grace or past due beyond expected thresholds.

Tie alerting into your observability stack once a metrics backend is connected (StatsD/Prometheus/Grafana).


