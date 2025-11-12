# Payments Onboarding Checklist

## 1. Environment Variables

Update your `.env` (and CI/CD secrets) with baseline values:

- `PAYMENTS_DEFAULT_GATEWAY=fake` (or the real provider once implemented)
- `PAYMENTS_DEFAULT_CURRENCY=USD`
- `PAYMENTS_SUPPORTED_CURRENCIES=USD`
- Optional fee knobs:
  - `PAYMENTS_PLATFORM_PERCENT=0`
  - `PAYMENTS_PLATFORM_FIXED=0`
- Webhook signing:
  - `PAYMENTS_FAKE_WEBHOOK_SECRET=local-secret`
  - `PAYMENTS_WEBHOOK_REPLAY_WINDOW=300`

## 2. Database & Migrations

Run the full migration suite – the payments tables ship with UUIDs, soft deletes, and supporting indices:

```bash
php artisan migrate
```

Optionally seed demo data:

```bash
php artisan db:seed --class=SampleContentSeeder
```

## 3. Local Testing

The fake gateway allows complete end-to-end flows without external APIs:

- Create plan → subscribe via `POST /api/subscriptions`
- Tip/unlock content via the existing service layer (`TipService`, `PostLockService`)
- Trigger lifecycle jobs:
  - `php artisan payments:expire-pending --dry-run`
  - `php artisan subscriptions:expire --dry-run`
  - `php artisan subscriptions:send-renewal-reminders --dry-run`
- Run gateway smoke test:
  - `php artisan payments:test-gateway`
  - `php artisan payments:test-gateway stripe --intent` (replace `stripe` with real driver name)

## 4. Queues & Scheduling

Ensure the queue worker is running (listeners implement `ShouldQueue`):

```bash
php artisan queue:work
```

Register the scheduler tasks (or rely on the existing `routes/console.php` entries):

```bash
* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
```

## 5. Webhooks

- Point provider webhooks to `POST /api/webhooks/payments/{provider}`.
- Store raw payload fixtures in `tests/Fixtures/Payments/` for regression coverage.
- Process jobs via `php artisan queue:work` or run `ProcessPaymentWebhook` manually in development to inspect behaviour.

## 6. Tests

To validate the entire stack:

```bash
php artisan test --testsuite=Unit --testsuite=Feature
```

Pay special attention to:

- `PaymentServiceTest` – service-level verification
- `SubscriptionEndpointsTest` – API contracts
- `TipIntegrationTest` – listener side effects

## 7. Rollout Notes

- When adding a new gateway, update `config/payments.php` and provide the necessary secrets.
- Use the admin reporting service (`App\Services\Payments\AdminReportingService`) to populate dashboards or API responses.
- Monitor activity logs (`activity_log` table) for lifecycle auditing.

Keep this checklist handy when onboarding new developers or introducing additional payment providers. Update it whenever the domain evolves.


