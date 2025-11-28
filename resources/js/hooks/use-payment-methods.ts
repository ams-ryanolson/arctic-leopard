import {
    deletePaymentMethod,
    listPaymentMethods,
    setDefaultPaymentMethod,
    type PaymentMethod,
} from '@/lib/payment-method-client';
import { useCallback, useEffect, useState } from 'react';

type UsePaymentMethodsResult = {
    paymentMethods: PaymentMethod[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    deleteMethod: (id: number) => Promise<void>;
    setDefault: (id: number) => Promise<void>;
};

export function usePaymentMethods(): UsePaymentMethodsResult {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPaymentMethods = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const methods = await listPaymentMethods();
            setPaymentMethods(methods);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load payment methods';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDelete = useCallback(
        async (id: number) => {
            try {
                await deletePaymentMethod(id);
                await fetchPaymentMethods();
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete payment method';
                setError(errorMessage);
                throw err;
            }
        },
        [fetchPaymentMethods],
    );

    const handleSetDefault = useCallback(
        async (id: number) => {
            try {
                await setDefaultPaymentMethod(id);
                await fetchPaymentMethods();
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to set default payment method';
                setError(errorMessage);
                throw err;
            }
        },
        [fetchPaymentMethods],
    );

    useEffect(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);

    return {
        paymentMethods,
        loading,
        error,
        refresh: fetchPaymentMethods,
        deleteMethod: handleDelete,
        setDefault: handleSetDefault,
    };
}



