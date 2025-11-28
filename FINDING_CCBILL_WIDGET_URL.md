# Finding the Correct CCBill Widget URL

## Current Issue

The CCBill widget script is failing to load. The URL `https://widget.ccbill.com/v1/advanced-widget.js` is returning an error (likely 404).

## Steps to Find the Correct Widget URL

### 1. Check CCBill RESTful API Documentation
- Review: https://github.com/CCBill/restful-api-guide
- Look for sections on:
  - "JavaScript SDK"
  - "Widget Integration"
  - "Frontend Integration"
  - "Client-Side Tokenization"

### 2. Check CCBill Merchant Portal
- Log into your CCBill merchant account
- Look for:
  - Developer/Integration documentation
  - Widget/SDK download links
  - JavaScript integration guides
  - API documentation sections

### 3. Contact CCBill Support
- Ask specifically: "What is the JavaScript widget/SDK script URL for tokenizing credit cards?"
- Provide context: "I'm integrating CCBill RESTful API and need the frontend widget script URL"

### 4. Check Network Tab
- Open browser DevTools → Network tab
- Try loading the payment methods page
- Look for failed script requests
- Check the exact error (404, CORS, etc.)

## Alternative Approaches

If CCBill **doesn't provide a JavaScript widget**, you have these options:

### Option 1: Server-Side Tokenization
- Collect card data securely on your server (PCI compliant)
- Use CCBill REST API to tokenize server-side
- Store tokens in your database
- **Pros**: More secure, PCI compliant
- **Cons**: Requires PCI compliance on your server

### Option 2: CCBill Hosted Forms
- Redirect users to CCBill-hosted payment forms
- CCBill handles card collection and tokenization
- Receive tokens via webhooks or redirect callbacks
- **Pros**: No PCI compliance needed
- **Cons**: Users leave your site

### Option 3: Iframe Integration
- Embed CCBill payment forms in an iframe
- CCBill handles card collection
- Receive tokens via postMessage or callbacks
- **Pros**: Users stay on your site
- **Cons**: More complex integration

## Updating the Widget URL

Once you find the correct URL:

1. **Option A: Environment Variable** (Recommended)
   ```env
   VITE_CCBILL_WIDGET_URL=https://correct-url-here.com/widget.js
   ```
   Then rebuild: `npm run build` or `npm run dev`

2. **Option B: Direct Code Update**
   Edit `resources/js/lib/ccbill-widget.ts`:
   ```typescript
   const WIDGET_SCRIPT_URL = 'https://correct-url-here.com/widget.js';
   ```

## Testing

After updating the URL:
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Check browser console for script loading success
4. Verify `window.CCBill` object exists
5. Test widget initialization

## Current Error Details

- **Error**: Script failed to load
- **URL Attempted**: `https://widget.ccbill.com/v1/advanced-widget.js`
- **Likely Cause**: Incorrect URL or CCBill doesn't provide a JavaScript widget
- **Next Step**: Verify widget URL with CCBill documentation/support



