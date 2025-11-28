# CCBill Integration Rollback Strategy

## Overview

This document outlines the rollback strategy for the CCBill payment gateway integration. Rollback procedures are designed to minimize downtime and user impact.

## Rollback Triggers

Rollback should be initiated if:

1. Payment success rate drops below 85%
2. Critical errors preventing payment processing
3. Webhook processing failures exceeding 10%
4. Security vulnerabilities discovered
5. CCBill API outages affecting our application
6. Data integrity issues discovered

## Rollback Levels

### Level 1: Configuration Rollback (Fastest - ~1 minute)

**When to use**: Temporary issues, testing, or quick disable

**Steps**:

1. Update `.env` file:
   ```bash
   PAYMENTS_DEFAULT_GATEWAY=fake
   ```

2. Clear configuration cache:
   ```bash
   php artisan config:clear
   ```

3. Verify:
   - Check `config('payments.default')` returns `'fake'`
   - Test payment flow uses fake gateway

**Impact**: 
- Users can still make payments using fake gateway
- Existing vaulted CCBill payment methods remain but won't be used
- No code changes required
- Reversible immediately

**Rollback Time**: ~1 minute

---

### Level 2: Feature Flag Rollback (Fast - ~5 minutes)

**When to use**: Need to disable CCBill but keep code deployed

**Steps**:

1. Add feature flag to `.env`:
   ```bash
   CCBILL_ENABLED=false
   ```

2. Update `config/payments.php`:
   ```php
   'gateways' => [
       'ccbill' => [
           'enabled' => env('CCBILL_ENABLED', true),
           // ... rest of config
       ],
   ],
   ```

3. Update gateway selection logic to check feature flag

4. Clear caches:
   ```bash
   php artisan config:clear
   php artisan route:clear
   ```

**Impact**:
- CCBill gateway disabled
- Users redirected to alternative payment methods
- Code remains deployed (easier to re-enable)
- Requires code changes (if not already implemented)

**Rollback Time**: ~5 minutes

---

### Level 3: Code Rollback (Moderate - ~15 minutes)

**When to use**: Code issues, bugs, or need to revert to previous version

**Steps**:

1. Identify last known good commit:
   ```bash
   git log --oneline
   ```

2. Create rollback branch:
   ```bash
   git checkout -b rollback-ccbill-YYYY-MM-DD
   git reset --hard <last-good-commit>
   ```

3. Deploy rollback branch:
   ```bash
   git push origin rollback-ccbill-YYYY-MM-DD --force
   ```

4. On server:
   ```bash
   git fetch origin
   git checkout rollback-ccbill-YYYY-MM-DD
   composer install --no-dev
   npm run build
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   ```

5. Restart application server (if needed)

**Impact**:
- Reverts to previous code version
- May lose recent features/fixes
- Requires deployment process
- Database migrations may need rollback

**Rollback Time**: ~15 minutes

---

### Level 4: Database Rollback (Slow - ~30 minutes)

**When to use**: Database schema changes causing issues

**Steps**:

1. Identify migrations to rollback:
   ```bash
   php artisan migrate:status
   ```

2. Rollback specific migrations:
   ```bash
   php artisan migrate:rollback --step=1
   ```

3. Or rollback to specific batch:
   ```bash
   php artisan migrate:rollback --batch=5
   ```

4. Verify database state:
   ```bash
   php artisan migrate:status
   ```

5. If needed, restore from backup:
   ```bash
   # Restore database backup
   mysql -u user -p database < backup.sql
   ```

**Impact**:
- May lose recent data
- Requires database backup
- More complex recovery
- May affect other features

**Rollback Time**: ~30 minutes

---

## Communication Plan

### Internal Team

1. **Immediate** (within 5 minutes):
   - Notify development team via Slack/email
   - Create incident ticket
   - Assign on-call engineer

2. **Status Updates** (every 15 minutes):
   - Update team on rollback progress
   - Share metrics/impact assessment
   - Coordinate next steps

### Users

1. **If rollback affects payments**:
   - Display maintenance message on payment pages
   - Provide alternative payment methods if available
   - Update status page if applicable

2. **Post-Rollback**:
   - Send notification when service restored
   - Apologize for inconvenience
   - Provide timeline for fix

## Post-Rollback Actions

### 1. Investigation

- [ ] Review error logs
- [ ] Analyze payment metrics
- [ ] Check CCBill API status
- [ ] Review webhook processing logs
- [ ] Identify root cause

### 2. Fix Development

- [ ] Create fix branch
- [ ] Implement solution
- [ ] Write tests
- [ ] Code review
- [ ] Test in staging

### 3. Re-Deployment

- [ ] Deploy fix to staging
- [ ] Run full test suite
- [ ] Verify in staging environment
- [ ] Deploy to production
- [ ] Monitor closely for 24 hours

### 4. Documentation

- [ ] Document incident
- [ ] Update runbook if needed
- [ ] Share learnings with team
- [ ] Update rollback strategy if needed

## Prevention Measures

### Pre-Deployment

- [ ] Comprehensive testing in staging
- [ ] Load testing
- [ ] Security review
- [ ] Code review
- [ ] Documentation review

### Monitoring

- [ ] Real-time payment success rate monitoring
- [ ] Webhook processing alerts
- [ ] API error rate alerts
- [ ] 3DS failure rate alerts
- [ ] Database health monitoring

### Gradual Rollout

Consider implementing:
- Feature flags for gradual rollout
- Percentage-based routing (e.g., 10% to CCBill, 90% to fake)
- A/B testing for new payment flows
- Canary deployments

## Emergency Contacts

- **On-Call Engineer**: [Contact]
- **CCBill Support**: [Contact]
- **Database Admin**: [Contact]
- **Infrastructure Team**: [Contact]

## Testing Rollback Procedures

**Regular Testing Schedule**: Quarterly

1. Test Level 1 rollback (configuration)
2. Test Level 2 rollback (feature flag)
3. Document any issues encountered
4. Update procedures as needed

## Notes

- Always have a rollback plan before deployment
- Keep last known good commit easily accessible
- Maintain database backups
- Test rollback procedures regularly
- Document all rollbacks for future reference



