# CCBill Widget CORS Issue on Localhost

## Problem

When running the application on `localhost:8000`, you may encounter CORS (Cross-Origin Resource Sharing) errors when trying to add a payment method:

```
Access to fetch at 'https://api.ccbill.com/...' from origin 'http://localhost:8000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

This happens because CCBill's API does not allow direct browser requests from `localhost` origins for security reasons.

## Why This Happens

The CCBill Advanced Widget is designed to make direct API calls from the browser to CCBill's servers for PCI compliance (card data never touches your servers). However, CCBill's API has CORS restrictions that block requests from `localhost` origins.

## Solutions

### Solution 1: Use a Local Domain (Recommended for Development)

Instead of `localhost:8000`, use a local domain that your system recognizes:

#### For Laravel Herd:
1. Herd automatically creates `.test` domains for your projects
2. Access your site via: `http://realkinkmen.test` instead of `http://localhost:8000`
3. Update your `.env` file:
   ```env
   APP_URL=http://realkinkmen.test
   ```

#### For Laravel Valet:
1. Valet automatically creates `.test` domains
2. Access your site via: `http://realkinkmen.test`
3. Update your `.env` file:
   ```env
   APP_URL=http://realkinkmen.test
   ```

#### For Custom Setup:
1. Add to your `/etc/hosts` file:
   ```
   127.0.0.1 realkinkmen.local
   ```
2. Access via: `http://realkinkmen.local:8000`
3. Update your `.env` file:
   ```env
   APP_URL=http://realkinkmen.local:8000
   ```

### Solution 2: Contact CCBill Support

Contact CCBill support and ask them to whitelist your localhost for development:

1. **Email CCBill Support** with:
   - Your merchant account information
   - Request to whitelist `http://localhost:8000` for development
   - Explain it's for local development/testing only

2. **Alternative**: Ask if they have a sandbox/test environment that allows localhost

### Solution 3: Use a Staging/Production Domain

Deploy your application to a staging or production environment with a real domain:

1. Deploy to a staging server (e.g., `staging.realkinkmen.com`)
2. Test payment methods on the staging environment
3. CCBill APIs work normally on real domains

### Solution 4: Browser Extension (Development Only - Not Recommended)

⚠️ **Warning**: Only use this for local development. Never use in production.

1. Install a CORS browser extension (e.g., "CORS Unblock" for Chrome)
2. Enable it only for localhost
3. **Disable it immediately after testing**

**Why not recommended:**
- Bypasses important security features
- Can mask other issues
- Not representative of real user experience

## Error Detection

The application automatically detects CORS errors and displays helpful error messages with these solutions when running on localhost.

## Testing Payment Methods

Once you've resolved the CORS issue using one of the solutions above:

1. Navigate to `/settings/payment-methods`
2. Click "Add Payment Method"
3. Fill out the card form
4. The widget should now successfully create payment tokens

## Production Considerations

- CORS issues should **not** occur in production on a real domain
- If you encounter CORS errors in production, contact CCBill support immediately
- Ensure your production domain is properly configured in CCBill's merchant portal

## Related Documentation

- [CCBill Integration Guide](./CCBILL_INTEGRATION.md)
- [CCBill Widget Setup Notes](../CCBILL_WIDGET_SETUP_NOTES.md)

