# CCBill Payment Gateway Configuration

Add these environment variables to your `.env` file:

```env
# ============================================================================
# CCBill Payment Gateway Configuration
# ============================================================================

# Default Payment Gateway
# Set to 'ccbill' to use CCBill as the default gateway, or 'fake' for testing
PAYMENTS_DEFAULT_GATEWAY=ccbill

# CCBill API Credentials
# Frontend credentials (for widget token generation)
CCBILL_FRONTEND_APP_ID=your_frontend_app_id_here
CCBILL_FRONTEND_SECRET=your_frontend_secret_here

# Backend credentials (for API calls)
CCBILL_BACKEND_APP_ID=your_backend_app_id_here
CCBILL_BACKEND_SECRET=your_backend_secret_here

# CCBill API Base URL
# Use 'https://api.ccbill.com' for production
# Use 'https://api.ccbill.com' or sandbox URL for testing (check CCBill docs)
CCBILL_API_BASE_URL=https://api.ccbill.com

# Low Risk Non-Recurring Subaccount
# Used for: Tips, Wishlist, Site Subscriptions (vaulting uses this too)
CCBILL_LOW_RISK_NON_RECURRING_ACCNUM=your_low_risk_account_number
CCBILL_LOW_RISK_NON_RECURRING_SUBACC=your_low_risk_subaccount_number

# High Risk Non-Recurring Subaccount
# Used for: Creator Subscriptions, Creator Paywall (Post purchases)
CCBILL_HIGH_RISK_NON_RECURRING_ACCNUM=your_high_risk_account_number
CCBILL_HIGH_RISK_NON_RECURRING_SUBACC=your_high_risk_subaccount_number

# OAuth Token Cache TTL (in seconds)
# Default: 3600 (1 hour)
CCBILL_OAUTH_CACHE_TTL=3600

# HTTP Request Timeout (in seconds)
# Default: 10
CCBILL_HTTP_TIMEOUT=10

# Retry Attempts for Failed API Calls
# Default: 3
CCBILL_RETRY_ATTEMPTS=3

# Webhook Configuration
# Secret key for verifying webhook signatures from CCBill
CCBILL_WEBHOOK_SECRET=your_webhook_secret_here

# Webhook Signature Verification
# Set to 'true' to verify webhook signatures (recommended for production)
# Set to 'false' for testing/development
CCBILL_VERIFY_WEBHOOK_SIGNATURE=true

# Webhook Replay Window (in seconds)
# Default: 300 (5 minutes)
PAYMENTS_WEBHOOK_REPLAY_WINDOW=300
```

## Notes:

1. **Account Numbers**: You'll need to get these from your CCBill merchant account dashboard. Each subaccount (low risk, high risk) will have its own account number and subaccount number.

2. **Frontend vs Backend Credentials**: 
   - Frontend credentials are used to generate bearer tokens for the CCBill widget
   - Backend credentials are used for server-side API calls (charging tokens, etc.)

3. **Webhook Secret**: This should be set in your CCBill merchant dashboard and must match what you configure here.

4. **Testing**: For testing, you may want to:
   - Use CCBill sandbox/test credentials if available
   - Set `PAYMENTS_DEFAULT_GATEWAY=fake` to use the fake gateway for development
   - Set `CCBILL_VERIFY_WEBHOOK_SIGNATURE=false` during development

5. **Production**: Before going live:
   - Ensure all credentials are production values
   - Set `CCBILL_VERIFY_WEBHOOK_SIGNATURE=true`
   - Configure webhook URL in CCBill dashboard: `https://yourdomain.com/api/webhooks/payments/ccbill`
   - Test webhook delivery



