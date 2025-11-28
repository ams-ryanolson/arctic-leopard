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
    bearerToken: string;
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
        config: { ...config, bearerToken: config.bearerToken ? '***' : undefined },
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
        const widget = new AdvancedWidgetClass(config);
        console.log('CCBill widget initialized successfully', widget);
        return widget;
    } catch (error) {
        console.error('Error creating CCBill widget instance:', error);
        console.error('Config used:', { ...config, bearerToken: '***' });
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

    try {
        // Verify required form fields are present in DOM
        const requiredFields = ['firstName', 'lastName', 'email', 'cardNumber', 'expMonth', 'expYear', 'cvv2', 'nameOnCard', 'postalCode', 'country'];
        const missingFields: string[] = [];
        
        requiredFields.forEach((fieldName) => {
            const element = document.querySelector(`[data-ccbill="${fieldName}"]`) as HTMLInputElement | HTMLSelectElement;
            if (!element || !element.value?.trim()) {
                missingFields.push(fieldName);
            }
        });
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Ensure amount and currencyCode are set (required even for vaulting)
        let amountField = document.querySelector('[data-ccbill="amount"]') as HTMLInputElement;
        let currencyField = document.querySelector('[data-ccbill="currencyCode"]') as HTMLInputElement;
        
        if (!amountField || !amountField.value) {
            const form = options?.form ? (typeof options.form === 'string' ? document.querySelector(options.form) : options.form) : document.querySelector('form');
            if (form) {
                amountField = document.createElement('input');
                amountField.type = 'hidden';
                amountField.setAttribute('data-ccbill', 'amount');
                amountField.value = options?.amount ? String(options.amount) : '100';
                form.appendChild(amountField);
            }
        }
        
        if (!currencyField || !currencyField.value) {
            const form = options?.form ? (typeof options.form === 'string' ? document.querySelector(options.form) : options.form) : document.querySelector('form');
            if (form) {
                currencyField = document.createElement('input');
                currencyField.type = 'hidden';
                currencyField.setAttribute('data-ccbill', 'currencyCode');
                currencyField.value = options?.currencyCode || 'USD';
                form.appendChild(currencyField);
            }
        }
        
        // Collect and set browser/network information as hidden fields
        // These help with fraud detection and risk assessment
        const browserInfo = collectBrowserInfo();
        const browserFields = [
            { name: 'ipAddress', value: options?.ipAddress || '' },
            { name: 'browserHttpUserAgent', value: browserInfo.browserHttpUserAgent },
            { name: 'browserHttpAccept', value: browserInfo.browserHttpAccept },
            { name: 'browserHttpAcceptEncoding', value: browserInfo.browserHttpAcceptEncoding },
            { name: 'browserHttpAcceptLanguate', value: browserInfo.browserHttpAcceptLanguate }, // Note: CCBill docs show typo "Languate"
        ];
        
        const form = options?.form ? (typeof options.form === 'string' ? document.querySelector(options.form) : options.form) : document.querySelector('form');
        
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
        
        // Build optional parameters object
        const optionalParams: any = {};
        if (options?.form) {
            optionalParams.form = options.form;
        }
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
        
        console.log('Calling createPaymentToken3DS with:', {
            authToken: authToken ? '***' : 'missing',
            clientAccnum,
            clientSubacc,
            optionalParams,
        });
        
        // Call createPaymentToken3DS with required parameters
        // Widget reads form data from DOM automatically
        const result = await createTokenMethod.call(widget, authToken, clientAccnum, clientSubacc, Object.keys(optionalParams).length > 0 ? optionalParams : undefined);
        
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
        console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
        });
        
        // If 3DS not supported, try non-3DS method
        // createPaymentToken also requires authToken, clientAccnum, clientSubacc
        const non3DSMethod = (widget as any).createPaymentToken;
        
        if (non3DSMethod && typeof non3DSMethod === 'function') {
            try {
                // createPaymentToken(authToken, clientAccnum, clientSubacc, clearPaymentInfo?, clearCustomerInfo?, timeToLive?, numberOfUse?)
                const result = await non3DSMethod.call(widget, authToken, clientAccnum, clientSubacc);
                
                const tokenId = result?.paymentTokenId || result?.tokenId || result?.token;
                
                if (tokenId && typeof tokenId === 'string') {
                    return { tokenId, is3DS: false };
                }
            } catch (fallbackError: any) {
                console.error('Fallback to non-3DS also failed:', fallbackError);
                console.error('Fallback error details:', {
                    message: fallbackError?.message,
                    stack: fallbackError?.stack,
                    name: fallbackError?.name,
                });
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

