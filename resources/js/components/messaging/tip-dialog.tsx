import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';

type PaymentMethod = {
    id: string;
    label: string;
    detail: string;
};

type TipDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (
        amount: number,
        mode: 'send' | 'request',
        paymentMethod?: string,
    ) => Promise<void>;
    paymentMethods?: PaymentMethod[];
    defaultPaymentMethod?: string;
};

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: 'card-1',
        label: 'Visa •••• 4242',
        detail: 'Personal · Expires 09/27',
    },
    {
        id: 'wallet-1',
        label: 'Creator Wallet',
        detail: 'Available balance · $182.40',
    },
] as const;

export default function TipDialog({
    open,
    onOpenChange,
    onConfirm,
    paymentMethods = DEFAULT_PAYMENT_METHODS,
    defaultPaymentMethod = 'card-1',
}: TipDialogProps) {
    const [tipMode, setTipMode] = useState<'send' | 'request'>('send');
    const [tipAmount, setTipAmount] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] =
        useState<string>(defaultPaymentMethod);
    const [isProcessingTip, setIsProcessingTip] = useState(false);
    const [tipError, setTipError] = useState<string | null>(null);

    const parsedTipAmount =
        tipAmount.trim() === ''
            ? Number.NaN
            : Number.parseFloat(tipAmount.trim());
    const isValidTipAmount =
        Number.isFinite(parsedTipAmount) && parsedTipAmount > 0;
    const canConfirmTip =
        isValidTipAmount &&
        (tipMode === 'request' || Boolean(selectedPaymentMethod));
    const isSendMode = tipMode === 'send';

    const resetTipState = useCallback(() => {
        setTipAmount('');
        setTipMode('send');
        setSelectedPaymentMethod(defaultPaymentMethod);
        setTipError(null);
        setIsProcessingTip(false);
    }, [defaultPaymentMethod]);

    const handleOpenChange = useCallback(
        (newOpen: boolean) => {
            onOpenChange(newOpen);
            if (!newOpen) {
                resetTipState();
            }
        },
        [onOpenChange, resetTipState],
    );

    const handleConfirm = useCallback(async () => {
        if (!isValidTipAmount) {
            return;
        }

        setTipError(null);
        setIsProcessingTip(true);

        try {
            await onConfirm(
                parsedTipAmount,
                tipMode,
                tipMode === 'send' ? selectedPaymentMethod : undefined,
            );
            handleOpenChange(false);
        } catch (error) {
            console.error('Unable to create tip message', error);
            setTipError(
                'We could not process this tip right now. Please try again.',
            );
        } finally {
            setIsProcessingTip(false);
        }
    }, [
        isValidTipAmount,
        parsedTipAmount,
        tipMode,
        selectedPaymentMethod,
        onConfirm,
        handleOpenChange,
    ]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md border-white/10 bg-neutral-950/95 text-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-white">
                        Support this creator
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-xs text-white/50">
                        Send a quick tip or request one to keep the conversation
                        flowing.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-5">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                        {(['send', 'request'] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setTipMode(mode)}
                                className={cn(
                                    'flex-1 rounded-full px-4 py-2 text-xs font-semibold tracking-[0.3em] uppercase transition',
                                    tipMode === mode
                                        ? 'bg-white text-neutral-900 shadow-[0_10px_30px_-15px_rgba(255,255,255,0.75)]'
                                        : 'text-white/55 hover:text-white',
                                )}
                            >
                                {mode === 'send' ? 'Send tip' : 'Request tip'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="tip-amount"
                            className="text-xs tracking-[0.3em] text-white/50 uppercase"
                        >
                            Amount
                        </Label>
                        <Input
                            id="tip-amount"
                            inputMode="decimal"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="25"
                            value={tipAmount}
                            onChange={(event) =>
                                setTipAmount(event.target.value)
                            }
                            className="h-11 rounded-2xl border-white/15 bg-white/5 text-white placeholder:text-white/30 focus:border-amber-400/60 focus:ring-amber-400/40"
                        />
                        <p className="text-xs text-white/35">
                            Creators keep 95% of every tip.
                        </p>
                    </div>

                    {isSendMode ? (
                        <div className="space-y-3">
                            <span className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                Pay with
                            </span>
                            <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedPaymentMethod(method.id)
                                        }
                                        className={cn(
                                            'w-full rounded-2xl border px-4 py-3 text-left transition',
                                            selectedPaymentMethod === method.id
                                                ? 'border-amber-400/60 bg-amber-400/10 text-white shadow-[0_15px_35px_-20px_rgba(251,191,36,0.65)]'
                                                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white',
                                        )}
                                    >
                                        <p className="text-sm font-medium text-white">
                                            {method.label}
                                        </p>
                                        <p className="mt-1 text-xs text-white/50">
                                            {method.detail}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                            They'll get a notification right away. Once
                            accepted, the request will appear in your chat
                            history.
                        </p>
                    )}
                    {tipError ? (
                        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                            {tipError}
                        </p>
                    ) : null}
                </div>
                <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-11 rounded-full border border-transparent text-white/70 hover:border-white/10 hover:bg-white/5 sm:px-6"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!canConfirmTip || isProcessingTip}
                        className="h-11 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 font-semibold text-white shadow-[0_18px_40px_-18px_rgba(249,115,22,0.65)] hover:from-amber-400/90 hover:via-rose-500/90 hover:to-violet-600/90 disabled:opacity-50"
                        onClick={handleConfirm}
                    >
                        {isProcessingTip ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {tipMode === 'send'
                                    ? 'Sending…'
                                    : 'Requesting…'}
                            </>
                        ) : tipMode === 'send' ? (
                            'Send tip'
                        ) : (
                            'Request tip'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


