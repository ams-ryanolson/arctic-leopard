import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Smartphone, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PushToCardProps {
    onBack: () => void;
    onSave: (data: { cardNumber: string; expiryMonth: string; expiryYear: string; cvv: string; cardholderName: string }) => void;
}

export default function PushToCard({ onBack, onSave }: PushToCardProps) {
    const [cardNumber, setCardNumber] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardholderName, setCardholderName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ cardNumber, expiryMonth, expiryYear, cvv, cardholderName });
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        }
        return v;
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
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 border border-emerald-400/40 shadow-[0_8px_25px_-15px_rgba(16,185,129,0.4)]">
                        <Smartphone className="h-6 w-6 text-emerald-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Push to Card</h3>
                        <p className="text-sm text-white/70 leading-relaxed">Instant transfer to your debit card</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm text-emerald-200/90 leading-relaxed">
                    <span className="font-semibold text-emerald-200">Fast payouts:</span> Get paid instantly to your debit card, usually within minutes. Secure and convenient.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="cardholder-name" className="text-base font-semibold text-white/90">
                            Cardholder Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="cardholder-name"
                            type="text"
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            placeholder="John Doe"
                            className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all h-12 text-base"
                            required
                        />
                        <p className="text-xs text-white/60">Must match the name on your card</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="card-number" className="text-base font-semibold text-white/90">
                            Card Number <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="card-number"
                            type="text"
                            value={cardNumber}
                            onChange={(e) => {
                                const formatted = formatCardNumber(e.target.value);
                                setCardNumber(formatted);
                            }}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all h-12 text-base font-mono tracking-wider"
                            required
                        />
                        <p className="text-xs text-white/60">Enter your 16-digit card number</p>
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiry-month" className="text-base font-semibold text-white/90">
                                Month <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="expiry-month"
                                type="text"
                                value={expiryMonth}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, '');
                                    if (v.length <= 2) {
                                        const num = parseInt(v, 10);
                                        if (num >= 1 && num <= 12 || v === '') {
                                            setExpiryMonth(v);
                                        }
                                    }
                                }}
                                placeholder="MM"
                                maxLength={2}
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all h-12 text-base text-center font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiry-year" className="text-base font-semibold text-white/90">
                                Year <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="expiry-year"
                                type="text"
                                value={expiryYear}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, '');
                                    if (v.length <= 4) {
                                        setExpiryYear(v);
                                    }
                                }}
                                placeholder="YYYY"
                                maxLength={4}
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all h-12 text-base text-center font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cvv" className="text-base font-semibold text-white/90">
                                CVV <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="cvv"
                                type="text"
                                value={cvv}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, '');
                                    if (v.length <= 4) {
                                        setCvv(v);
                                    }
                                }}
                                placeholder="123"
                                maxLength={4}
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all h-12 text-base text-center font-mono"
                                required
                            />
                            <p className="text-xs text-white/60">3-4 digits on back</p>
                        </div>
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
                        className="flex-1 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 px-6 py-3 text-white font-semibold hover:from-emerald-500 hover:to-teal-600 shadow-[0_8px_25px_-15px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_35px_-15px_rgba(16,185,129,0.6)] transition-all"
                    >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Save Card
                    </Button>
                </div>
            </form>
        </div>
    );
}

