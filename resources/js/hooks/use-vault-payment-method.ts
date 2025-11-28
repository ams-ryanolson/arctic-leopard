import {
    vaultPaymentMethod,
    type PaymentMethod,
    type VaultPaymentMethodPayload,
} from '@/lib/payment-method-client';
import { useCallback, useState } from 'react';

type UseVaultPaymentMethodResult = {
    vaulting: boolean;
    error: string | null;
    vault: (payload: VaultPaymentMethodPayload) => Promise<PaymentMethod>;
};

export function useVaultPaymentMethod(): UseVaultPaymentMethodResult {
    const [vaulting, setVaulting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const vault = useCallback(async (payload: VaultPaymentMethodPayload) => {
        setVaulting(true);
        setError(null);

        try {
            const paymentMethod = await vaultPaymentMethod(payload);
            return paymentMethod;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to vault payment method';
            setError(errorMessage);
            throw err;
        } finally {
            setVaulting(false);
        }
    }, []);

    return {
        vaulting,
        error,
        vault,
    };
}



