import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import RichTextEditor from '@/components/rich-text-editor';
import { LocationAutocomplete, type LocationSuggestion } from '@/components/location-autocomplete';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import circlesRoutes from '@/routes/circles';
import type { Circle } from '@/types/circles';
import { cn } from '@/lib/utils';
import { X, User, Mail, MapPin, Calendar, Heart, Hash } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat();

const pronounSuggestions = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they'];

const genderOptions = [
    { value: 'man', label: 'Man' },
    { value: 'woman', label: 'Woman' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'genderfluid', label: 'Genderfluid' },
    { value: 'agender', label: 'Agender' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' },
];

const maxInterestSelections = 5;
const maxHashtags = 5;

const normalizeHashtag = (value: string): string | null => {
    const cleaned = value.replace('#', '').trim().toLowerCase();
    const safe = cleaned.replace(/[^a-z0-9._-]/g, '');

    if (safe.length === 0) {
        return null;
    }

    return safe.slice(0, 60);
};

const CircleMembershipCard = ({ circle }: { circle: Circle }) => {
    const rawFacets = circle.facets ?? [];
    const facets = Array.isArray(rawFacets) ? rawFacets : rawFacets.data ?? [];

    const defaultFacet =
        (circle.membership?.preferences?.facet as string | undefined) ??
        facets.find((facet) => facet.isDefault)?.value ??
        facets[0]?.value ??
        null;

    const form = useForm({
        role: 'member' as const,
        facet: defaultFacet,
    });

    const hasFacetOptions = facets.length > 1;

    const handleUpdate = () => {
        form.post(circlesRoutes.join.url(circle.slug), {
            preserveScroll: true,
        });
    };

    const handleLeave = () => {
        form.delete(circlesRoutes.leave.url(circle.slug), {
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold">{circle.name}</h3>
                        <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                            {numberFormatter.format(circle.membersCount)} members
                        </Badge>
                    </div>
                    {circle.tagline && (
                        <p className="text-xs text-white/65">{circle.tagline}</p>
                    )}
                </div>
                <Link
                    href={circlesRoutes.show.url(circle.slug)}
                    className="text-xs text-white/70 underline-offset-4 transition hover:text-white hover:underline"
                >
                    View circle
                </Link>
            </div>

            {hasFacetOptions && (
                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.35em] text-white/45">
                        Preferred segment
                    </span>
                    <Select
                        value={form.data.facet ?? undefined}
                        onValueChange={(value) => form.setData('facet', value)}
                        disabled={form.processing}
                    >
                        <SelectTrigger className="w-full border-white/15 bg-black/30 text-sm text-white">
                            <SelectValue placeholder="Pick a segment" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-black/90 text-white">
                            {facets.map((facet) => (
                                <SelectItem
                                    key={`${circle.id}-${facet.value}`}
                                    value={facet.value}
                                    className="text-sm"
                                >
                                    {facet.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                {hasFacetOptions && (
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-white/15 bg-black/30 text-white hover:border-emerald-500/40 hover:bg-emerald-500/20 hover:text-emerald-50"
                        onClick={handleUpdate}
                        disabled={form.processing}
                    >
                        Update segment
                    </Button>
                )}
                <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full border-white/15 bg-white/10 text-white hover:border-rose-500/40 hover:bg-rose-500/20"
                    onClick={handleLeave}
                    disabled={form.processing}
                >
                    Leave circle
                </Button>
            </div>
        </div>
    );
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

type InterestResource = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
};

type HashtagResource = {
    id: number;
    name: string;
    slug: string;
    usage_count: number;
};

export default function Profile({
    mustVerifyEmail,
    status,
    profile,
    interests,
    hashtags,
    circleMemberships = [],
}: {
    mustVerifyEmail: boolean;
    status?: string;
    profile: {
        username: string;
        email: string;
        display_name: string | null;
        pronouns: string | null;
        gender: string | null;
        role: number | null;
        bio: string | null;
        birthdate: string | null;
        location_city: string | null;
        location_region: string | null;
        location_country: string | null;
        interest_ids: number[];
        hashtags: string[];
    };
    interests: InterestResource[];
    hashtags: HashtagResource[];
    circleMemberships: Circle[];
}) {
    const { auth } = usePage<SharedData>().props;

    const form = useForm({
        username: profile.username,
        email: profile.email,
        display_name: profile.display_name ?? '',
        pronouns: profile.pronouns ?? '',
        gender: profile.gender ?? '',
        role: profile.role ?? 50,
        bio: profile.bio ?? '',
        birthdate: profile.birthdate ?? '',
        location_city: profile.location_city ?? '',
        location_region: profile.location_region ?? '',
        location_country: profile.location_country ?? '',
        interests: profile.interest_ids ?? [],
        hashtags: profile.hashtags ?? [],
        location_latitude: '',
        location_longitude: '',
    });

    // Invert role for display: 0 = 100% Dominant, 100 = 100% Submissive
    const displayRole = 100 - (form.data.role ?? 50);

    const [hashtagInput, setHashtagInput] = useState('');
    const [pronounOtherSelected, setPronounOtherSelected] = useState(false);
    const [locationQuery, setLocationQuery] = useState(() => {
        if (profile.location_city && profile.location_country) {
            return [
                profile.location_city,
                profile.location_region,
                profile.location_country,
            ]
                .filter(Boolean)
                .join(', ');
        }
        return '';
    });
    const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'acquired' | 'denied'>('idle');

    const selectedInterests = useMemo(() => new Set<number>(form.data.interests), [form.data.interests]);
    const limitReached = form.data.interests.length >= maxInterestSelections;

    const suggestedHashtags = useMemo(
        () =>
            hashtags
                .filter((tag) => !form.data.hashtags.includes(tag.name))
                .slice(0, 16),
        [hashtags, form.data.hashtags],
    );

    const toggleInterest = (interestId: number): void => {
        if (selectedInterests.has(interestId)) {
            form.setData(
                'interests',
                form.data.interests.filter((id) => id !== interestId),
            );
            return;
        }

        if (form.data.interests.length >= maxInterestSelections) {
            return;
        }

        form.setData('interests', [...form.data.interests, interestId]);
    };

    const addHashtag = (rawTag: string): void => {
        const normalized = normalizeHashtag(rawTag);
        if (!normalized || form.data.hashtags.includes(normalized) || form.data.hashtags.length >= maxHashtags) {
            return;
        }

        form.setData('hashtags', [...form.data.hashtags, normalized]);
        setHashtagInput('');
    };

    const removeHashtag = (tag: string): void => {
        form.setData('hashtags', form.data.hashtags.filter((value) => value !== tag));
    };

    const handleHashtagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (['Enter', 'Tab', ','].includes(event.key)) {
            event.preventDefault();
            addHashtag(hashtagInput);
        }
    };

    const handleLocationSelect = (suggestion: LocationSuggestion) => {
        form.setData({
            ...form.data,
            location_city: suggestion.city,
            location_region: suggestion.region ?? '',
            location_country: suggestion.country,
            location_latitude: suggestion.latitude,
            location_longitude: suggestion.longitude,
        });
        setLocationQuery(suggestion.label);
        setLocationStatus('acquired');
    };

    const handleLocationQueryChange = (value: string) => {
        setLocationQuery(value);
        form.setData({
            ...form.data,
            location_city: '',
            location_region: '',
            location_country: '',
            location_latitude: '',
            location_longitude: '',
        });
        setLocationStatus('idle');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Profile Overview Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(124,58,237,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/15 via-violet-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-4 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-400/30 to-violet-500/20 border border-violet-400/40 p-3 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.65)]">
                                    <User className="h-5 w-5 text-violet-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Profile information</h2>
                                    <p className="text-sm text-white/65">
                                        Update your profile details and how others see you on the platform
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.patch(ProfileController.update.url(), {
                                preserveScroll: true,
                            });
                        }}
                        className="space-y-8"
                    >
                            {(() => {
                                const processing = form.processing;
                                const recentlySuccessful = form.recentlySuccessful;
                                const errors = form.errors;
                                return (
                                <>
                                    {/* Account Information */}
                                    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_42px_120px_-60px_rgba(249,115,22,0.55)] transition-all duration-300 hover:border-amber-400/30 hover:shadow-[0_50px_120px_-60px_rgba(249,115,22,0.65)]">
                                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_60%)]" />
                                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(124,58,237,0.18),_transparent_65%)]" />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="relative space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-500/20 border border-amber-400/40 p-2.5 shadow-[0_12px_30px_-18px_rgba(249,115,22,0.65)]">
                                                    <User className="h-4 w-4 text-amber-300" />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70 font-medium">
                                                    Account
                                                </div>
                                            </div>
                                            <div className="space-y-5">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="username" className="text-sm font-medium text-white">
                                                        Username
                                                    </Label>
                                                    <Input
                                                        id="username"
                                                        value={form.data.username}
                                                        onChange={(e) => form.setData('username', e.target.value)}
                                                        name="username"
                                                        required
                                                        autoComplete="username"
                                                        placeholder="username"
                                                        minLength={3}
                                                        maxLength={30}
                                                        pattern="[A-Za-z0-9._-]+"
                                                    />
                                                    <InputError message={errors.username} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="email" className="text-sm font-medium text-white">
                                                        Email address
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={form.data.email}
                                                        onChange={(e) => form.setData('email', e.target.value)}
                                                        name="email"
                                                        required
                                                        autoComplete="email"
                                                        placeholder="Email address"
                                                    />
                                                    <InputError message={errors.email} />
                                                </div>

                                                {mustVerifyEmail &&
                                                    auth.user.email_verified_at === null && (
                                                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                                                            <p className="text-sm text-white/90">
                                                                Your email address is
                                                                unverified.{' '}
                                                                <Link
                                                                    href="/email/verification-notification"
                                                                    method="post"
                                                                    as="button"
                                                                    className="text-amber-300 underline underline-offset-4 transition-colors hover:text-amber-200"
                                                                >
                                                                    Click here to resend the
                                                                    verification email.
                                                                </Link>
                                                            </p>

                                                            {status ===
                                                                'verification-link-sent' && (
                                                                <div className="mt-2 text-sm font-medium text-emerald-400">
                                                                    A new verification link has
                                                                    been sent to your email
                                                                    address.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Information */}
                                    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_32px_85px_-40px_rgba(249,115,22,0.45)] transition-all duration-300 hover:border-violet-400/30 hover:shadow-[0_40px_100px_-40px_rgba(124,58,237,0.55)]">
                                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.15),_transparent_60%)]" />
                                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(249,115,22,0.12),_transparent_65%)]" />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="relative space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-400/30 to-violet-500/20 border border-violet-400/40 p-2.5 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.65)]">
                                                    <User className="h-4 w-4 text-violet-300" />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70 font-medium">
                                                    Profile
                                                </div>
                                            </div>
                                            <div className="space-y-5">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="display_name" className="text-sm font-medium text-white">
                                                        Display name
                                                    </Label>
                                                    <Input
                                                        id="display_name"
                                                        value={form.data.display_name}
                                                        onChange={(e) => form.setData('display_name', e.target.value)}
                                                        placeholder="How should people shout you out?"
                                                        autoComplete="name"
                                                        maxLength={150}
                                                    />
                                                    <InputError message={errors.display_name} />
                                                </div>

                                                <div className="space-y-3">
                                                    <Label htmlFor="pronouns" className="text-sm font-medium text-white">
                                                        Pronouns
                                                    </Label>
                                                    {pronounOtherSelected && (
                                                        <Input
                                                            id="pronouns"
                                                            value={form.data.pronouns}
                                                            onChange={(e) => form.setData('pronouns', e.target.value)}
                                                            placeholder="e.g. pup/handler · custom pronouns"
                                                            maxLength={100}
                                                        />
                                                    )}
                                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                                        {pronounSuggestions.map((suggestion) => {
                                                            const isSelected =
                                                                !pronounOtherSelected && form.data.pronouns.trim().toLowerCase() === suggestion;

                                                            return (
                                                                <button
                                                                    key={suggestion}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPronounOtherSelected(false);
                                                                        form.setData('pronouns', suggestion);
                                                                    }}
                                                                    className={cn(
                                                                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
                                                                        isSelected
                                                                            ? 'border-amber-400/80 bg-amber-400/10 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.65)] hover:border-amber-400/90'
                                                                            : 'border-white/20 bg-white/5 text-white/80 hover:border-white/35 hover:bg-white/10 hover:text-white',
                                                                    )}
                                                                >
                                                                    {suggestion}
                                                                </button>
                                                            );
                                                        })}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPronounOtherSelected(true);
                                                                form.setData('pronouns', '');
                                                            }}
                                                            className={cn(
                                                                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
                                                                pronounOtherSelected
                                                                    ? 'border-amber-400/80 bg-amber-400/10 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.65)] hover:border-amber-400/90'
                                                                    : 'border-white/20 bg-white/5 text-white/80 hover:border-white/35 hover:bg-white/10 hover:text-white',
                                                            )}
                                                        >
                                                            Other
                                                        </button>
                                                    </div>
                                                    <InputError message={errors.pronouns} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="gender" className="text-sm font-medium text-white">
                                                        Gender <span className="text-white/50 font-normal">(optional)</span>
                                                    </Label>
                                                    <Select
                                                        value={form.data.gender || ''}
                                                        onValueChange={(value) => form.setData('gender', value)}
                                                    >
                                                        <SelectTrigger
                                                            id="gender"
                                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10 focus:ring-amber-500/40"
                                                        >
                                                            <SelectValue placeholder="Select your gender (optional)" />
                                                        </SelectTrigger>
                                                        <SelectContent className="border-white/10 bg-black/90 text-white">
                                                            {genderOptions.map((option) => (
                                                                <SelectItem
                                                                    key={option.value}
                                                                    value={option.value}
                                                                    className="text-white focus:bg-white/10 focus:text-white"
                                                                >
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError message={errors.gender} />
                                                </div>

                                                <div className="space-y-4">
                                                    <Label htmlFor="role" className="text-sm font-medium text-white">
                                                        Role
                                                    </Label>
                                                    <div className="space-y-4">
                                                        <div className="relative py-2">
                                                            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
                                                            <div
                                                                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 will-change-[width]"
                                                                style={{
                                                                    left: '0%',
                                                                    width: `${form.data.role ?? 50}%`,
                                                                }}
                                                            />
                                                            <input
                                                                type="range"
                                                                id="role"
                                                                min="0"
                                                                max="100"
                                                                value={form.data.role ?? 50}
                                                                onChange={(e) => form.setData('role', Number(e.target.value))}
                                                                className="relative h-1.5 w-full appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-amber-400 [&::-webkit-slider-thumb]:via-rose-500 [&::-webkit-slider-thumb]:to-violet-600 [&::-webkit-slider-thumb]:shadow-[0_4px_16px_rgba(249,115,22,0.6)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:hover:border-white/40 [&::-webkit-slider-thumb]:hover:shadow-[0_6px_20px_rgba(249,115,22,0.8)] [&::-webkit-slider-thumb]:active:scale-110 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20 [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-amber-400 [&::-moz-range-thumb]:via-rose-500 [&::-moz-range-thumb]:to-violet-600 [&::-moz-range-thumb]:shadow-[0_4px_16px_rgba(249,115,22,0.6)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200"
                                                            />
                                                        </div>
                                                        <div className="flex items-end justify-between gap-2 px-1">
                                                            <div className="flex flex-col items-start gap-1.5">
                                                                <span className="text-sm font-semibold text-white">100% Dominant</span>
                                                                <span className="text-xs text-white/60">Top</span>
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1.5 pb-0.5">
                                                                <span className="text-xs font-medium text-white/80">Switch</span>
                                                                <span className="text-[0.65rem] text-white/50">{displayRole}%</span>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1.5">
                                                                <span className="text-sm font-semibold text-white">100% Submissive</span>
                                                                <span className="text-xs text-white/60">Bottom</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-white/[0.08] to-white/[0.03] px-5 py-3 backdrop-blur">
                                                            <span className="text-base font-semibold text-white">
                                                                {displayRole === 50
                                                                    ? 'Switch (50%)'
                                                                    : displayRole > 50
                                                                      ? `${displayRole}% Dominant`
                                                                      : `${100 - displayRole}% Submissive`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <InputError message={errors.role} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="bio" className="text-sm font-medium text-white">
                                                        Bio
                                                    </Label>
                                                    <RichTextEditor
                                                        value={form.data.bio}
                                                        onChange={(html) => form.setData('bio', html)}
                                                        maxLength={2500}
                                                        placeholder="Share the scenes you love, comfort zones, and what people can expect from you."
                                                    />
                                                    <InputError message={errors.bio} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location & Details */}
                                    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_32px_85px_-40px_rgba(59,130,246,0.45)] transition-all duration-300 hover:border-blue-400/30 hover:shadow-[0_40px_100px_-40px_rgba(59,130,246,0.55)]">
                                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)]" />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="relative space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/20 border border-blue-400/40 p-2.5 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.65)]">
                                                    <MapPin className="h-4 w-4 text-blue-300" />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70 font-medium">
                                                    Location & Details
                                                </div>
                                            </div>
                                            <div className="space-y-5">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="birthdate" className="text-sm font-medium text-white">
                                                        Birthdate
                                                    </Label>
                                                    <Input
                                                        id="birthdate"
                                                        type="date"
                                                        value={form.data.birthdate}
                                                        onChange={(e) => form.setData('birthdate', e.target.value)}
                                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                                    />
                                                    <InputError message={errors.birthdate} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="location_search" className="text-sm font-medium text-white">
                                                        Location
                                                    </Label>
                                                    <LocationAutocomplete
                                                        value={locationQuery}
                                                        onChange={handleLocationQueryChange}
                                                        onSelect={handleLocationSelect}
                                                        status={locationStatus}
                                                    />
                                                    <InputError message={errors.location_city || errors.location_country} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interests */}
                                    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_32px_85px_-40px_rgba(236,72,153,0.45)] transition-all duration-300 hover:border-rose-400/30 hover:shadow-[0_40px_100px_-40px_rgba(236,72,153,0.55)]">
                                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.15),_transparent_60%)]" />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="relative space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-rose-400/30 to-rose-500/20 border border-rose-400/40 p-2.5 shadow-[0_12px_30px_-18px_rgba(236,72,153,0.65)]">
                                                    <Heart className="h-4 w-4 text-rose-300" />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70 font-medium">
                                                    Interests
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-white">
                                                        Select up to {maxInterestSelections} interests ({form.data.interests.length}/{maxInterestSelections})
                                                    </Label>
                                                    {limitReached && (
                                                        <p className="text-xs text-amber-300">
                                                            Maximum reached
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                    {interests.map((interest) => {
                                                        const isSelected = selectedInterests.has(interest.id);

                                                        return (
                                                            <button
                                                                key={interest.id}
                                                                type="button"
                                                                onClick={() => toggleInterest(interest.id)}
                                                                className={cn(
                                                                    'group relative rounded-2xl border px-5 py-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40',
                                                                    isSelected
                                                                        ? 'border-amber-400/80 bg-gradient-to-br from-amber-400/15 to-amber-400/5 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)] hover:border-amber-400/90'
                                                                        : 'border-white/20 bg-white/5 hover:border-white/35 hover:bg-white/10',
                                                                )}
                                                            >
                                                                {isSelected && (
                                                                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20">
                                                                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                                                                    </div>
                                                                )}
                                                                <p className={cn(
                                                                    'pr-8 text-sm font-semibold transition-colors',
                                                                    isSelected ? 'text-white' : 'text-white group-hover:text-white/95'
                                                                )}>
                                                                    {interest.name}
                                                                </p>
                                                                {interest.description && (
                                                                    <p className={cn(
                                                                        'mt-2 text-sm leading-relaxed transition-colors',
                                                                        isSelected ? 'text-white/80' : 'text-white/70 group-hover:text-white/75'
                                                                    )}>
                                                                        {interest.description}
                                                                    </p>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <InputError message={errors.interests} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hashtags */}
                                    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_32px_85px_-40px_rgba(16,185,129,0.45)] transition-all duration-300 hover:border-emerald-400/30 hover:shadow-[0_40px_100px_-40px_rgba(16,185,129,0.55)]">
                                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_60%)]" />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="relative space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 border border-emerald-400/40 p-2.5 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.65)]">
                                                    <Hash className="h-4 w-4 text-emerald-300" />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70 font-medium">
                                                    Hashtags
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-white">
                                                        Add up to {maxHashtags} hashtags ({form.data.hashtags.length}/{maxHashtags})
                                                    </Label>
                                                    {form.data.hashtags.length >= maxHashtags && (
                                                        <p className="text-xs text-amber-300">
                                                            Maximum reached
                                                        </p>
                                                    )}
                                                </div>
                                                {form.data.hashtags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {form.data.hashtags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/15"
                                                            >
                                                                <span className="text-white/90">#{tag}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeHashtag(tag)}
                                                                    className="flex items-center justify-center rounded-full p-0.5 text-white/60 transition-all hover:bg-white/20 hover:text-white"
                                                                    aria-label={`Remove hashtag ${tag}`}
                                                                >
                                                                    <X className="size-3.5" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 transition-all focus-within:border-white/35 focus-within:bg-white/10">
                                                    <input
                                                        type="text"
                                                        value={hashtagInput}
                                                        onChange={(event) => setHashtagInput(event.target.value)}
                                                        onKeyDown={handleHashtagKeyDown}
                                                        placeholder={form.data.hashtags.length === 0 ? "#ropephoria" : ""}
                                                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition-all hover:border-white/35 hover:bg-white/15 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                                        onClick={() => addHashtag(hashtagInput)}
                                                        disabled={hashtagInput.trim() === '' || form.data.hashtags.length >= maxHashtags}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                                {suggestedHashtags.length > 0 && (
                                                    <div className="space-y-3">
                                                        <p className="text-xs uppercase tracking-[0.35em] text-white/70 font-medium">Popular this week</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {suggestedHashtags.map((tag) => (
                                                                <button
                                                                    key={tag.id}
                                                                    type="button"
                                                                    onClick={() => addHashtag(tag.name)}
                                                                    disabled={form.data.hashtags.length >= maxHashtags}
                                                                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-all hover:border-white/35 hover:bg-white/15 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/20 disabled:hover:bg-white/10"
                                                                >
                                                                    #{tag.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <InputError message={errors.hashtags ?? errors['hashtags.0']} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-4">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                            className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(249,115,22,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {processing ? 'Saving...' : 'Save changes'}
                                        </Button>

                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0 scale-95"
                                            enterTo="opacity-100 scale-100"
                                            leave="transition ease-in-out"
                                            leaveFrom="opacity-100 scale-100"
                                            leaveTo="opacity-0 scale-95"
                                        >
                                            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <p className="text-sm font-medium text-emerald-300">
                                                    Saved
                                                </p>
                                            </div>
                                        </Transition>
                                    </div>
                                </>
                                );
                            })()}
                    </form>

                    {/* Circle Memberships Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(59,130,246,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/15 via-blue-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/20 border border-blue-400/40 p-3 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.65)]">
                                    <Hash className="h-5 w-5 text-blue-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Circle memberships</h2>
                                    <p className="text-sm text-white/65">
                                        Manage the communities you joined through onboarding
                                    </p>
                                </div>
                            </div>

                            {circleMemberships.length === 0 ? (
                                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-sm text-white/70">
                                    <p>
                                        You haven't joined any circles yet. Select interests during onboarding or browse the{' '}
                                        <Link
                                            href={circlesRoutes.index.url()}
                                            className="text-blue-300 underline underline-offset-4 transition hover:text-blue-200"
                                        >
                                            circle directory
                                        </Link>{' '}
                                        to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {circleMemberships.map((circle) => (
                                        <CircleMembershipCard key={circle.id} circle={circle} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
