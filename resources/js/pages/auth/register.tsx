import { useEffect, useMemo, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import {
    LocationAutocomplete,
    type LocationSuggestion,
} from '@/components/location-autocomplete';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Head, useForm, type InertiaFormProps } from '@inertiajs/react';
import {
    AtSign,
    CalendarDays,
    Check,
    Circle,
    Eye,
    EyeOff,
    LocateFixed,
    MapPin,
    Sparkles,
    UserRound,
} from 'lucide-react';

type Step = 'account' | 'profile' | 'review';

const stepOrder: Step[] = ['account', 'profile', 'review'];

const stepMeta: Record<Step, { title: string; subtitle: string }> = {
    account: {
        title: 'Account Access',
        subtitle: 'Lock in your identity and secure your credentials.',
    },
    profile: {
        title: 'Personal Details',
        subtitle: 'Confirm your age and share where you create.',
    },
    review: {
        title: 'Review & Submit',
        subtitle: 'Confirm everything looks right before you launch.',
    },
};

const fieldsPerStep: Record<Step, Array<keyof RegistrationFormData>> = {
    account: ['username', 'email', 'password', 'password_confirmation'],
    profile: [
        'birthdate',
        'location_city',
        'location_country',
        'location_latitude',
        'location_longitude',
    ],
    review: ['accepted_terms', 'accepted_privacy'],
};

interface RegistrationFormData {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    birthdate: string;
    location_city: string;
    location_region: string;
    location_country: string;
    location_latitude: string;
    location_longitude: string;
    accepted_terms: boolean;
    accepted_privacy: boolean;
}

interface UsernameFeedback {
    state: 'idle' | 'checking' | 'available' | 'unavailable' | 'error';
    message?: string;
    suggestions: string[];
}

interface EmailFeedback {
    state: 'idle' | 'checking' | 'available' | 'unavailable' | 'error';
    message?: string;
    suggestions: string[];
}

type RegistrationFormInstance = InertiaFormProps<RegistrationFormData>;

type PasswordChecklist = {
    length: boolean;
    uppercase: boolean;
    number: boolean;
    symbol: boolean;
};

const passwordRequirementLabels: Record<keyof PasswordChecklist, string> = {
    length: '8 characters minimum',
    uppercase: 'One capital letter',
    number: 'One number',
    symbol: 'One symbol',
};

const evaluatePassword = (value: string): PasswordChecklist => ({
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
});

const passwordMeetsRequirements = (value: string): boolean => {
    if (!value) {
        return false;
    }

    const checklist = evaluatePassword(value);

    return (
        checklist.length &&
        checklist.uppercase &&
        checklist.number &&
        checklist.symbol
    );
};

const formatList = (items: string[]): string => {
    if (items.length === 0) {
        return '';
    }

    if (items.length === 1) {
        return items[0];
    }

    if (items.length === 2) {
        return `${items[0]} and ${items[1]}`;
    }

    return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

export default function Register() {
    const form = useForm<RegistrationFormData>({
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        birthdate: '',
        location_city: '',
        location_region: '',
        location_country: '',
        location_latitude: '',
        location_longitude: '',
        accepted_terms: false,
        accepted_privacy: false,
    });

    const [usernameStatus, setUsernameStatus] = useState<UsernameFeedback>({
        state: 'idle',
        suggestions: [],
    });
    const [emailStatus, setEmailStatus] = useState<EmailFeedback>({
        state: 'idle',
        suggestions: [],
    });
    const [lastCheckedUsername, setLastCheckedUsername] = useState('');
    const [lastCheckedEmail, setLastCheckedEmail] = useState('');
    const [manualStep, setManualStep] = useState<Step>('account');
    const [locationStatus, setLocationStatus] = useState<
        'idle' | 'locating' | 'acquired' | 'denied'
    >(
        form.data.location_latitude && form.data.location_longitude
            ? 'acquired'
            : 'idle',
    );
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationQuery, setLocationQuery] = useState('');

    const buildLocationLabel = (
        city: string,
        region: string,
        country: string,
    ): string => [city, region, country].filter(Boolean).join(', ');

    const locationDisplay = useMemo(
        () =>
            buildLocationLabel(
                form.data.location_city,
                form.data.location_region,
                form.data.location_country,
            ),
        [
            form.data.location_city,
            form.data.location_region,
            form.data.location_country,
        ],
    );

    useEffect(() => {
        if (locationDisplay && !locationQuery) {
            setLocationQuery(locationDisplay);
        }
    }, [locationDisplay, locationQuery]);

    const handleLocationQueryChange = (value: string) => {
        setLocationQuery(value);
        setLocationError(null);

        form.setData('location_city', '');
        form.setData('location_region', '');
        form.setData('location_country', '');
        form.setData('location_latitude', '');
        form.setData('location_longitude', '');
        setLocationStatus('idle');
    };

    const handleLocationSelect = (suggestion: LocationSuggestion) => {
        form.setData('location_city', suggestion.city);
        form.setData('location_region', suggestion.region ?? '');
        form.setData('location_country', suggestion.country);
        form.setData('location_latitude', suggestion.latitude);
        form.setData('location_longitude', suggestion.longitude);
        setLocationQuery(suggestion.label);
        setLocationStatus('acquired');
        setLocationError(null);
    };

    const checkUsernameAvailability = async (
        rawValue: string,
    ): Promise<UsernameFeedback['state']> => {
        const username = rawValue.trim();

        if (username === '') {
            setUsernameStatus({ state: 'idle', suggestions: [] });
            setLastCheckedUsername('');
            return 'idle';
        }

        if (
            username === lastCheckedUsername &&
            (usernameStatus.state === 'available' ||
                usernameStatus.state === 'unavailable')
        ) {
            return usernameStatus.state;
        }

        setUsernameStatus({ state: 'checking', suggestions: [] });

        try {
            const response = await fetch(
                `/username/check?${new URLSearchParams({ username })}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (response.status === 422) {
                const body = await response.json();
                const message = body?.errors?.username?.[0];
                setUsernameStatus({
                    state: 'error',
                    message: message ?? 'That username format is not allowed.',
                    suggestions: [],
                });
                return 'error';
            }

            if (!response.ok) {
                throw new Error('Username check failed');
            }

            const data = (await response.json()) as {
                available: boolean;
                suggestions?: string[];
            };
            setLastCheckedUsername(username);

            if (data.available) {
                setUsernameStatus({
                    state: 'available',
                    message: 'This username is available.',
                    suggestions: [],
                });

                return 'available';
            }

            const suggestions = Array.isArray(data.suggestions)
                ? data.suggestions
                : [];
            setUsernameStatus({
                state: 'unavailable',
                message:
                    'That username is already taken. Try one of these options.',
                suggestions,
            });

            return 'unavailable';
        } catch (error) {
            console.error(error);
            setUsernameStatus({
                state: 'error',
                message: 'We could not verify that username. Please try again.',
                suggestions: [],
            });

            return 'error';
        }
    };

    const handleUsernameChange = (nextValue: string) => {
        form.setData('username', nextValue);

        if (nextValue.trim() === '') {
            setUsernameStatus({ state: 'idle', suggestions: [] });
            setLastCheckedUsername('');
            return;
        }

        if (
            usernameStatus.state !== 'idle' &&
            nextValue.trim() !== lastCheckedUsername
        ) {
            setUsernameStatus({ state: 'idle', suggestions: [] });
        }
    };

    const handleUsernameBlur = () => {
        void checkUsernameAvailability(form.data.username);
    };

    const handleUsernameSuggestionSelect = (suggestion: string) => {
        handleUsernameChange(suggestion);
        setManualStep('account');
        void checkUsernameAvailability(suggestion);
    };

    const checkEmailAvailability = async (
        rawValue: string,
    ): Promise<EmailFeedback['state']> => {
        const email = rawValue.trim().toLowerCase();

        if (email === '') {
            setEmailStatus({ state: 'idle', suggestions: [] });
            setLastCheckedEmail('');
            return 'idle';
        }

        if (
            email === lastCheckedEmail &&
            (emailStatus.state === 'available' ||
                emailStatus.state === 'unavailable')
        ) {
            return emailStatus.state;
        }

        setEmailStatus({ state: 'checking', suggestions: [] });

        try {
            const response = await fetch(
                `/email/check?${new URLSearchParams({ email })}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (response.status === 422) {
                const body = await response.json();
                const message = body?.errors?.email?.[0];
                setEmailStatus({
                    state: 'error',
                    message: message ?? 'That email format is not allowed.',
                    suggestions: [],
                });

                return 'error';
            }

            if (!response.ok) {
                throw new Error('Email check failed');
            }

            const data = (await response.json()) as {
                available: boolean;
                suggestions?: string[];
            };
            setLastCheckedEmail(email);

            if (data.available) {
                setEmailStatus({
                    state: 'available',
                    message: 'This email is available.',
                    suggestions: [],
                });

                return 'available';
            }

            const suggestions = Array.isArray(data.suggestions)
                ? data.suggestions
                : [];
            setEmailStatus({
                state: 'unavailable',
                message:
                    'That email is already taken. Try one of these options.',
                suggestions,
            });

            return 'unavailable';
        } catch (error) {
            console.error(error);
            setEmailStatus({
                state: 'error',
                message: 'We could not verify that email. Please try again.',
                suggestions: [],
            });

            return 'error';
        }
    };

    const handleEmailChange = (nextValue: string) => {
        form.setData('email', nextValue);

        if (nextValue.trim() === '') {
            setEmailStatus({ state: 'idle', suggestions: [] });
            setLastCheckedEmail('');
            return;
        }

        if (
            emailStatus.state !== 'idle' &&
            nextValue.trim().toLowerCase() !== lastCheckedEmail
        ) {
            setEmailStatus({ state: 'idle', suggestions: [] });
        }
    };

    const handleEmailBlur = () => {
        void checkEmailAvailability(form.data.email);
    };

    const handleEmailSuggestionSelect = (suggestion: string) => {
        handleEmailChange(suggestion);
        setManualStep('account');
        void checkEmailAvailability(suggestion);
    };

    const errorStep = useMemo<Step | null>(() => {
        const errorKeys = Object.keys(form.errors);
        if (!errorKeys.length) {
            return null;
        }

        if (
            errorKeys.some((key) =>
                fieldsPerStep.account.includes(
                    key as keyof RegistrationFormData,
                ),
            )
        ) {
            return 'account';
        }

        if (
            errorKeys.some((key) =>
                fieldsPerStep.profile.includes(
                    key as keyof RegistrationFormData,
                ),
            )
        ) {
            return 'profile';
        }

        return 'review';
    }, [form.errors]);

    const currentStep = errorStep ?? manualStep;
    const currentStepIndex = useMemo(
        () => stepOrder.indexOf(currentStep),
        [currentStep],
    );
    const isLastStep = currentStep === 'review';

    const isOldEnough = useMemo(() => {
        if (!form.data.birthdate) {
            return false;
        }

        const selected = new Date(form.data.birthdate);
        const threshold = new Date();
        threshold.setFullYear(threshold.getFullYear() - 18);
        return selected <= threshold;
    }, [form.data.birthdate]);

    const goToNextStep = () => {
        const next = stepOrder[currentStepIndex + 1];
        if (next) {
            setManualStep(next);
        }
    };

    const goToPreviousStep = () => {
        const prev = stepOrder[currentStepIndex - 1];
        if (prev) {
            setManualStep(prev);
        }
    };

    const canAdvance = (step: Step): boolean => {
        const requiredFields = fieldsPerStep[step];

        const hasValues = requiredFields.every((field) => {
            if (typeof form.data[field] === 'boolean') {
                return true;
            }

            return form.data[field] !== '';
        });

        if (!hasValues) {
            return false;
        }

        if (step === 'account') {
            if (!passwordMeetsRequirements(form.data.password)) {
                return false;
            }

            if (form.data.password !== form.data.password_confirmation) {
                return false;
            }

            if (
                usernameStatus.state === 'checking' ||
                usernameStatus.state === 'unavailable' ||
                usernameStatus.state === 'error' ||
                emailStatus.state === 'checking' ||
                emailStatus.state === 'unavailable' ||
                emailStatus.state === 'error'
            ) {
                return false;
            }
        }

        if (step === 'profile') {
            if (!isOldEnough) {
                return false;
            }

            if (!form.data.location_latitude || !form.data.location_longitude) {
                return false;
            }
        }

        if (step === 'review') {
            return form.data.accepted_terms && form.data.accepted_privacy;
        }

        return true;
    };

    const handleNext = async () => {
        if (currentStep === 'account') {
            const trimmedEmail = form.data.email.trim().toLowerCase();
            if (trimmedEmail !== '' && emailStatus.state !== 'available') {
                const emailResult = await checkEmailAvailability(trimmedEmail);
                if (emailResult !== 'available') {
                    return;
                }
            }

            const trimmedUsername = form.data.username.trim();
            if (
                trimmedUsername !== '' &&
                usernameStatus.state !== 'available'
            ) {
                const result = await checkUsernameAvailability(trimmedUsername);

                if (result !== 'available') {
                    return;
                }
            }
        }

        if (!canAdvance(currentStep)) {
            return;
        }

        if (isLastStep) {
            form.post(store.url(), {
                preserveScroll: true,
                errorBag: 'register',
                onSuccess: () => {
                    form.reset('password', 'password_confirmation');
                },
            });
            return;
        }

        goToNextStep();
    };

    return (
        <AuthLayout
            title="Tell us about your Real Kink persona"
            description="Three quick steps and you’ll be ready to take the spotlight."
        >
            <Head title="Register" />

            <form
                className="space-y-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleNext();
                }}
                noValidate
            >
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 text-white shadow-[0_20px_45px_-35px_rgba(249,115,22,0.55)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.25),_transparent_55%)] opacity-60" />
                    <div className="relative flex items-center gap-4">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_18px_45px_-28px_rgba(249,115,22,0.55)]">
                            <Sparkles className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold tracking-tight text-white">
                                Creator onboarding
                            </p>
                            <p className="text-xs text-white/70">
                                Secure sign-up, location-aware discovery, and
                                consent-first safety baked into every step.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/12 bg-black/60 p-6 text-white shadow-[0_25px_65px_-35px_rgba(0,0,0,0.65)] backdrop-blur sm:p-8">
                    <div className="flex flex-wrap items-center gap-4">
                        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
                            {stepMeta[currentStep].title}
                        </h2>
                    </div>

                    <p className="mt-2 text-sm text-white/70 sm:text-base">
                        {stepMeta[currentStep].subtitle}
                    </p>

                    <div className="mt-6 space-y-6">
                        {currentStep === 'account' && (
                            <AccountStep
                                form={form}
                                usernameStatus={usernameStatus}
                                emailStatus={emailStatus}
                                onUsernameChange={handleUsernameChange}
                                onUsernameBlur={handleUsernameBlur}
                                onUsernameSuggestionSelect={
                                    handleUsernameSuggestionSelect
                                }
                                onEmailChange={handleEmailChange}
                                onEmailBlur={handleEmailBlur}
                                onEmailSuggestionSelect={
                                    handleEmailSuggestionSelect
                                }
                            />
                        )}
                        {currentStep === 'profile' && (
                            <ProfileStep
                                form={form}
                                locationStatus={locationStatus}
                                setLocationStatus={setLocationStatus}
                                locationError={locationError}
                                setLocationError={setLocationError}
                                isOldEnough={isOldEnough}
                                locationQuery={locationQuery}
                                onLocationQueryChange={
                                    handleLocationQueryChange
                                }
                                onLocationSelect={handleLocationSelect}
                            />
                        )}
                        {currentStep === 'review' && (
                            <ReviewStep
                                form={form}
                                isOldEnough={isOldEnough}
                                locationStatus={locationStatus}
                                locationDisplay={locationDisplay}
                            />
                        )}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={goToPreviousStep}
                            disabled={
                                currentStep === 'account' || form.processing
                            }
                        >
                            Back
                        </Button>

                        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                            {currentStep !== 'review' && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        void handleNext();
                                    }}
                                    disabled={
                                        !canAdvance(currentStep) ||
                                        form.processing
                                    }
                                    className={cn(
                                        'transition',
                                        canAdvance(currentStep) &&
                                            !form.processing
                                            ? 'bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_20px_45px_-25px_rgba(249,115,22,0.6)] hover:scale-[1.01]'
                                            : 'opacity-60',
                                    )}
                                >
                                    Continue
                                </Button>
                            )}

                            {currentStep === 'review' && (
                                <Button
                                    type="submit"
                                    className={cn(
                                        'px-6 transition',
                                        canAdvance('review') && !form.processing
                                            ? 'bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_20px_45px_-25px_rgba(249,115,22,0.6)] hover:scale-[1.01]'
                                            : 'opacity-60',
                                    )}
                                    disabled={
                                        !canAdvance('review') || form.processing
                                    }
                                    data-test="register-user-button"
                                >
                                    {form.processing && <Spinner />}
                                    Create account
                                </Button>
                            )}

                            {currentStep === 'profile' &&
                                !isOldEnough &&
                                form.data.birthdate && (
                                    <p className="text-xs font-medium text-amber-300">
                                        You must be 18 or older to continue.
                                    </p>
                                )}
                            {currentStep === 'profile' &&
                                (!form.data.location_latitude ||
                                    !form.data.location_longitude) && (
                                    <p className="text-xs text-white/60">
                                        Share or select a location to unlock
                                        regional discovery.
                                    </p>
                                )}
                        </div>
                    </div>
                </div>

                <div className="text-center text-sm text-white/65">
                    Already have an account?{' '}
                    <TextLink href={login()} className="text-white">
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}

function RequirementIndicator({ met, label }: { met: boolean; label: string }) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 text-xs font-medium transition',
                met ? 'text-emerald-300' : 'text-white/50',
            )}
        >
            {met ? <Check className="size-3" /> : <Circle className="size-3" />}
            <span>{label}</span>
        </div>
    );
}

function AccountStep({
    form,
    usernameStatus,
    emailStatus,
    onUsernameChange,
    onUsernameBlur,
    onUsernameSuggestionSelect,
    onEmailChange,
    onEmailBlur,
    onEmailSuggestionSelect,
}: {
    form: RegistrationFormInstance;
    usernameStatus: UsernameFeedback;
    emailStatus: EmailFeedback;
    onUsernameChange: (value: string) => void;
    onUsernameBlur: () => void;
    onUsernameSuggestionSelect: (suggestion: string) => void;
    onEmailChange: (value: string) => void;
    onEmailBlur: () => void;
    onEmailSuggestionSelect: (suggestion: string) => void;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const passwordChecklist = useMemo(
        () => evaluatePassword(form.data.password),
        [form.data.password],
    );

    const missingRequirements = useMemo(
        () =>
            (
                Object.keys(passwordChecklist) as Array<keyof PasswordChecklist>
            ).filter((key) => !passwordChecklist[key]),
        [passwordChecklist],
    );

    const passwordStrength = useMemo(() => {
        const value = form.data.password;

        if (!value) {
            return {
                level: 'weak',
                label: 'Use a capital letter, number, symbol, and 8+ characters.',
            };
        }

        if (missingRequirements.length === 0) {
            return {
                level: 'strong',
                label: 'Looks fierce. All requirements met.',
            };
        }

        const missingLabels = missingRequirements.map((key) =>
            passwordRequirementLabels[key].toLowerCase(),
        );
        const level = missingRequirements.length >= 3 ? 'weak' : 'medium';
        const label =
            missingRequirements.length === 1
                ? `Add ${missingLabels[0]} to continue.`
                : `Missing ${formatList(missingLabels)}.`;

        return {
            level,
            label,
        };
    }, [form.data.password, missingRequirements]);

    const passwordsMatch = useMemo(
        () =>
            form.data.password_confirmation === '' ||
            form.data.password === form.data.password_confirmation,
        [form.data.password, form.data.password_confirmation],
    );

    return (
        <div className="space-y-6 text-left">
            <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    value={form.data.username}
                    onChange={(event) => onUsernameChange(event.target.value)}
                    onBlur={onUsernameBlur}
                    placeholder="Your handle"
                    autoFocus
                    autoComplete="username"
                />
                <p className="text-xs text-white/60">
                    This is how others will find you. Only letters, numbers,
                    periods, hyphens, and underscores.
                </p>
                {usernameStatus.state === 'checking' && (
                    <p className="text-xs text-white/60">
                        Checking availability…
                    </p>
                )}
                {usernameStatus.state === 'available' && (
                    <p className="text-xs font-medium text-emerald-300">
                        {usernameStatus.message ??
                            'This username is available.'}
                    </p>
                )}
                {usernameStatus.state === 'unavailable' && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-rose-300">
                            {usernameStatus.message ??
                                'That username is already taken. Try one of these options.'}
                        </p>
                        {usernameStatus.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {usernameStatus.suggestions.map(
                                    (suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() =>
                                                onUsernameSuggestionSelect(
                                                    suggestion,
                                                )
                                            }
                                            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 transition hover:border-white/40 hover:bg-white/15"
                                        >
                                            {suggestion}
                                        </button>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                )}
                {usernameStatus.state === 'error' && (
                    <p className="text-xs font-medium text-amber-300">
                        {usernameStatus.message ??
                            'We could not verify that username. Please try again.'}
                    </p>
                )}
                <InputError message={form.errors.username} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                    id="email"
                    type="email"
                    value={form.data.email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    onBlur={onEmailBlur}
                    placeholder="you@realkink.men"
                    autoComplete="email"
                />
                {emailStatus.state === 'checking' && (
                    <p className="text-xs text-white/60">
                        Checking email availability…
                    </p>
                )}
                {emailStatus.state === 'available' && (
                    <p className="text-xs font-medium text-emerald-300">
                        {emailStatus.message ?? 'This email is available.'}
                    </p>
                )}
                {emailStatus.state === 'unavailable' && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-rose-300">
                            {emailStatus.message ??
                                'That email is already registered. Try one of these options.'}
                        </p>
                        {emailStatus.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {emailStatus.suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() =>
                                            onEmailSuggestionSelect(suggestion)
                                        }
                                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 transition hover:border-white/40 hover:bg-white/15"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {emailStatus.state === 'error' && (
                    <p className="text-xs font-medium text-amber-300">
                        {emailStatus.message ??
                            'We could not verify that email. Please try again.'}
                    </p>
                )}
                <InputError message={form.errors.email} />
            </div>

            <div className="grid gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                            placeholder="Create a password"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-white/60 transition hover:text-white"
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>
                    <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                            className={cn('h-full transition-all', {
                                'w-1/3 bg-rose-500/70':
                                    passwordStrength.level === 'weak',
                                'w-2/3 bg-amber-400/70':
                                    passwordStrength.level === 'medium',
                                'w-full bg-emerald-400/80':
                                    passwordStrength.level === 'strong',
                            })}
                        />
                    </div>
                    <p className="text-xs text-white/60">
                        {passwordStrength.label}
                    </p>
                    <div className="mt-3 grid gap-1">
                        {(
                            Object.entries(passwordRequirementLabels) as Array<
                                [keyof PasswordChecklist, string]
                            >
                        ).map(([key, requirementLabel]) => (
                            <RequirementIndicator
                                key={key}
                                met={passwordChecklist[key]}
                                label={requirementLabel}
                            />
                        ))}
                    </div>
                    <InputError message={form.errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">
                        Confirm password
                    </Label>
                    <div className="relative">
                        <Input
                            id="password_confirmation"
                            type={showConfirmation ? 'text' : 'password'}
                            value={form.data.password_confirmation}
                            onChange={(event) =>
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                            placeholder="Repeat password"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmation((value) => !value)
                            }
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-white/60 transition hover:text-white"
                            aria-label={
                                showConfirmation
                                    ? 'Hide password confirmation'
                                    : 'Show password confirmation'
                            }
                        >
                            {showConfirmation ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>
                    {!passwordsMatch && (
                        <p className="text-xs font-medium text-rose-300">
                            Passwords do not match.
                        </p>
                    )}
                    <InputError message={form.errors.password_confirmation} />
                </div>
            </div>
        </div>
    );
}

function ProfileStep({
    form,
    locationStatus,
    setLocationStatus,
    locationError,
    setLocationError,
    isOldEnough,
    locationQuery,
    onLocationQueryChange,
    onLocationSelect,
}: {
    form: RegistrationFormInstance;
    locationStatus: 'idle' | 'locating' | 'acquired' | 'denied';
    setLocationStatus: (
        status: 'idle' | 'locating' | 'acquired' | 'denied',
    ) => void;
    locationError: string | null;
    setLocationError: (value: string | null) => void;
    isOldEnough: boolean;
    locationQuery: string;
    onLocationQueryChange: (value: string) => void;
    onLocationSelect: (suggestion: LocationSuggestion) => void;
}) {
    const [birthdate, setBirthdate] = useState<Date | undefined>(
        form.data.birthdate ? new Date(form.data.birthdate) : undefined,
    );
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const eighteenYearsAgo = useMemo(() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 18);
        return date;
    }, []);
    const birthdateContainerRef = useRef<HTMLDivElement | null>(null);
    const birthdateDisplay = useMemo(
        () =>
            birthdate
                ? birthdate.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : '',
        [birthdate],
    );
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [autoLocationActive, setAutoLocationActive] = useState(false);

    useEffect(() => {
        if (!form.data.birthdate) {
            setBirthdate(undefined);
            return;
        }

        const next = new Date(form.data.birthdate);
        if (!birthdate || next.toDateString() !== birthdate.toDateString()) {
            setBirthdate(next);
        }
    }, [form.data.birthdate, birthdate]);

    useEffect(() => {
        if (!isCalendarOpen) {
            return;
        }

        const handleClick = (event: MouseEvent) => {
            if (
                birthdateContainerRef.current &&
                !birthdateContainerRef.current.contains(event.target as Node)
            ) {
                setIsCalendarOpen(false);
            }
        };

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsCalendarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isCalendarOpen]);

    const handleUseCurrentLocation = () => {
        if (!('geolocation' in navigator)) {
            setLocationStatus('denied');
            setLocationError(
                'Geolocation is not supported by your browser. Try searching instead.',
            );
            setAutoLocationActive(false);
            return;
        }

        setLocationStatus('locating');
        setLocationError(null);
        setAutoLocationActive(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude.toFixed(7);
                const longitude = position.coords.longitude.toFixed(7);

                setIsReverseGeocoding(true);
                try {
                    const url = new URL(
                        'https://nominatim.openstreetmap.org/reverse',
                    );
                    url.searchParams.set('format', 'json');
                    url.searchParams.set('lat', latitude);
                    url.searchParams.set('lon', longitude);
                    url.searchParams.set('addressdetails', '1');

                    const response = await fetch(url.toString(), {
                        headers: { Accept: 'application/json' },
                    });

                    const data: { address?: Record<string, string> } =
                        await response.json();
                    const address = data.address ?? {};
                    const city =
                        address.city ??
                        address.town ??
                        address.village ??
                        address.hamlet ??
                        address.municipality ??
                        '';
                    const region =
                        address.state ?? address.region ?? address.county ?? '';
                    const country = address.country ?? '';

                    if (!city || !country) {
                        setLocationStatus('acquired');
                        setLocationError(
                            'We found your coordinates but need you to confirm the city and country manually.',
                        );
                        setAutoLocationActive(false);
                        return;
                    }

                    onLocationSelect({
                        id: 'current-location',
                        label: [city, region, country]
                            .filter(Boolean)
                            .join(', '),
                        city,
                        region,
                        country,
                        latitude,
                        longitude,
                    });
                } catch (error) {
                    console.error(error);
                    setLocationStatus('acquired');
                    setLocationError(
                        'We saved your coordinates, but could not determine the city name. Try searching manually.',
                    );
                    setAutoLocationActive(false);
                } finally {
                    setIsReverseGeocoding(false);
                }
            },
            (error) => {
                console.error(error);
                setLocationStatus('denied');
                setLocationError(
                    'We could not access your location. Try a manual search instead.',
                );
                setAutoLocationActive(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10_000,
            },
        );
    };

    const highlightShareButton =
        autoLocationActive ||
        locationStatus === 'locating' ||
        isReverseGeocoding;

    return (
        <div className="space-y-6 text-left">
            <div ref={birthdateContainerRef} className="grid gap-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <div className="relative">
                    <Input
                        id="birthdate"
                        value={birthdateDisplay}
                        onClick={() => setIsCalendarOpen(true)}
                        onFocus={() => setIsCalendarOpen(true)}
                        readOnly
                        placeholder="Select your birthdate"
                        autoComplete="bday"
                        className={cn(
                            'cursor-pointer pr-12',
                            isCalendarOpen &&
                                'border-white/40 ring-4 ring-amber-500/20',
                        )}
                    />
                    <CalendarDays
                        className={cn(
                            'pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-white/50 transition',
                            isCalendarOpen && 'text-white',
                        )}
                    />

                    {isCalendarOpen && (
                        <div className="absolute right-0 left-0 z-40 mt-3 rounded-3xl border border-white/12 bg-[#0b0811]/95 p-6 text-white shadow-[0_55px_120px_-40px_rgba(249,115,22,0.55)] backdrop-blur-xl">
                            <p className="text-xs font-medium tracking-[0.35em] text-white/40 uppercase">
                                Choose Date
                            </p>
                            <Calendar
                                mode="single"
                                selected={birthdate}
                                onSelect={(value) => {
                                    setBirthdate(value ?? undefined);
                                    form.setData(
                                        'birthdate',
                                        value
                                            ? value.toISOString().slice(0, 10)
                                            : '',
                                    );
                                    if (value) {
                                        setIsCalendarOpen(false);
                                    }
                                }}
                                captionLayout="dropdown"
                                fromYear={1940}
                                toYear={new Date().getFullYear()}
                                disabled={(date) => date > eighteenYearsAgo}
                                weekStartsOn={0}
                                hideNavigation
                                className="mt-4"
                                classNames={{
                                    months: 'flex flex-col items-center gap-6',
                                    month: 'space-y-4',
                                    caption:
                                        'flex w-full flex-col gap-4 text-left text-white',
                                    caption_label: 'hidden',
                                    caption_dropdowns: 'flex gap-3',
                                    dropdown:
                                        "flex-1 appearance-none rounded-xl border border-white/15 !bg-white/10 px-3 py-2 pr-9 text-sm font-semibold !text-white focus:outline-none focus-visible:border-white/60 focus-visible:ring-4 focus-visible:ring-amber-500/30 bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:14px_14px] bg-[right_0.75rem_center] bg-no-repeat",
                                    dropdown_month: 'flex-1',
                                    dropdown_year: 'flex-1',
                                    nav: 'hidden',
                                    nav_button: 'hidden',
                                    nav_button_previous: 'hidden',
                                    nav_button_next: 'hidden',
                                    head_row:
                                        'flex w-full justify-center text-xs text-white/80',
                                    head_cell:
                                        'w-10 font-semibold uppercase tracking-[0.35em] text-center text-white/70',
                                    row: 'flex w-full justify-center',
                                    cell: 'relative flex h-11 w-11 items-center justify-center rounded-full text-sm transition focus-within:relative focus-within:z-20',
                                    day: 'size-11 p-0 font-medium text-white transition hover:bg-white/25 hover:text-black',
                                    day_selected:
                                        'bg-white text-black shadow-[0_22px_50px_-20px_rgba(249,115,22,0.55)] ring-2 ring-rose-400/70 font-semibold',
                                    day_disabled:
                                        'text-white/35 hover:bg-transparent hover:text-white/35',
                                    day_outside:
                                        'text-white/35 hover:bg-transparent hover:text-white/35',
                                }}
                                showOutsideDays
                            />
                        </div>
                    )}
                </div>
                <InputError message={form.errors.birthdate} />
                <p className="text-xs text-white/60">
                    You must be at least 18 years old to join Real Kink Men.
                    Your exact birthdate stays private.
                </p>
                {!isOldEnough && form.data.birthdate && (
                    <p className="text-xs font-medium text-amber-300">
                        You must be 18 or older to continue.
                    </p>
                )}
            </div>

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="location_search">
                        Where are you based?
                    </Label>
                    <LocationAutocomplete
                        value={locationQuery}
                        onChange={(value) => {
                            setAutoLocationActive(false);
                            onLocationQueryChange(value);
                            setLocationError(null);
                        }}
                        onSelect={(suggestion) => {
                            onLocationSelect(suggestion);
                            setAutoLocationActive(false);
                        }}
                        error={
                            form.errors.location_city ||
                            form.errors.location_country ||
                            undefined
                        }
                        status={locationStatus}
                        autoActive={autoLocationActive}
                    />
                    <InputError
                        message={
                            form.errors.location_city ||
                            form.errors.location_country
                        }
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleUseCurrentLocation}
                            disabled={
                                locationStatus === 'locating' ||
                                isReverseGeocoding
                            }
                            className={cn(
                                'group inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold tracking-[0.35em] uppercase transition',
                                highlightShareButton
                                    ? 'bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-black shadow-[0_20px_45px_-28px_rgba(249,115,22,0.5)] hover:scale-[1.01]'
                                    : 'border border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:text-white',
                            )}
                        >
                            {locationStatus === 'locating' ||
                            isReverseGeocoding ? (
                                <Spinner className="text-black" />
                            ) : (
                                <LocateFixed
                                    className={cn(
                                        'size-4 transition',
                                        autoLocationActive
                                            ? 'text-black'
                                            : 'text-white/60 group-hover:text-white',
                                    )}
                                />
                            )}
                            <span
                                className={
                                    highlightShareButton
                                        ? 'text-black'
                                        : undefined
                                }
                            >
                                Share my current location
                            </span>
                        </Button>
                        <span>
                            Help us surface kink houses, events, and creators
                            near you. You can update this later.
                        </span>
                    </div>
                    {locationError && (
                        <p className="text-xs font-medium text-amber-300">
                            {locationError}
                        </p>
                    )}
                </div>

                <input
                    type="hidden"
                    name="location_latitude"
                    value={form.data.location_latitude}
                />
                <input
                    type="hidden"
                    name="location_longitude"
                    value={form.data.location_longitude}
                />
                {(form.errors.location_latitude ||
                    form.errors.location_longitude) && (
                    <p className="text-xs font-medium text-amber-300">
                        Select a location from the list to lock in coordinates.
                    </p>
                )}
            </div>
        </div>
    );
}

function ReviewStep({
    form,
    isOldEnough,
    locationStatus,
    locationDisplay,
}: {
    form: RegistrationFormInstance;
    isOldEnough: boolean;
    locationStatus: 'idle' | 'locating' | 'acquired' | 'denied';
    locationDisplay: string;
}) {
    const summaryItems = [
        {
            label: 'Username',
            value: form.data.username || '—',
            icon: <UserRound className="size-4" />,
        },
        {
            label: 'Email',
            value: form.data.email || '—',
            icon: <AtSign className="size-4" />,
        },
        {
            label: 'Birthdate',
            value: form.data.birthdate
                ? new Date(form.data.birthdate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                  })
                : '—',
            icon: <CalendarDays className="size-4" />,
        },
        {
            label: 'Location',
            value: locationDisplay || '—',
            icon: <MapPin className="size-4" />,
        },
    ];

    const statusPills: Array<{
        label: string;
        tone: 'positive' | 'warning' | 'muted';
    }> = [
        isOldEnough
            ? { label: '18+ confirmed', tone: 'positive' }
            : { label: 'Age requirement not met', tone: 'warning' },
        locationStatus === 'acquired'
            ? { label: 'Location locked in', tone: 'positive' }
            : locationStatus === 'locating'
              ? { label: 'Locating…', tone: 'muted' }
              : locationStatus === 'denied'
                ? { label: 'Location access denied', tone: 'warning' }
                : { label: 'Location pending selection', tone: 'muted' },
    ];

    const pillStyles: Record<(typeof statusPills)[number]['tone'], string> = {
        positive: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
        warning: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
        muted: 'border-white/20 bg-white/10 text-white/70',
    };

    return (
        <div className="space-y-6 text-left">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-6 text-white shadow-[0_45px_95px_-45px_rgba(249,115,22,0.6)] backdrop-blur">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.35),_transparent_55%)] opacity-70" />

                <div className="relative">
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                        Review &amp; amplify
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                        Confirm your essentials before we send the verification
                        link. You can hop back and tweak anything if needed.
                    </p>

                    <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                        {summaryItems.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_18px_45px_-38px_rgba(249,115,22,0.6)]"
                            >
                                <div className="flex items-center gap-2 text-xs tracking-[0.35em] text-white/45 uppercase">
                                    {item.icon}
                                    {item.label}
                                </div>
                                <div className="mt-2 text-sm font-semibold text-white">
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {statusPills.map((pill) => (
                            <span
                                key={pill.label}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-medium tracking-[0.3em] uppercase',
                                    pillStyles[pill.tone],
                                )}
                            >
                                {pill.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-white shadow-[0_40px_90px_-45px_rgba(0,0,0,0.65)]">
                <h4 className="text-base font-semibold text-white">
                    Final consent
                </h4>
                <p className="mt-1 text-sm text-white/65">
                    These agreements make sure everyone on Real Kink Men plays
                    by the same rules and respects the scene.
                </p>

                <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <Checkbox
                            id="accepted_terms"
                            checked={form.data.accepted_terms}
                            onCheckedChange={(checked) =>
                                form.setData('accepted_terms', Boolean(checked))
                            }
                        />
                        <Label
                            htmlFor="accepted_terms"
                            className="text-sm font-medium text-white/85"
                        >
                            I agree to the{' '}
                            <TextLink href="/legal/terms" className="text-white">
                                Terms of Service
                            </TextLink>
                            .
                        </Label>
                    </div>
                    <InputError message={form.errors.accepted_terms} />

                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <Checkbox
                            id="accepted_privacy"
                            checked={form.data.accepted_privacy}
                            onCheckedChange={(checked) =>
                                form.setData(
                                    'accepted_privacy',
                                    Boolean(checked),
                                )
                            }
                        />
                        <Label
                            htmlFor="accepted_privacy"
                            className="text-sm font-medium text-white/85"
                        >
                            I agree to the{' '}
                            <TextLink href="/legal/privacy" className="text-white">
                                Privacy Policy
                            </TextLink>
                            .
                        </Label>
                    </div>
                    <InputError message={form.errors.accepted_privacy} />
                </div>

                <p className="mt-4 text-xs text-white/60">
                    After you submit, we’ll email a verification link. Confirm
                    within 24 hours to unlock onboarding and start curating your
                    vibe.
                </p>
            </div>
        </div>
    );
}
