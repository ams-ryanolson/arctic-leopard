# CCBill Integration Deployment Checklist

## Pre-Deployment

### 1. Environment Variables

- [ ] `CCBILL_FRONTEND_APP_ID` - Frontend application ID
- [ ] `CCBILL_FRONTEND_SECRET` - Frontend secret
- [ ] `CCBILL_BACKEND_APP_ID` - Backend application ID
- [ ] `CCBILL_BACKEND_SECRET` - Backend secret
- [ ] `CCBILL_API_BASE_URL` - API base URL (production: `https://api.ccbill.com`)
- [ ] `CCBILL_LOW_RISK_NON_RECURRING_ACCNUM` - Low risk account number
- [ ] `CCBILL_LOW_RISK_NON_RECURRING_SUBACC` - Low risk subaccount number
- [ ] `CCBILL_HIGH_RISK_NON_RECURRING_ACCNUM` - High risk account number
- [ ] `CCBILL_HIGH_RISK_NON_RECURRING_SUBACC` - High risk subaccount number
- [ ] `CCBILL_WEBHOOK_SECRET` - Webhook signature secret
- [ ] `CCBILL_VERIFY_WEBHOOK_SIGNATURE` - Set to `true` for production
- [ ] `CCBILL_OAUTH_CACHE_TTL` - OAuth token cache TTL (default: 3600)
- [ ] `CCBILL_HTTP_TIMEOUT` - HTTP request timeout (default: 10)
- [ ] `CCBILL_RETRY_ATTEMPTS` - Retry attempts (default: 3)
- [ ] `PAYMENTS_DEFAULT_GATEWAY` - Set to `ccbill` for production

### 2. Database Migrations

- [ ] Run `php artisan migrate` to ensure `payment_methods` table exists
- [ ] Verify `payment_webhooks` table exists
- [ ] Check all payment-related tables are migrated

### 3. Configuration Verification

- [ ] Verify `config/payments.php` includes CCBill gateway configuration
- [ ] Check subaccount mappings match business requirements
- [ ] Verify webhook configuration is correct

### 4. CCBill Account Setup

- [ ] Verify CCBill merchant account is active
- [ ] Confirm subaccounts are configured correctly in CCBill portal
- [ ] Test API credentials in CCBill sandbox (if available)
- [ ] Verify webhook endpoint URL is whitelisted in CCBill portal

## Deployment Steps

### 1. Code Deployment

- [ ] Deploy code to staging environment first
- [ ] Run `composer install --no-dev` for production dependencies
- [ ] Run `npm run build` for frontend assets
- [ ] Clear application cache: `php artisan config:clear`
- [ ] Clear route cache: `php artisan route:clear`
- [ ] Clear view cache: `php artisan view:clear`

### 2. Database Migration

- [ ] Run migrations: `php artisan migrate --force`
- [ ] Verify no migration errors
- [ ] Check `payment_methods` table structure

### 3. Configuration

- [ ] Verify environment variables are set correctly
- [ ] Test configuration: `php artisan tinker` → `config('payments.gateways.ccbill')`
- [ ] Verify OAuth token generation works: Test frontend token endpoint

### 4. Webhook Setup

- [ ] Configure webhook URL in CCBill portal: `https://yourdomain.com/webhooks/payments/ccbill`
- [ ] Set webhook secret in CCBill portal (must match `CCBILL_WEBHOOK_SECRET`)
- [ ] Test webhook endpoint is accessible (use CCBill webhook test tool if available)
- [ ] Verify webhook signature verification is enabled

### 5. Frontend Assets

- [ ] Verify CCBill widget script loads correctly
- [ ] Test payment method form renders
- [ ] Check browser console for JavaScript errors
- [ ] Verify frontend token endpoint works

## Post-Deployment Verification

### 1. Smoke Tests

- [ ] Test payment method vaulting (add a test card)
- [ ] Verify payment method appears in settings
- [ ] Test setting default payment method
- [ ] Test deleting payment method
- [ ] Test payment flow with vaulted card
- [ ] Test payment flow with new card

### 2. 3DS Testing

- [ ] Test 3DS flow with card that supports 3DS
- [ ] Test fallback to non-3DS for cards that don't support it
- [ ] Verify 3DS failure prevents card vaulting

### 3. Webhook Testing

- [ ] Trigger test webhook from CCBill portal (if available)
- [ ] Verify webhook is received and processed
- [ ] Check `payment_webhooks` table for processed webhook
- [ ] Verify payment status updates correctly

### 4. Monitoring Setup

- [ ] Set up log monitoring for CCBill errors
- [ ] Configure alerts for webhook failures
- [ ] Set up payment success rate monitoring
- [ ] Monitor API response times
- [ ] Track 3DS success rates

### 5. Error Handling

- [ ] Test error handling for invalid credentials
- [ ] Test error handling for API failures
- [ ] Verify user-friendly error messages
- [ ] Check error logging is working

## Rollback Plan

If issues occur:

1. **Immediate Rollback**:
   - Set `PAYMENTS_DEFAULT_GATEWAY=fake` in `.env`
   - Clear config cache: `php artisan config:clear`
   - Users can still use fake gateway for testing

2. **Code Rollback**:
   - Revert to previous git commit
   - Run `composer install`
   - Run `npm run build`
   - Clear all caches

3. **Database Rollback**:
   - If migrations were run, rollback: `php artisan migrate:rollback`
   - Restore database backup if needed

## Production Monitoring

### Key Metrics

- Payment success rate (target: >95%)
- 3DS success rate (target: >80%)
- Webhook processing time (target: <5 seconds)
- API response time (target: <2 seconds)
- Error rate (target: <1%)

### Alerts

Set up alerts for:
- Payment success rate drops below 90%
- Webhook processing failures
- API error rate exceeds 5%
- 3DS failure rate exceeds 20%

### Logs to Monitor

- `storage/logs/laravel.log` - Application logs
- CCBill API logs (if available)
- Webhook processing logs
- Payment method vaulting logs

## Support Contacts

- **CCBill Support**: [Your CCBill account manager contact]
- **Internal Team**: [Your team contact]
- **Emergency Escalation**: [Escalation contact]

## Notes

- Always test in staging before production deployment
- Keep CCBill credentials secure (use environment variables, never commit)
- Monitor webhook processing closely in first 24 hours
- Have rollback plan ready before deployment
- Document any issues encountered for future reference



