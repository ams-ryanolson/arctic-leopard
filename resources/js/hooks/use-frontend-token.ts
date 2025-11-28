import { getFrontendToken, type FrontendTokenResponse } from '@/lib/payment-method-client';
import { useCallback, useState } from 'react';

type UseFrontendTokenResult = {
    token: string | null;
    loading: boolean;
    error: string | null;
    fetchToken: (gateway?: string) => Promise<string>;
};

export function useFrontendToken(): UseFrontendTokenResult {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchToken = useCallback(async (gateway: string = 'ccbill') => {
        setLoading(true);
        setError(null);

        try {
            const response: FrontendTokenResponse = await getFrontendToken(gateway);
            setToken(response.token);
            return response.token;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to generate frontend token';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        token,
        loading,
        error,
        fetchToken,
    };
}



