# CCBill Payment Gateway Integration

## Overview

This document describes the CCBill payment gateway integration for the application. CCBill provides payment processing, tokenization/vaulting, and 3D Secure (3DS) authentication capabilities.

## Architecture

### Components

1. **CCBillGateway** (`app/Payments/Gateways/CCBill/CCBillGateway.php`)
   - Main gateway implementation implementing `PaymentGatewayContract` and `SubscriptionGatewayContract`
   - Handles payment intents, captures, refunds, and token creation
   - Coordinates between OAuth, HTTP client, and subaccount resolver

2. **CCBillOAuthManager** (`app/Payments/Gateways/CCBill/CCBillOAuthManager.php`)
   - Manages OAuth token generation for backend and frontend API calls
   - Backend tokens are cached (default: 1 hour)
   - Frontend tokens are generated on-demand (not cached for security)

3. **CCBillHttpClient** (`app/Payments/Gateways/CCBill/CCBillHttpClient.php`)
   - Handles all HTTP requests to CCBill RESTful API
   - Implements retry logic with exponential backoff
   - Sanitizes sensitive data in logs
   - Supports 3DS and non-3DS token creation

4. **CCBillSubaccountResolver** (`app/Payments/Gateways/CCBill/CCBillSubaccountResolver.php`)
   - Determines which CCBill subaccount to use based on payment type and risk
   - Subaccount mapping:
     - **Vaulting**: Always uses Low Risk Non-Recurring
     - **Tips**: Low Risk Non-Recurring
     - **Wishlist**: Low Risk Non-Recurring
     - **Site Subscriptions**: Low Risk Non-Recurring
     - **Creator Subscriptions**: High Risk Non-Recurring
     - **Creator Paywall**: High Risk Non-Recurring

5. **CCBillWebhookProcessor** (`app/Services/Payments/CCBillWebhookProcessor.php`)
   - Processes webhook events from CCBill
   - Verifies webhook signatures (HMAC-SHA256)
   - Handles idempotency to prevent duplicate processing
   - Maps CCBill events to internal payment statuses

### Frontend Components

1. **CCBill Advanced Widget** (`resources/js/lib/ccbill-widget.ts`)
   - JavaScript integration for CCBill Advanced Widget
   - Handles widget initialization, token creation, and 3DS flow
   - Collects browser/network information for fraud detection

2. **Payment Method Management** (`resources/js/components/payments/`)
   - `CCBillCardForm.tsx`: Form for entering new card details
   - `PaymentMethodSelector.tsx`: Component for selecting saved payment methods
   - `CheckoutForm.tsx`: Standardized checkout form component
   - `CheckoutSummary.tsx`: Displays order summary

## Payment Flow

### 1. Vaulting a Payment Method

1. User fills out card form (`CCBillCardForm`)
2. Frontend fetches frontend bearer token from `/api/payment-methods/frontend-token`
3. CCBill widget creates payment token with 3DS (if supported)
4. Frontend sends token to `/api/payment-methods` to vault
5. Backend fetches card details from CCBill API
6. Payment method stored in `payment_methods` table

### 2. Charging a Payment

1. User selects payment method (or adds new one)
2. Frontend sends `payment_method_id` with payment request
3. Backend resolves subaccount based on payment type
4. Backend charges payment token via CCBill API
5. Payment status updated via webhook

### 3. 3D Secure (3DS) Flow

1. Always attempt 3DS first for security
2. If bank doesn't support 3DS → fallback to non-3DS
3. If 3DS authentication fails → card is NOT vaulted (security requirement)
4. 3DS challenge handled by CCBill widget (iframe/modal)

## Configuration

### Environment Variables

See `CCBILL_ENV_TEMPLATE.md` for complete list of required environment variables.

Key variables:
- `CCBILL_FRONTEND_APP_ID`: Frontend application ID for widget token generation
- `CCBILL_FRONTEND_SECRET`: Frontend secret
- `CCBILL_BACKEND_APP_ID`: Backend application ID for API calls
- `CCBILL_BACKEND_SECRET`: Backend secret
- `CCBILL_LOW_RISK_NON_RECURRING_ACCNUM`: Low risk account number
- `CCBILL_LOW_RISK_NON_RECURRING_SUBACC`: Low risk subaccount number
- `CCBILL_HIGH_RISK_NON_RECURRING_ACCNUM`: High risk account number
- `CCBILL_HIGH_RISK_NON_RECURRING_SUBACC`: High risk subaccount number
- `CCBILL_WEBHOOK_SECRET`: Secret for webhook signature verification

### Configuration File

Configuration is stored in `config/payments.php` under `gateways.ccbill`.

## API Endpoints

### Payment Methods

- `GET /api/payment-methods` - List user's payment methods
- `POST /api/payment-methods` - Vault a payment token
- `DELETE /api/payment-methods/{id}` - Delete a payment method
- `POST /api/payment-methods/{id}/set-default` - Set default payment method
- `GET /api/payment-methods/frontend-token?gateway=ccbill` - Get frontend bearer token

### Webhooks

- `POST /webhooks/payments/ccbill` - CCBill webhook endpoint

## Database Schema

### payment_methods Table

- `id`: Primary key
- `user_id`: Foreign key to users table
- `provider`: Payment gateway (e.g., 'ccbill')
- `provider_method_id`: Payment token ID from gateway
- `type`: Payment method type (e.g., 'card')
- `brand`: Card brand (e.g., 'visa', 'mastercard')
- `last_four`: Last 4 digits of card
- `exp_month`: Expiration month
- `exp_year`: Expiration year
- `fingerprint`: Card fingerprint for duplicate detection
- `is_default`: Whether this is the user's default payment method
- `status`: Payment method status (active, deleted)
- `metadata`: JSON metadata

## Security

### PCI Compliance

- Card data never touches our servers
- CCBill widget handles all card data collection
- Only payment tokens are stored (not card numbers)
- All sensitive data is sanitized in logs

### Webhook Security

- Webhook signatures verified using HMAC-SHA256
- Idempotency checks prevent duplicate processing
- Webhook replay window: 5 minutes (configurable)

### Fraud Detection

The integration collects and sends the following data to CCBill for fraud detection:
- `ipAddress`: Customer's IP address
- `browserHttpUserAgent`: Browser User-Agent header
- `browserHttpAccept`: Browser Accept header
- `browserHttpAcceptEncoding`: Browser Accept-Encoding header
- `browserHttpAcceptLanguate`: Browser Accept-Language header

## Error Handling

### Exception Types

- `CCBillApiException`: General API errors
- `CCBillOAuthException`: OAuth token generation errors
- `CCBill3DSNotSupportedException`: Bank doesn't support 3DS
- `CCBill3DSFailedException`: 3DS authentication failed

### Retry Logic

- Default retry attempts: 3
- Exponential backoff between retries
- Client errors (4xx) are not retried
- Server errors (5xx) are retried

## Testing

### Unit Tests

- `tests/Unit/Payments/Gateways/CCBill/CCBillSubaccountResolverTest.php`
- `tests/Unit/Payments/Gateways/CCBill/CCBillOAuthManagerTest.php`
- `tests/Unit/Payments/Gateways/CCBill/CCBillHttpClientTest.php`
- `tests/Unit/Payments/Gateways/CCBill/CCBillGatewayTest.php`

### Feature Tests

- `tests/Feature/Payments/PaymentMethodVaultingTest.php`
- `tests/Feature/Payments/CCBillWebhookTest.php`

### Running Tests

```bash
# Run all CCBill tests
php artisan test --filter CCBill

# Run specific test suite
php artisan test tests/Unit/Payments/Gateways/CCBill/CCBillSubaccountResolverTest.php
```

## Monitoring

### Logs

All CCBill operations are logged with:
- Correlation IDs for request tracking
- Sanitized sensitive data
- Error details and stack traces

### Key Metrics to Monitor

- Payment success rate
- 3DS success rate
- Webhook processing time
- API response times
- Error rates by type

## Troubleshooting

### Widget Not Loading

1. Check browser console for script loading errors
2. Verify `VITE_CCBILL_WIDGET_URL` environment variable (if custom)
3. Check CCBill documentation for latest widget URL
4. Verify frontend credentials are correct

### Token Creation Failing

1. Check frontend bearer token is valid
2. Verify client account/subaccount numbers
3. Check browser console for widget errors
4. Review CCBill API logs for detailed error messages

### Webhook Not Processing

1. Verify webhook secret matches CCBill configuration
2. Check webhook signature verification logs
3. Review `payment_webhooks` table for error messages
4. Ensure webhook endpoint is publicly accessible

## Support

For CCBill-specific issues:
- CCBill RESTful API Guide: https://github.com/CCBill/restful-api-guide
- CCBill Support: Contact your CCBill account manager

For application-specific issues:
- Review application logs: `storage/logs/laravel.log`
- Check webhook processing logs
- Review payment method service logs



