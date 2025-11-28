# CCBill Widget Setup Notes

## Current Implementation

The CCBill widget integration is implemented with the following assumptions:

1. **Widget Script URL**: `https://widget.ccbill.com/v1/advanced-widget.js`
   - ⚠️ **VERIFY THIS URL** with CCBill documentation or support
   - The actual URL may be different

2. **Widget API Structure**: 
   - Expected: `window.CCBill.AdvancedWidget`
   - The widget is initialized as: `new window.CCBill.AdvancedWidget(config)`
   - ⚠️ **VERIFY THIS API** with CCBill documentation

3. **Widget Methods**:
   - `attach(element)` - Attaches widget to a DOM element
   - `detach()` - Detaches widget from DOM
   - `createToken(options)` - Creates payment token (returns Promise<string>)
   - `destroy()` - Destroys widget instance

## Debugging

If the widget isn't loading, check the browser console for:

1. **Script Loading Errors**: 
   - "Failed to load CCBill widget script"
   - Check network tab to see if script URL is accessible
   - Verify CORS settings if loading from different domain

2. **Widget API Errors**:
   - "CCBill widget library not loaded"
   - "CCBill Advanced Widget not available"
   - Check what's actually available on `window.CCBill`

3. **Initialization Errors**:
   - Check bearer token is being fetched correctly
   - Verify client account numbers are valid
   - Check widget configuration matches CCBill requirements

## Next Steps

1. **Get CCBill Widget Documentation**:
   - Contact CCBill support or check merchant portal
   - Verify the correct widget script URL
   - Verify the correct API structure and methods

2. **Update Widget Script URL**:
   - Once you have the correct URL, update `WIDGET_SCRIPT_URL` in `resources/js/lib/ccbill-widget.ts`

3. **Update Widget API**:
   - If the API structure is different, update the TypeScript types and initialization code in `resources/js/lib/ccbill-widget.ts`

4. **Test Widget Loading**:
   - Open browser console when loading payment methods page
   - Check for any errors or warnings
   - Verify widget script loads successfully
   - Verify widget initializes correctly

## Common Issues

1. **Widget Script Not Found (404)**:
   - The script URL is incorrect
   - Update `WIDGET_SCRIPT_URL` with correct URL from CCBill docs

2. **Widget Not Attaching**:
   - Container element might not be ready when widget tries to attach
   - Check that `containerRef.current` exists before calling `attach()`

3. **Bearer Token Issues**:
   - Frontend token endpoint might not be working
   - Check backend logs for token generation errors
   - Verify CCBill API credentials are correct

4. **CORS Errors**:
   - Widget script might be blocked by CORS
   - CCBill may need to whitelist your domain
   - Check browser console for CORS errors



