import { getCsrfToken } from '@/lib/csrf';

export type PaymentMethod = {
    id: number;
    uuid: string;
    provider: string;
    type: string;
    brand: string;
    last_four: string;
    exp_month: string;
    exp_year: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
};

export type FrontendTokenResponse = {
    token: string;
    gateway: string;
    application_id?: string;
};

export type VaultPaymentMethodPayload = {
    provider_token_id: string;
    gateway?: string;
    is_default?: boolean;
    billing_address?: Record<string, unknown>;
    // Card details - required for CCBill since their API doesn't return card info
    card_last_four?: string;
    card_brand?: string;
    card_exp_month?: string;
    card_exp_year?: string;
};

export class PaymentMethodClientError extends Error {
    public readonly status: number;

    public readonly payload: unknown;

    public constructor(message: string, status: number, payload: unknown) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

function buildHeaders(
    additional: Record<string, string> = {},
): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...additional,
    };

    if (!headers['X-XSRF-TOKEN']) {
        const csrfToken = getCsrfToken();

        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }
    }

    return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let problem: unknown = null;

        try {
            problem = await response.json();
        } catch {
            problem = await response.text();
        }

        const message =
            (typeof problem === 'object' &&
            problem !== null &&
            'message' in problem &&
            typeof (problem as { message: unknown }).message === 'string'
                ? (problem as { message: string }).message
                : undefined) ??
            (typeof problem === 'object' &&
            problem !== null &&
            'error' in problem &&
            typeof (problem as { error: unknown }).error === 'string'
                ? (problem as { error: string }).error
                : undefined) ??
            `Request failed with status ${response.status}`;

        throw new PaymentMethodClientError(message, response.status, problem);
    }

    return (await response.json()) as T;
}

/**
 * Get frontend bearer token for CCBill widget.
 */
export async function getFrontendToken(
    gateway: string = 'ccbill',
    options: { signal?: AbortSignal } = {},
): Promise<FrontendTokenResponse> {
    const url = `/api/payment-methods/frontend-token?gateway=${encodeURIComponent(gateway)}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(),
        credentials: 'include',
        signal: options.signal,
    });

    return parseResponse<FrontendTokenResponse>(response);
}

/**
 * List user's payment methods.
 */
export async function listPaymentMethods(
    options: { signal?: AbortSignal } = {},
): Promise<PaymentMethod[]> {
    const response = await fetch('/api/payment-methods', {
        method: 'GET',
        headers: buildHeaders(),
        credentials: 'include',
        signal: options.signal,
    });

    return parseResponse<PaymentMethod[]>(response);
}

/**
 * Vault a payment token (after widget creates it).
 */
export async function vaultPaymentMethod(
    payload: VaultPaymentMethodPayload,
    options: { signal?: AbortSignal } = {},
): Promise<PaymentMethod> {
    console.log(
        '📤 vaultPaymentMethod: Sending POST to /api/payment-methods',
        payload,
    );

    const headers = buildHeaders();
    console.log('📤 vaultPaymentMethod: Headers:', headers);
    console.log('📤 vaultPaymentMethod: Body:', JSON.stringify(payload));

    try {
        const response = await fetch('/api/payment-methods', {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify(payload),
            signal: options.signal,
        });

        console.log(
            '📥 vaultPaymentMethod: Response received, status:',
            response.status,
        );

        const result = await parseResponse<PaymentMethod>(response);
        console.log('✅ vaultPaymentMethod: Parsed result:', result);
        return result;
    } catch (err) {
        console.error('❌ vaultPaymentMethod: fetch() threw an error:', err);
        throw err;
    }
}

/**
 * Delete a payment method.
 */
export async function deletePaymentMethod(
    paymentMethodId: number,
    options: { signal?: AbortSignal } = {},
): Promise<void> {
    const response = await fetch(`/api/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: buildHeaders(),
        credentials: 'include',
        signal: options.signal,
    });

    if (!response.ok) {
        await parseResponse<unknown>(response);
    }
}

/**
 * Set a payment method as default.
 */
export async function setDefaultPaymentMethod(
    paymentMethodId: number,
    options: { signal?: AbortSignal } = {},
): Promise<PaymentMethod> {
    const response = await fetch(
        `/api/payment-methods/${paymentMethodId}/set-default`,
        {
            method: 'POST',
            headers: buildHeaders(),
            credentials: 'include',
            signal: options.signal,
        },
    );

    return parseResponse<PaymentMethod>(response);
}
