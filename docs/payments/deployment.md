# Payments Deployment Checklist

## Pre-Deployment

- [ ] Ensure `.env` has been updated with payment-specific keys (gateway credentials, webhook secrets, currency defaults).
- [ ] Confirm database backups exist before running migrations.
- [ ] Communicate maintenance window if deploying schema changes to live payment data.

## Deployment Steps

1. **Install dependencies**
   ```bash
   composer install --no-dev
   npm install --omit=dev
   npm run build
   ```
2. **Run migrations**
   ```bash
   php artisan migrate --force
   ```
3. **Backfill legacy data (one-time)**
   ```bash
   php artisan payments:migrate-legacy-purchases --dry-run
   php artisan payments:migrate-legacy-purchases
   ```
4. **Prime caches & config**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
5. **Queue & scheduler**
   - Ensure queue workers are restarted (`php artisan queue:restart`).
   - Confirm cron entry for `php artisan schedule:run` exists.

## Post-Deployment Verification

- [ ] Run smoke tests (`php artisan payments:test-gateway <driver> --intent`).
- [ ] Create a test subscription & tip using the staging UI or API.
- [ ] Verify webhooks arrive and are marked `processed` in `payment_webhooks`.
- [ ] Monitor application logs/activity log for unexpected failures.
- [ ] Check admin dashboards fed by `AdminReportingService`.

## Rollback Plan

If rollback required:

1. Revert code deploy (git checkout previous release or use deploy tooling).
2. Run `php artisan migrate:rollback` if new migrations caused issues.
3. Restore database snapshot if necessary.
4. Rebuild caches (`php artisan config:clear`, etc.).

Document any incident details and update this checklist if gaps are discovered.


