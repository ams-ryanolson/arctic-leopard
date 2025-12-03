/**
 * CCBill Advanced Widget Integration
 * Handles widget initialization, token creation, and 3DS authentication
 */

declare global {
    interface Window {
        ccbill?: {
            CCBillAdvancedWidget: {
                new (config: CCBillWidgetConfig): CCBillWidgetInstance;
            };
        };
        // Legacy uppercase support (if CCBill uses it)
        CCBill?: {
            CCBillAdvancedWidget: {
                new (config: CCBillWidgetConfig): CCBillWidgetInstance;
            };
        };
    }
}

export type CCBillWidgetConfig = {
    applicationId: string; // Frontend merchant application ID (for widget constructor)
    clientAccnum: number;
    clientSubacc: number;
    onSuccess?: (tokenId: string) => void;
    onError?: (error: CCBillWidgetError) => void;
    on3DSChallenge?: () => void;
    on3DSComplete?: (success: boolean) => void;
    // Form data to initialize widget with
    formData?: Record<string, string | number>;
};

export type CCBillWidgetInstance = {
    // CCBill Advanced Widget methods (actual API may differ)
    attach?: (formElement: HTMLElement) => void;
    detach?: () => void;
    render?: () => void;
    createPaymentToken?: (options?: { use3DS?: boolean }) => Promise<any>;
    createPaymentToken3DS?: (options?: any) => Promise<any>;
    authenticateCustomerAndCreatePaymentToken?: (options?: any) => Promise<any>;
    collectFieldValues?: () => Promise<any>;
    validateFields?: () => Promise<boolean>;
    fields?: {
        setFieldId?: (fieldName: string, elementId: string) => void;
        getFieldValue?: (fieldName: string) => string;
        setFieldValue?: (fieldName: string, value: string) => void;
        render?: () => void;
        collect?: () => Promise<any>;
        validate?: () => Promise<boolean>;
        [key: string]: any;
    };
    [key: string]: any; // Allow other properties
};

export type CCBillWidgetError = {
    code: string;
    message: string;
    type: 'validation' | 'network' | '3ds' | 'unknown';
};

/**
 * CCBill Advanced Widget Script URL
 * 
 * Official CCBill widget script URL: https://js.ccbill.com/v1.13.1/ccbill-advanced-widget.js
 * 
 * The widget exposes a global `ccbill` object (lowercase) with an `AdvancedWidget` class.
 * 
 * To override via environment variable, set VITE_CCBILL_WIDGET_URL in your .env file.
 */
const WIDGET_SCRIPT_URL = import.meta.env.VITE_CCBILL_WIDGET_URL || 'https://js.ccbill.com/v1.13.1/ccbill-advanced-widget.js';

let widgetScriptLoaded = false;
let widgetScriptLoading = false;

/**
 * Load CCBill widget script dynamically.
 */
export async function loadCCBillWidgetScript(): Promise<void> {
    if (widgetScriptLoaded) {
        return Promise.resolve();
    }

    if (widgetScriptLoading) {
        // Wait for existing load to complete
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (widgetScriptLoaded) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    widgetScriptLoading = true;

    return new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector(
            `script[src="${WIDGET_SCRIPT_URL}"]`,
        );

        if (existingScript) {
            widgetScriptLoaded = true;
            widgetScriptLoading = false;
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = WIDGET_SCRIPT_URL;
        script.async = true;
        script.onload = () => {
            widgetScriptLoaded = true;
            widgetScriptLoading = false;
            console.log('CCBill widget script loaded successfully');
            resolve();
        };
        script.onerror = (error) => {
            widgetScriptLoading = false;
            const scriptElement = error.target as HTMLScriptElement;
            const failedUrl = scriptElement?.src || WIDGET_SCRIPT_URL;
            console.error('Failed to load CCBill widget script:', {
                error,
                url: failedUrl,
                message: 'The widget script URL may be incorrect. Please check CCBill documentation for the correct widget script URL.',
            });
            reject(new Error(`Failed to load CCBill widget script from ${failedUrl}. Please verify the script URL in CCBill documentation or contact CCBill support.`));
        };

        document.head.appendChild(script);
    });
}

/**
 * Initialize CCBill Advanced Widget.
 */
export async function initializeCCBillWidget(
    config: CCBillWidgetConfig,
): Promise<CCBillWidgetInstance> {
    await loadCCBillWidgetScript();

    // CCBill widget exposes as lowercase 'ccbill' (not 'CCBill')
    const ccbillWidget = window.ccbill || window.CCBill;

    console.log('Checking for CCBill widget:', {
        windowCcbill: !!window.ccbill,
        windowCCBill: !!window.CCBill,
        ccbillKeys: window.ccbill ? Object.keys(window.ccbill) : [],
        ccBillKeys: window.CCBill ? Object.keys(window.CCBill) : [],
        hasCCBillAdvancedWidget: !!ccbillWidget?.CCBillAdvancedWidget,
        config: { ...config, applicationId: config.applicationId ? '***' : undefined },
    });

    if (!ccbillWidget) {
        const ccbillKeys = Object.keys(window).filter(k => k.toLowerCase().includes('ccbill'));
        console.error('CCBill object not found on window. Available CCBill-related keys:', ccbillKeys);
        throw new Error('CCBill widget library not loaded. Please check the script URL.');
    }

    // CCBill uses CCBillAdvancedWidget (not AdvancedWidget)
    const AdvancedWidgetClass = (ccbillWidget as any).CCBillAdvancedWidget;

    if (!AdvancedWidgetClass) {
        console.error('CCBill.CCBillAdvancedWidget not found. Available CCBill keys:', Object.keys(ccbillWidget));
        throw new Error('CCBill Advanced Widget not available. Available keys: ' + Object.keys(ccbillWidget).join(', '));
    }

    try {
        // CCBill widget constructor: constructor(applicationId: string, customIds?: Object)
        // According to CCBill docs, the constructor takes applicationId as first parameter
        console.log('Initializing CCBill widget with applicationId length:', config.applicationId?.length || 0);
        console.log('CCBill applicationId first 8 chars:', config.applicationId?.substring(0, 8) || 'missing');
        
        const widget = new AdvancedWidgetClass(config.applicationId, {
            // customIds can be passed here if needed for field mapping
        });
        
        // Log widget internals for debugging
        console.log('CCBill widget created. Checking internal state...');
        console.log('Widget type:', typeof widget);
        console.log('Widget constructor name:', widget?.constructor?.name);
        
        // Check if widget has the methods we need
        const hasCreatePaymentToken3DS = typeof (widget as any).createPaymentToken3DS === 'function';
        const hasCreatePaymentToken = typeof (widget as any).createPaymentToken === 'function';
        console.log('Widget has createPaymentToken3DS:', hasCreatePaymentToken3DS);
        console.log('Widget has createPaymentToken:', hasCreatePaymentToken);
        
        return widget;
    } catch (error) {
        console.error('Error creating CCBill widget instance:', error);
        console.error('Config used:', { ...config, applicationId: config.applicationId ? '***' : undefined });
        throw error;
    }
}

/**
 * Collect browser/network information for CCBill fraud detection
 */
function collectBrowserInfo(): Record<string, string> {
    return {
        browserHttpUserAgent: navigator.userAgent,
        browserHttpAccept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        browserHttpAcceptEncoding: 'gzip, deflate, br',
        browserHttpAcceptLanguate: navigator.language || navigator.languages?.[0] || 'en-US', // Note: CCBill docs show typo "Languate"
    };
}

/**
 * Create a payment token with 3DS authentication.
 * Attempts 3DS first, falls back to non-3DS if not supported.
 * 
 * According to CCBill docs: https://ccbill.com/doc/method-reference
 * createPaymentToken3DS requires: authToken, clientAccnum, clientSubacc
 * The widget reads form data from DOM elements with data-ccbill attributes
 */
export async function createPaymentToken3DS(
    widget: CCBillWidgetInstance,
    authToken: string,
    clientAccnum: number,
    clientSubacc: number,
    options?: {
        form?: HTMLFormElement | string;
        amount?: number;
        currencyCode?: string;
        ipAddress?: string;
        threeDSRequestorURL?: string; // Return URL after 3DS authentication completes
        returnUrl?: string; // Alias for threeDSRequestorURL
        [key: string]: any;
    },
): Promise<{ tokenId: string; is3DS: boolean }> {
    // According to CCBill docs, createPaymentToken3DS requires:
    // createPaymentToken3DS(authToken, clientAccnum, clientSubacc, optionalParameters?)
    // The widget reads form data from DOM elements with data-ccbill attributes automatically
    const createTokenMethod = (widget as any).createPaymentToken3DS;

    if (!createTokenMethod || typeof createTokenMethod !== 'function') {
        console.error('CCBill widget does not have createPaymentToken3DS method');
        throw new Error('CCBill widget does not have createPaymentToken3DS method');
    }

    // Build optional parameters object (define outside try block so it's accessible in catch)
    // NOTE: According to CCBill docs, the widget reads form fields from DOM automatically
    // We should NOT pass the form element in optionalParams - it's not a valid parameter
    const optionalParams: any = {};
    
    // Only pass valid optional parameters as per CCBill documentation
    if (options?.timeToLive !== undefined) {
        optionalParams.timeToLive = options.timeToLive;
    }
    if (options?.numberOfUse !== undefined) {
        optionalParams.numberOfUse = options.numberOfUse;
    }
    if (options?.clearPaymentInfo !== undefined) {
        optionalParams.clearPaymentInfo = options.clearPaymentInfo;
    }
    if (options?.clearCustomerInfo !== undefined) {
        optionalParams.clearCustomerInfo = options.clearCustomerInfo;
    }

    try {
        // Verify required form fields are present in DOM
        const requiredFields = ['firstName', 'lastName', 'email', 'cardNumber', 'expMonth', 'expYear', 'cvv2', 'nameOnCard', 'postalCode', 'country'];
        const missingFields: string[] = [];
        const fieldValues: Record<string, string> = {};
        
        requiredFields.forEach((fieldName) => {
            const element = document.querySelector(`[data-ccbill="${fieldName}"]`) as HTMLInputElement | HTMLSelectElement;
            if (!element) {
                missingFields.push(fieldName);
            } else {
                // Trim whitespace from field values
                let value = element.value?.trim() || '';
                
                // Special handling for specific fields
                if (fieldName === 'cardNumber') {
                    // Remove ALL spaces from card number
                    value = value.replace(/\s/g, '');
                } else if (fieldName === 'postalCode') {
                    // Remove spaces from postal code and uppercase
                    value = value.replace(/\s/g, '').toUpperCase();
                } else if (fieldName === 'state') {
                    // Ensure state is 1-3 characters, prefer 2-letter code
                    value = value.toUpperCase();
                    if (value.length > 3) {
                        // Try to extract 2-letter code or truncate
                        const twoLetterMatch = value.match(/^[A-Z]{2}/);
                        value = twoLetterMatch ? twoLetterMatch[0] : value.substring(0, 3);
                    }
                } else if (fieldName === 'city') {
                    // Remove everything after first comma (city, state, country format)
                    const commaIndex = value.indexOf(',');
                    if (commaIndex > 0) {
                        value = value.substring(0, commaIndex).trim();
                    }
                    // Truncate to 50 characters (CCBill max)
                    if (value.length > 50) {
                        value = value.substring(0, 50);
                    }
                } else if (fieldName === 'expYear') {
                    // Ensure expYear is 4 digits (yyyy format) as required by CCBill
                    const yearNum = parseInt(value, 10);
                    if (!isNaN(yearNum)) {
                        // If it's a 2-digit year (0-99), convert to 4 digits
                        if (yearNum < 100) {
                            // Assume years 0-50 are 2000-2050, years 51-99 are 1951-1999
                            value = yearNum <= 50 ? String(2000 + yearNum) : String(1900 + yearNum);
                        } else {
                            // Already 4 digits, ensure it's a string
                            value = String(yearNum);
                        }
                    }
                    // Ensure it's exactly 4 digits
                    if (value.length !== 4) {
                        console.warn(`expYear should be 4 digits (yyyy), got: ${value}`);
                    }
                } else if (fieldName === 'expMonth') {
                    // Ensure expMonth is 2 digits (mm format) as required by CCBill
                    const monthNum = parseInt(value, 10);
                    if (!isNaN(monthNum)) {
                        value = String(monthNum).padStart(2, '0');
                    }
                }
                
                if (!value) {
                    missingFields.push(fieldName);
                } else {
                    // Update the element value to cleaned value
                    if (element.value !== value) {
                        element.value = value;
                    }
                    fieldValues[fieldName] = value;
                }
            }
        });
        
        // Validate state field if provided (must be 1-3 characters)
        const stateElement = document.querySelector(`[data-ccbill="state"]`) as HTMLInputElement;
        if (stateElement && stateElement.value.trim()) {
            const stateValue = stateElement.value.trim();
            if (stateValue.length < 1 || stateValue.length > 3) {
                throw new Error('State/Province must be 1-3 characters if provided');
            }
        }
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Note: According to CCBill docs, amount and currencyCode are NOT form fields for createPaymentToken3DS
        // They are only used when charging the token later via the /transactions endpoint
        // We'll keep them in the form for potential future use, but they won't be sent to createPaymentToken3DS
        const form = options?.form ? (typeof options.form === 'string' ? document.querySelector(options.form) : options.form) : document.querySelector('form');
        
        // Ensure threeDSRequestorURL is set (required for 3DS authentication)
        // This is the URL where CCBill should redirect after 3DS authentication completes
        // CCBill requires a valid HTTPS URL - for development, we may need to use a production URL
        let threeDSRequestorURLField = document.querySelector('[data-ccbill="threeDSRequestorURL"]') as HTMLInputElement;
        if (!threeDSRequestorURLField || !threeDSRequestorURLField.value) {
            if (form) {
                // Use the current page URL as the return URL, or a provided return URL
                let returnUrl = options?.threeDSRequestorURL || options?.returnUrl || window.location.href;
                
                // CCBill requires a valid HTTPS URL with a path
                // For .test domains or localhost, CCBill may reject them - you may need a production URL
                try {
                    const url = new URL(returnUrl);
                    
                    // Ensure it has a path (not just domain)
                    if (url.pathname === '/' || !url.pathname) {
                        returnUrl = url.origin + '/settings/payment-methods';
                    }
                    
                    // CCBill typically requires HTTPS for security
                    // For development, you may need to use a production/staging URL
                    if (url.protocol === 'http:' && (url.hostname.includes('.test') || url.hostname === 'localhost')) {
                        console.warn('⚠️ CCBill may reject HTTP .test domains for threeDSRequestorURL.');
                        console.warn('Consider using a production URL or contact CCBill support to whitelist your development domain.');
                        // Try HTTPS (may not work for .test domains)
                        returnUrl = returnUrl.replace('http://', 'https://');
                    }
                } catch (e) {
                    console.error('Invalid threeDSRequestorURL:', returnUrl, e);
                }
                
                threeDSRequestorURLField = document.createElement('input');
                threeDSRequestorURLField.type = 'hidden';
                threeDSRequestorURLField.setAttribute('data-ccbill', 'threeDSRequestorURL');
                threeDSRequestorURLField.value = returnUrl;
                form.appendChild(threeDSRequestorURLField);
                console.log('Set threeDSRequestorURL to:', returnUrl);
            }
        } else {
            // Validate existing threeDSRequestorURL
            const existingUrl = threeDSRequestorURLField.value;
            try {
                const url = new URL(existingUrl);
                if (url.protocol === 'http:' && (url.hostname.includes('.test') || url.hostname === 'localhost')) {
                    // Try to convert to HTTPS
                    const httpsUrl = existingUrl.replace('http://', 'https://');
                    threeDSRequestorURLField.value = httpsUrl;
                    console.warn('threeDSRequestorURL converted to HTTPS:', httpsUrl);
                }
            } catch (e) {
                console.error('Invalid threeDSRequestorURL format:', existingUrl, e);
            }
        }
        
        // Collect and set browser/network information as hidden fields
        // These help with fraud detection and risk assessment
        const browserInfo = collectBrowserInfo();
        
        // Skip localhost/loopback IPs as CCBill may reject them
        const ipAddress = options?.ipAddress || '';
        const isLocalIp = ['127.0.0.1', '::1', 'localhost'].includes(ipAddress);
        
        const browserFields = [
            { name: 'ipAddress', value: isLocalIp ? '' : ipAddress }, // Don't send localhost IP
            { name: 'browserHttpUserAgent', value: browserInfo.browserHttpUserAgent },
            { name: 'browserHttpAccept', value: browserInfo.browserHttpAccept },
            { name: 'browserHttpAcceptEncoding', value: browserInfo.browserHttpAcceptEncoding },
            { name: 'browserHttpAcceptLanguate', value: browserInfo.browserHttpAcceptLanguate }, // Note: CCBill docs show typo "Languate"
        ];
        
        if (form) {
            browserFields.forEach(({ name, value }) => {
                if (!value) return; // Skip empty values (like IP if not provided)
                
                let field = document.querySelector(`[data-ccbill="${name}"]`) as HTMLInputElement;
                if (!field) {
                    field = document.createElement('input');
                    field.type = 'hidden';
                    field.setAttribute('data-ccbill', name);
                    form.appendChild(field);
                }
                field.value = value;
            });
        }
        
        // Log all form field values before calling CCBill (for debugging)
        // Use the already collected fieldValues from validation above
        const formFields: Record<string, string> = {};
        Object.keys(fieldValues).forEach((fieldName) => {
            formFields[fieldName] = fieldName === 'cardNumber' || fieldName === 'cvv2' 
                ? '***' 
                : fieldValues[fieldName];
        });
        console.log('Form field values before submission (trimmed):', formFields);
        
        // Also log all data-ccbill fields from DOM to see what widget will read
        const allCcbillFields: Record<string, string> = {};
        const allCcbillFieldsDetailed: Record<string, { value: string; element: string; hasValue: boolean }> = {};
        document.querySelectorAll('[data-ccbill]').forEach((element) => {
            const fieldName = element.getAttribute('data-ccbill');
            if (fieldName) {
                const input = element as HTMLInputElement | HTMLSelectElement;
                const value = input.value || '';
                allCcbillFields[fieldName] = fieldName === 'cardNumber' || fieldName === 'cvv2'
                    ? (value ? '***' : '')
                    : value;
                allCcbillFieldsDetailed[fieldName] = {
                    value: fieldName === 'cardNumber' || fieldName === 'cvv2' ? (value ? '***' : '') : value,
                    element: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
                    hasValue: !!value,
                };
            }
        });
        console.log('All data-ccbill fields in DOM:', allCcbillFields);
        console.log('All data-ccbill fields detailed:', allCcbillFieldsDetailed);
        
        // Verify all required fields have values
        const requiredFieldsFor3DS = ['firstName', 'lastName', 'email', 'cardNumber', 'expMonth', 'expYear', 'cvv2', 'nameOnCard', 'postalCode', 'country'];
        const missingRequiredFields = requiredFieldsFor3DS.filter(fieldName => {
            const element = document.querySelector(`[data-ccbill="${fieldName}"]`) as HTMLInputElement | HTMLSelectElement;
            return !element || !element.value?.trim();
        });
        
        if (missingRequiredFields.length > 0) {
            console.error('Missing required fields for createPaymentToken3DS:', missingRequiredFields);
            console.error('Field details:', missingRequiredFields.map(fieldName => {
                const element = document.querySelector(`[data-ccbill="${fieldName}"]`) as HTMLInputElement | HTMLSelectElement;
                return {
                    fieldName,
                    found: !!element,
                    value: element?.value || '',
                    id: element?.id || 'no-id',
                    tagName: element?.tagName || 'not-found',
                };
            }));
            throw new Error(`Missing required fields: ${missingRequiredFields.join(', ')}. Please ensure all required fields are filled.`);
        }
        
        console.log('✓ All required fields have values');
        
        // Log what we're actually passing (form is just a reference, not sent to API)
        const logOptionalParams: any = { ...optionalParams };
        if (logOptionalParams.form) {
            // Replace form element with a string representation for logging
            if (logOptionalParams.form instanceof HTMLElement) {
                logOptionalParams.form = `HTMLFormElement#${logOptionalParams.form.id || 'no-id'}`;
            }
        }
        
        // Ensure clientAccnum and clientSubacc are numbers (CCBill requires this)
        const numClientAccnum = typeof clientAccnum === 'string' ? parseInt(clientAccnum, 10) : clientAccnum;
        const numClientSubacc = typeof clientSubacc === 'string' ? parseInt(clientSubacc, 10) : clientSubacc;
        
        console.log('Calling createPaymentToken3DS with:', {
            authToken: authToken ? '***' : 'missing',
            clientAccnum: numClientAccnum,
            clientAccnumType: typeof numClientAccnum,
            clientSubacc: numClientSubacc,
            clientSubaccType: typeof numClientSubacc,
            optionalParams: logOptionalParams,
        });
        
        console.log('Note: The widget reads form fields from DOM elements with data-ccbill attributes.');
        
        // Call createPaymentToken3DS with required parameters
        // Widget reads form data from DOM automatically
        // Pass undefined for optionalParams if empty (don't pass empty object)
        const result = await createTokenMethod.call(
            widget, 
            authToken, 
            numClientAccnum, 
            numClientSubacc, 
            Object.keys(optionalParams).length > 0 ? optionalParams : undefined
        );
        
        // Handle response structure - CCBill returns paymentTokenId in response
        // For 3DS, response might have threedsInformation and paymentToken
        const tokenId = result?.paymentToken?.paymentTokenId || result?.paymentTokenId || result?.tokenId || result?.token;
        
        if (!tokenId || typeof tokenId !== 'string') {
            console.error('Unexpected token response:', result);
            throw new Error('Invalid token response from CCBill widget');
        }

        return { tokenId, is3DS: true };
    } catch (error: any) {
        console.error('Error creating payment token with 3DS:', error);
        
        // Log full error structure for debugging
        console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
            error: error?.error,
            response: error?.response,
            status: error?.status,
            statusText: error?.statusText,
        });
        
        // Log the full error object structure
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        // Check if error has a response with status
        if (error?.response) {
            console.error('Error response object:', {
                status: error.response.status,
                statusText: error.response.statusText,
                url: error.response.url,
                type: error.response.type,
                ok: error.response.ok,
                headers: error.response.headers ? Object.fromEntries(error.response.headers.entries()) : null,
            });
        }
        
        // Try to extract error message from CCBill API response
        let ccbillErrorMessage = '';
        let ccbillErrorCode = '';
        let ccbillErrorDetails: any = null;
        
        // Check if error has a response object (from fetch)
        if (error?.response) {
            try {
                const responseData = await error.response.json().catch(() => ({}));
                ccbillErrorMessage = responseData?.error?.message || responseData?.message || '';
                ccbillErrorCode = responseData?.error?.code || responseData?.code || '';
                ccbillErrorDetails = responseData;
                console.error('CCBill API error response:', responseData);
            } catch (e) {
                // Response might not be JSON or already consumed
                try {
                    const responseText = await error.response.text().catch(() => '');
                    console.error('CCBill API error response (text):', responseText);
                    ccbillErrorMessage = responseText || error.response.statusText || '';
                } catch (e2) {
                    // Response might be already consumed, try cloning
                    try {
                        const clonedResponse = error.response.clone();
                        const responseData = await clonedResponse.json().catch(() => ({}));
                        ccbillErrorMessage = responseData?.error?.message || responseData?.message || '';
                        ccbillErrorCode = responseData?.error?.code || responseData?.code || '';
                        ccbillErrorDetails = responseData;
                    } catch (e3) {
                        ccbillErrorMessage = error.response.statusText || `HTTP ${error.response.status}`;
                    }
                }
            }
        }
        
        // Check nested error object
        if (!ccbillErrorMessage && error?.error) {
            const nestedError = error.error;
            if (nestedError?.response) {
                try {
                    const responseData = await nestedError.response.json().catch(() => ({}));
                    ccbillErrorMessage = responseData?.error?.message || responseData?.message || '';
                    ccbillErrorCode = responseData?.error?.code || responseData?.code || '';
                    ccbillErrorDetails = responseData;
                    console.error('CCBill API error response (nested):', responseData);
                } catch (e) {
                    try {
                        const responseText = await nestedError.response.text().catch(() => '');
                        console.error('CCBill API error response (nested text):', responseText);
                        ccbillErrorMessage = responseText || nestedError.response.statusText || '';
                    } catch (e2) {
                        try {
                            const clonedResponse = nestedError.response.clone();
                            const responseData = await clonedResponse.json().catch(() => ({}));
                            ccbillErrorMessage = responseData?.error?.message || responseData?.message || '';
                            ccbillErrorCode = responseData?.error?.code || responseData?.code || '';
                            ccbillErrorDetails = responseData;
                        } catch (e3) {
                            ccbillErrorMessage = nestedError.response.statusText || `HTTP ${nestedError.response.status}`;
                        }
                    }
                }
            } else if (nestedError?.message) {
                // Error might have message directly
                ccbillErrorMessage = nestedError.message;
            }
        }
        
        // Check if error message is directly on error
        if (!ccbillErrorMessage && error?.message) {
            ccbillErrorMessage = error.message;
        }
        
        // Check if error has status directly (not via response)
        if (!ccbillErrorMessage && error?.status === 400) {
            // Try to get more info from the error object itself
            if (error?.body) {
                try {
                    const bodyData = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
                    ccbillErrorMessage = bodyData?.error?.message || bodyData?.message || '';
                    ccbillErrorCode = bodyData?.error?.code || bodyData?.code || '';
                    ccbillErrorDetails = bodyData;
                    console.error('CCBill API error from error.body:', bodyData);
                } catch (e) {
                    // body might not be JSON
                    console.error('CCBill API error body (raw):', error.body);
                }
            }
            
            // Check for error details in various possible locations
            if (!ccbillErrorMessage) {
                const possibleErrorPaths = [
                    error?.data?.error?.message,
                    error?.data?.message,
                    error?.details?.error?.message,
                    error?.details?.message,
                    error?.error?.data?.error?.message,
                    error?.error?.data?.message,
                ];
                
                for (const possibleMessage of possibleErrorPaths) {
                    if (possibleMessage) {
                        ccbillErrorMessage = possibleMessage;
                        break;
                    }
                }
            }
            
            // If still no message, provide generic 400 error with instructions
            if (!ccbillErrorMessage) {
                ccbillErrorMessage = 'Bad Request (400). Please check the Network tab in your browser DevTools (F12 → Network → find the failed request to api.ccbill.com → click it → check the Response tab) to see the detailed error response from CCBill.';
            }
        }
        
        // Build user-friendly error message
        if (ccbillErrorMessage) {
            const userError = new Error(
                `CCBill API Error: ${ccbillErrorMessage}${ccbillErrorCode ? ` (Code: ${ccbillErrorCode})` : ''}`
            );
            (userError as any).ccbillError = true;
            (userError as any).ccbillErrorCode = ccbillErrorCode;
            (userError as any).ccbillErrorDetails = ccbillErrorDetails;
            (userError as any).originalError = error;
            throw userError;
        } else if (error?.status === 400) {
            // 400 Bad Request but no error message extracted
            const userError = new Error(
                'CCBill API Error: Bad Request (400). Please check that all required fields are filled correctly.'
            );
            (userError as any).ccbillError = true;
            (userError as any).ccbillErrorCode = 'BAD_REQUEST';
            (userError as any).originalError = error;
            throw userError;
        }
        
        // Check for CORS errors - CCBill blocks requests from development domains
        const errorMessage = error?.message || '';
        const errorStack = error?.stack || '';
        const errorName = error?.name || '';
        const errorError = (error as any)?.error;
        const errorErrorMessage = errorError?.message || '';
        const errorErrorStack = errorError?.stack || '';
        
        const isCorsError = 
            errorMessage.includes('CORS') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('Access-Control-Allow-Origin') ||
            errorStack.includes('CORS') ||
            errorStack.includes('Failed to fetch') ||
            (errorName === 'TypeError' && (errorMessage.includes('fetch') || errorMessage.includes('Failed'))) ||
            errorErrorMessage.includes('CORS') ||
            errorErrorMessage.includes('Failed to fetch') ||
            errorErrorStack.includes('CORS') ||
            errorErrorStack.includes('Failed to fetch') ||
            (errorError?.name === 'TypeError' && errorErrorMessage.includes('fetch'));
        
        if (isCorsError) {
            const hostname = window.location.hostname;
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
            const isTestDomain = hostname.endsWith('.test') || hostname.endsWith('.local');
            
            if (isLocalhost || isTestDomain) {
                const corsError = new Error(
                    'CORS Error: CCBill API does not allow requests from development domains (localhost or .test domains).\n\n' +
                    'Solutions:\n' +
                    '1. Contact CCBill support to whitelist your development domain: ' + window.location.origin + '\n' +
                    '2. Deploy to a production/staging domain for testing (recommended)\n' +
                    '3. Use a real domain instead of .test (e.g., dev.realkinkmen.com)\n\n' +
                    'Note: CCBill requires production domains for security. Development domains must be explicitly whitelisted.'
                );
                (corsError as any).isCorsError = true;
                (corsError as any).isLocalhost = isLocalhost || isTestDomain;
                throw corsError;
            } else {
                const corsError = new Error(
                    'CORS Error: CCBill API is blocking requests from this origin. ' +
                    'Please contact CCBill support to whitelist your domain: ' + window.location.origin
                );
                (corsError as any).isCorsError = true;
                throw corsError;
            }
        }
        
        // If 3DS not supported, try non-3DS method
        // createPaymentToken also requires authToken, clientAccnum, clientSubacc
        // According to CCBill docs, it can accept optional parameters object like createPaymentToken3DS
        const non3DSMethod = (widget as any).createPaymentToken;
        
        if (non3DSMethod && typeof non3DSMethod === 'function') {
            try {
                console.log('Attempting fallback to createPaymentToken (non-3DS)');
                
                // Ensure clientAccnum and clientSubacc are numbers
                const numClientAccnum = typeof clientAccnum === 'string' ? parseInt(clientAccnum, 10) : clientAccnum;
                const numClientSubacc = typeof clientSubacc === 'string' ? parseInt(clientSubacc, 10) : clientSubacc;
                
                // Try with optional parameters object first (newer API)
                // createPaymentToken(authToken, clientAccnum, clientSubacc, optionalParameters?)
                let result;
                if (Object.keys(optionalParams).length > 0) {
                    result = await non3DSMethod.call(widget, authToken, numClientAccnum, numClientSubacc, optionalParams);
                } else {
                    // Fallback to old signature if needed
                    // createPaymentToken(authToken, clientAccnum, clientSubacc, clearPaymentInfo?, clearCustomerInfo?, timeToLive?, numberOfUse?)
                    result = await non3DSMethod.call(widget, authToken, numClientAccnum, numClientSubacc);
                }
                
                console.log('createPaymentToken (non-3DS) raw response:', result);
                console.log('Response type:', typeof result);
                console.log('Response constructor:', result?.constructor?.name);
                
                // Handle if result is a Response object (needs to be parsed)
                let parsedResult = result;
                if (result instanceof Response) {
                    console.log('Response is a fetch Response object, parsing JSON...');
                    parsedResult = await result.json();
                    console.log('Parsed response:', parsedResult);
                }
                
                const tokenId = parsedResult?.paymentTokenId || parsedResult?.tokenId || parsedResult?.token;
                
                if (tokenId && typeof tokenId === 'string') {
                    console.log('✓ Successfully created payment token (non-3DS):', tokenId);
                    return { tokenId, is3DS: false };
                } else {
                    console.error('Unexpected non-3DS token response:', parsedResult);
                    console.error('Available keys:', Object.keys(parsedResult || {}));
                    throw new Error('Invalid token response from CCBill widget (non-3DS)');
                }
            } catch (fallbackError: any) {
                console.error('Fallback to non-3DS also failed:', fallbackError);
                console.error('Fallback error details:', {
                    message: fallbackError?.message,
                    stack: fallbackError?.stack,
                    name: fallbackError?.name,
                    response: fallbackError?.response,
                    status: fallbackError?.status,
                    statusText: fallbackError?.statusText,
                    error: fallbackError?.error,
                });
                
                // Log full error structure for encryption errors
                if (fallbackError?.errorCode === 'BE-123' || fallbackError?.message?.includes('Encryption')) {
                    console.error('⚠️ Encryption Error (BE-123) - This usually means:');
                    console.error('1. The frontend bearer token is invalid or expired');
                    console.error('2. The widget was not initialized with the correct applicationId');
                    console.error('3. The widget cannot encrypt the payment data');
                    console.error('Full error object:', JSON.stringify(fallbackError, Object.getOwnPropertyNames(fallbackError), 2));
                }
                
                // Try to extract error message from CCBill API response
                let fallbackCcbillErrorMessage = '';
                let fallbackCcbillErrorCode = '';
                let fallbackCcbillErrorDetails: any = null;
                
                if (fallbackError?.response) {
                    try {
                        const responseData = await fallbackError.response.json().catch(() => ({}));
                        fallbackCcbillErrorMessage = responseData?.error?.message || responseData?.message || '';
                        fallbackCcbillErrorCode = responseData?.error?.code || responseData?.code || '';
                        fallbackCcbillErrorDetails = responseData;
                        console.error('CCBill API fallback error response:', responseData);
                    } catch (e) {
                        try {
                            const responseText = await fallbackError.response.text().catch(() => '');
                            console.error('CCBill API fallback error response (text):', responseText);
                            fallbackCcbillErrorMessage = responseText || fallbackError.response.statusText || '';
                        } catch (e2) {
                            try {
                                const clonedResponse = fallbackError.response.clone();
                                const responseData = await clonedResponse.json().catch(() => ({}));
                                fallbackCcbillErrorMessage = responseData?.error?.message || responseData?.message || '';
                                fallbackCcbillErrorCode = responseData?.error?.code || responseData?.code || '';
                                fallbackCcbillErrorDetails = responseData;
                            } catch (e3) {
                                fallbackCcbillErrorMessage = fallbackError.response.statusText || `HTTP ${fallbackError.response.status}`;
                            }
                        }
                    }
                } else if (fallbackError?.status === 400) {
                    fallbackCcbillErrorMessage = 'Bad Request (400). Please check that all required fields are filled correctly.';
                    fallbackCcbillErrorCode = 'BAD_REQUEST';
                }
                
                // If we got a CCBill error message, throw it
                if (fallbackCcbillErrorMessage) {
                    const userError = new Error(
                        `CCBill API Error: ${fallbackCcbillErrorMessage}${fallbackCcbillErrorCode ? ` (Code: ${fallbackCcbillErrorCode})` : ''}`
                    );
                    (userError as any).ccbillError = true;
                    (userError as any).ccbillErrorCode = fallbackCcbillErrorCode;
                    (userError as any).ccbillErrorDetails = fallbackCcbillErrorDetails;
                    (userError as any).originalError = fallbackError;
                    throw userError;
                }
                
                // Check if fallback also has CORS error
                const fallbackErrorMessage = fallbackError?.message || '';
                const fallbackErrorStack = fallbackError?.stack || '';
                const fallbackErrorName = fallbackError?.name || '';
                const fallbackErrorError = (fallbackError as any)?.error;
                const fallbackErrorErrorMessage = fallbackErrorError?.message || '';
                const fallbackErrorErrorStack = fallbackErrorError?.stack || '';
                
                const isFallbackCorsError = 
                    fallbackErrorMessage.includes('CORS') ||
                    fallbackErrorMessage.includes('Failed to fetch') ||
                    fallbackErrorMessage.includes('Access-Control-Allow-Origin') ||
                    fallbackErrorStack.includes('CORS') ||
                    fallbackErrorStack.includes('Failed to fetch') ||
                    (fallbackErrorName === 'TypeError' && (fallbackErrorMessage.includes('fetch') || fallbackErrorMessage.includes('Failed'))) ||
                    fallbackErrorErrorMessage.includes('CORS') ||
                    fallbackErrorErrorMessage.includes('Failed to fetch') ||
                    fallbackErrorErrorStack.includes('CORS') ||
                    fallbackErrorErrorStack.includes('Failed to fetch') ||
                    (fallbackErrorError?.name === 'TypeError' && fallbackErrorErrorMessage.includes('fetch'));
                
                if (isFallbackCorsError) {
                    const hostname = window.location.hostname;
                    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
                    const isTestDomain = hostname.endsWith('.test') || hostname.endsWith('.local');
                    
                    if (isLocalhost || isTestDomain) {
                        const corsError = new Error(
                            'CORS Error: CCBill API does not allow requests from development domains (localhost or .test domains).\n\n' +
                            'Solutions:\n' +
                            '1. Contact CCBill support to whitelist your development domain: ' + window.location.origin + '\n' +
                            '2. Deploy to a production/staging domain for testing (recommended)\n' +
                            '3. Use a real domain instead of .test (e.g., dev.realkinkmen.com)\n\n' +
                            'Note: CCBill requires production domains for security. Development domains must be explicitly whitelisted.'
                        );
                        (corsError as any).isCorsError = true;
                        (corsError as any).isLocalhost = isLocalhost || isTestDomain;
                        throw corsError;
                    }
                }
            }
        }

        // If 3DS failed (user failed auth), throw error
        if (error?.message?.includes('3DS') || error?.message?.includes('authentication failed')) {
            throw new Error('3DS authentication failed. Card cannot be vaulted.');
        }

        // Re-throw other errors
        throw error;
    }
}

/**
 * Create a payment token without 3DS (fallback).
 */
export async function createPaymentToken(
    widget: CCBillWidgetInstance,
): Promise<string> {
    return widget.createToken({ use3DS: false });
}

