import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, Wallet } from 'lucide-react';
import { useState } from 'react';

interface CryptoWalletProps {
    onBack: () => void;
    onSave: (data: { walletAddress: string; walletType: string }) => void;
}

export default function CryptoWallet({ onBack, onSave }: CryptoWalletProps) {
    const [walletAddress, setWalletAddress] = useState('');
    const [walletType, setWalletType] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ walletAddress, walletType });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl border border-purple-400/40 bg-gradient-to-br from-purple-400/30 to-purple-500/20 shadow-[0_8px_25px_-15px_rgba(168,85,247,0.4)]">
                        <Wallet className="h-6 w-6 text-purple-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            Crypto Wallet
                        </h3>
                        <p className="text-sm leading-relaxed text-white/70">
                            Receive payments in cryptocurrency
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-4">
                <p className="text-sm leading-relaxed text-purple-200/90">
                    <span className="font-semibold text-purple-200">
                        Decentralized payments:
                    </span>{' '}
                    Fast, secure, and borderless. Double-check your wallet
                    address—transactions cannot be reversed.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="space-y-2">
                        <Label
                            htmlFor="wallet-type"
                            className="text-base font-semibold text-white/90"
                        >
                            Wallet Type <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="wallet-type"
                            type="text"
                            value={walletType}
                            onChange={(e) => setWalletType(e.target.value)}
                            placeholder="BTC, ETH, USDC, etc."
                            className="h-12 border-white/15 bg-black/20 text-base text-white transition-all placeholder:text-white/40 focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
                            required
                        />
                        <p className="text-xs text-white/60">
                            Enter the cryptocurrency type (e.g., Bitcoin,
                            Ethereum, USDC)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="wallet-address"
                            className="text-base font-semibold text-white/90"
                        >
                            Wallet Address{' '}
                            <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="wallet-address"
                            type="text"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="Enter your wallet address"
                            className="h-12 border-white/15 bg-black/20 font-mono text-sm break-all text-white transition-all placeholder:text-white/40 focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
                            required
                        />
                        <p className="text-xs font-medium text-red-300/80">
                            ⚠️ Double-check your wallet address. Transactions
                            cannot be reversed.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onBack}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 rounded-xl bg-gradient-to-r from-purple-400 via-purple-500 to-violet-500 px-6 py-3 font-semibold text-white shadow-[0_8px_25px_-15px_rgba(168,85,247,0.5)] transition-all hover:from-purple-500 hover:to-violet-600 hover:shadow-[0_12px_35px_-15px_rgba(168,85,247,0.6)]"
                    >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Save Wallet
                    </Button>
                </div>
            </form>
        </div>
    );
}
