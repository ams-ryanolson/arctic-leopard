import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowLeft, CheckCircle2 } from 'lucide-react';

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
                    className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-all"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400/30 to-purple-500/20 border border-purple-400/40 shadow-[0_8px_25px_-15px_rgba(168,85,247,0.4)]">
                        <Wallet className="h-6 w-6 text-purple-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Crypto Wallet</h3>
                        <p className="text-sm text-white/70 leading-relaxed">Receive payments in cryptocurrency</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-4">
                <p className="text-sm text-purple-200/90 leading-relaxed">
                    <span className="font-semibold text-purple-200">Decentralized payments:</span> Fast, secure, and borderless. Double-check your wallet address—transactions cannot be reversed.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="wallet-type" className="text-base font-semibold text-white/90">
                            Wallet Type <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="wallet-type"
                            type="text"
                            value={walletType}
                            onChange={(e) => setWalletType(e.target.value)}
                            placeholder="BTC, ETH, USDC, etc."
                            className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all h-12 text-base"
                            required
                        />
                        <p className="text-xs text-white/60">
                            Enter the cryptocurrency type (e.g., Bitcoin, Ethereum, USDC)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="wallet-address" className="text-base font-semibold text-white/90">
                            Wallet Address <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="wallet-address"
                            type="text"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="Enter your wallet address"
                            className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all h-12 text-sm font-mono break-all"
                            required
                        />
                        <p className="text-xs text-red-300/80 font-medium">
                            ⚠️ Double-check your wallet address. Transactions cannot be reversed.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onBack}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-all font-semibold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 rounded-xl bg-gradient-to-r from-purple-400 via-purple-500 to-violet-500 px-6 py-3 text-white font-semibold hover:from-purple-500 hover:to-violet-600 shadow-[0_8px_25px_-15px_rgba(168,85,247,0.5)] hover:shadow-[0_12px_35px_-15px_rgba(168,85,247,0.6)] transition-all"
                    >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Save Wallet
                    </Button>
                </div>
            </form>
        </div>
    );
}

