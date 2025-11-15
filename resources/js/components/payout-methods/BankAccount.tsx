import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface BankAccountProps {
    onBack: () => void;
    onSave: (data: {
        accountHolderName: string;
        country: string;
        // US
        accountNumber?: string;
        routingNumber?: string;
        // Canada
        institutionNumber?: string;
        transitNumber?: string;
        // Australia
        bsb?: string;
        // UK
        sortCode?: string;
        // International (EU, etc.)
        iban?: string;
        swift?: string;
    }) => void;
}

type CountryFormat = 'us' | 'canada' | 'australia' | 'uk' | 'international';

function getCountryFormat(country: string): CountryFormat {
    const upperCountry = country.trim().toUpperCase();
    
    if (upperCountry === 'US' || upperCountry === 'USA') {
        return 'us';
    }
    if (upperCountry === 'CA' || upperCountry === 'CAN') {
        return 'canada';
    }
    if (upperCountry === 'AU' || upperCountry === 'AUS') {
        return 'australia';
    }
    if (upperCountry === 'GB' || upperCountry === 'UK' || upperCountry === 'GBR') {
        return 'uk';
    }
    return 'international';
}

export default function BankAccount({ onBack, onSave }: BankAccountProps) {
    const [accountHolderName, setAccountHolderName] = useState('');
    const [country, setCountry] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');
    const [institutionNumber, setInstitutionNumber] = useState('');
    const [transitNumber, setTransitNumber] = useState('');
    const [bsb, setBsb] = useState('');
    const [sortCode, setSortCode] = useState('');
    const [iban, setIban] = useState('');
    const [swift, setSwift] = useState('');

    const countryFormat = country ? getCountryFormat(country) : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            accountHolderName,
            country,
            ...(countryFormat === 'us' && { accountNumber, routingNumber }),
            ...(countryFormat === 'canada' && { institutionNumber, transitNumber, accountNumber }),
            ...(countryFormat === 'australia' && { bsb, accountNumber }),
            ...(countryFormat === 'uk' && { sortCode, accountNumber }),
            ...(countryFormat === 'international' && { iban, swift }),
        });
    };

    const renderCountrySpecificFields = () => {
        if (!countryFormat) return null;

        switch (countryFormat) {
            case 'us':
                return (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="routing-number" className="text-base font-semibold text-white/90">
                                Routing Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="routing-number"
                                type="text"
                                value={routingNumber}
                                onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                placeholder="123456789"
                                maxLength={9}
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                            <p className="text-xs text-white/60">
                                Also known as ACH routing number or ABA routing transit number (9 digits)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account-number" className="text-base font-semibold text-white/90">
                                Account Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="account-number"
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="Enter your account number"
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                        </div>
                    </div>
                );

            case 'canada':
                return (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="institution-number" className="text-base font-semibold text-white/90">
                                    Institution Number <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    id="institution-number"
                                    type="text"
                                    value={institutionNumber}
                                    onChange={(e) => setInstitutionNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                    placeholder="001"
                                    maxLength={3}
                                    className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base text-center font-mono"
                                    required
                                />
                                <p className="text-xs text-white/60">3 digits</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="transit-number" className="text-base font-semibold text-white/90">
                                    Transit Number <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    id="transit-number"
                                    type="text"
                                    value={transitNumber}
                                    onChange={(e) => setTransitNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                    placeholder="12345"
                                    maxLength={5}
                                    className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base text-center font-mono"
                                    required
                                />
                                <p className="text-xs text-white/60">5 digits</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account-number" className="text-base font-semibold text-white/90">
                                Account Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="account-number"
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="Enter your account number"
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                        </div>
                    </div>
                );

            case 'australia':
                return (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="bsb" className="text-base font-semibold text-white/90">
                                BSB <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="bsb"
                                type="text"
                                value={bsb}
                                onChange={(e) => setBsb(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                maxLength={6}
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                            <p className="text-xs text-white/60">
                                Bank State Branch number (6 digits, format: XXX-XXX)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account-number" className="text-base font-semibold text-white/90">
                                Account Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="account-number"
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="Enter your account number"
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                        </div>
                    </div>
                );

            case 'uk':
                return (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="sort-code" className="text-base font-semibold text-white/90">
                                Sort Code <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="sort-code"
                                type="text"
                                value={sortCode}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setSortCode(v);
                                }}
                                placeholder="123456"
                                maxLength={6}
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                            <p className="text-xs text-white/60">
                                Sort code (6 digits, format: XX-XX-XX)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account-number" className="text-base font-semibold text-white/90">
                                Account Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="account-number"
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter your account number"
                                maxLength={8}
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                            <p className="text-xs text-white/60">
                                Account number (usually 8 digits)
                            </p>
                        </div>
                    </div>
                );

            case 'international':
                return (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="iban" className="text-base font-semibold text-white/90">
                                IBAN <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="iban"
                                type="text"
                                value={iban}
                                onChange={(e) => setIban(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                placeholder="GB82 WEST 1234 5698 7654 32"
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                            <p className="text-xs text-white/60">
                                International Bank Account Number
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="swift" className="text-base font-semibold text-white/90">
                                SWIFT/BIC Code <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="swift"
                                type="text"
                                value={swift}
                                onChange={(e) => setSwift(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                placeholder="CHASUS33"
                                maxLength={11}
                                className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base font-mono"
                                required
                            />
                            <p className="text-xs text-white/60">
                                Bank Identifier Code (8-11 characters)
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
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
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/20 border border-blue-400/40 shadow-[0_8px_25px_-15px_rgba(59,130,246,0.4)]">
                        <Building2 className="h-6 w-6 text-blue-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Bank Account</h3>
                        <p className="text-sm text-white/70 leading-relaxed">Direct deposit to your bank account</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4">
                <p className="text-sm text-blue-200/90 leading-relaxed">
                    <span className="font-semibold text-blue-200">Reliable payouts:</span> Direct deposit to your bank account. We support multiple countries with their specific banking formats.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="account-holder-name" className="text-base font-semibold text-white/90">
                            Account Holder Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="account-holder-name"
                            type="text"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="John Doe"
                            className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base"
                            required
                        />
                        <p className="text-xs text-white/60">
                            Must match the name on your bank account
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="country" className="text-base font-semibold text-white/90">
                            Country <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="country"
                            type="text"
                            value={country}
                            onChange={(e) => {
                                setCountry(e.target.value);
                                // Clear all country-specific fields when country changes
                                setAccountNumber('');
                                setRoutingNumber('');
                                setInstitutionNumber('');
                                setTransitNumber('');
                                setBsb('');
                                setSortCode('');
                                setIban('');
                                setSwift('');
                            }}
                            placeholder="US, CA, AU, GB, FR, DE, etc."
                            className="bg-black/20 border-white/15 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all h-12 text-base uppercase"
                            required
                        />
                        <p className="text-xs text-white/60">
                            Enter your country code (we'll show the correct fields for your country)
                        </p>
                    </div>
                </div>

                {countryFormat && (
                    <div className="rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-400/15 to-blue-500/10 p-5 shadow-[0_4px_15px_-8px_rgba(59,130,246,0.3)]">
                        <p className="text-sm font-bold text-blue-200 mb-2">
                            {countryFormat === 'us' && '🇺🇸 United States'}
                            {countryFormat === 'canada' && '🇨🇦 Canada'}
                            {countryFormat === 'australia' && '🇦🇺 Australia'}
                            {countryFormat === 'uk' && '🇬🇧 United Kingdom'}
                            {countryFormat === 'international' && '🌍 International (IBAN)'}
                        </p>
                        <p className="text-sm text-blue-200/80 leading-relaxed">
                            {countryFormat === 'us' && 'Please provide your routing number and account number'}
                            {countryFormat === 'canada' && 'Please provide your institution number, transit number, and account number'}
                            {countryFormat === 'australia' && 'Please provide your BSB and account number'}
                            {countryFormat === 'uk' && 'Please provide your sort code and account number'}
                            {countryFormat === 'international' && 'Please provide your IBAN and SWIFT/BIC code'}
                        </p>
                    </div>
                )}

                {renderCountrySpecificFields()}

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
                        disabled={!countryFormat}
                        className="flex-1 rounded-xl bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500 px-6 py-3 text-white font-semibold hover:from-blue-500 hover:to-cyan-600 shadow-[0_8px_25px_-15px_rgba(59,130,246,0.5)] hover:shadow-[0_12px_35px_-15px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_8px_25px_-15px_rgba(59,130,246,0.5)]"
                    >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Save Bank Account
                    </Button>
                </div>
            </form>
        </div>
    );
}
