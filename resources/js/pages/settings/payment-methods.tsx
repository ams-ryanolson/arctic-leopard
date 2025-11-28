import { CCBillCardForm } from '@/components/payments/CCBillCardForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useVaultPaymentMethod } from '@/hooks/use-vault-payment-method';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Head } from '@inertiajs/react';
import { CreditCard, Loader2, Plus, Trash2, Shield } from 'lucide-react';
import { useState } from 'react';

type PaymentMethodsPageProps = {
    ccbill_client_accnum?: number;
    ccbill_client_subacc?: number;
    user?: {
        email?: string;
        name?: string;
        location_city?: string | null;
        location_region?: string | null;
        location_country?: string | null;
    };
};

function formatCardBrand(brand: string): string {
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

function formatExpiry(expMonth: string, expYear: string): string {
    const month = expMonth.padStart(2, '0');
    const year = expYear.slice(-2);
    return `${month}/${year}`;
}

export default function PaymentMethods({
    ccbill_client_accnum = 0,
    ccbill_client_subacc = 0,
    user,
}: PaymentMethodsPageProps) {
    const { paymentMethods, loading, error, deleteMethod, setDefault, refresh } =
        usePaymentMethods();
    const { vault } = useVaultPaymentMethod();
    const [showAddForm, setShowAddForm] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this payment method?')) {
            return;
        }

        setDeletingId(id);
        try {
            await deleteMethod(id);
        } catch (err) {
            console.error('Failed to delete payment method:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (id: number) => {
        setSettingDefaultId(id);
        try {
            await setDefault(id);
        } catch (err) {
            console.error('Failed to set default payment method:', err);
        } finally {
            setSettingDefaultId(null);
        }
    };

    const handleTokenCreated = async (tokenId: string, is3DS: boolean) => {
        try {
            await vault({
                provider_token_id: tokenId,
                gateway: 'ccbill',
                is_default: paymentMethods.length === 0,
            });
            setShowAddForm(false);
            await refresh();
        } catch (err) {
            console.error('Failed to vault payment method:', err);
        }
    };

    return (
        <AppLayout>
            <Head title="Payment Methods" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Payment Methods</h1>
                        <p className="text-sm text-white/60">
                            Manage your saved payment methods for faster checkout
                        </p>
                    </div>

                    {error && (
                        <Card className="border-red-500/50 bg-red-500/10">
                            <CardContent className="pt-6">
                                <p className="text-sm text-red-400">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-6 animate-spin text-white/60" />
                        </div>
                    )}

                    {!loading && !showAddForm && (
                        <>
                            {paymentMethods.length === 0 ? (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <CreditCard className="mb-4 size-12 text-white/40" />
                                            <h3 className="mb-2 text-lg font-semibold">
                                                No payment methods
                                            </h3>
                                            <p className="mb-6 text-sm text-white/60">
                                                Add a payment method to get started
                                            </p>
                                            <Button onClick={() => setShowAddForm(true)}>
                                                <Plus className="size-4" />
                                                Add Payment Method
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {paymentMethods.map((method) => (
                                        <Card key={method.id}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <CreditCard className="size-8 text-white/60" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    {formatCardBrand(method.brand)} ••••{' '}
                                                                    {method.last_four}
                                                                </span>
                                                                {method.is_default && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Default
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-white/60">
                                                                Expires{' '}
                                                                {formatExpiry(
                                                                    method.exp_month,
                                                                    method.exp_year,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!method.is_default && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleSetDefault(method.id)
                                                                }
                                                                disabled={
                                                                    settingDefaultId === method.id
                                                                }
                                                            >
                                                                {settingDefaultId === method.id ? (
                                                                    <Loader2 className="size-4 animate-spin" />
                                                                ) : (
                                                                    'Set Default'
                                                                )}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(method.id)}
                                                            disabled={deletingId === method.id}
                                                        >
                                                            {deletingId === method.id ? (
                                                                <Loader2 className="size-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="size-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Card>
                                        <CardContent className="pt-6">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowAddForm(true)}
                                                className="w-full"
                                            >
                                                <Plus className="size-4" />
                                                Add New Payment Method
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}

                    {showAddForm && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Payment Method</CardTitle>
                                <CardDescription>
                                    Your card information is securely processed by CCBill. We never
                                    store your full card details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {ccbill_client_accnum && ccbill_client_subacc ? (
                                    <CCBillCardForm
                                        clientAccnum={ccbill_client_accnum}
                                        clientSubacc={ccbill_client_subacc}
                                        onTokenCreated={handleTokenCreated}
                                        onCancel={() => setShowAddForm(false)}
                                        gateway="ccbill"
                                        user={user}
                                    />
                                ) : (
                                    <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                                        <p className="text-sm text-yellow-400">
                                            CCBill configuration is missing. Please contact support.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

