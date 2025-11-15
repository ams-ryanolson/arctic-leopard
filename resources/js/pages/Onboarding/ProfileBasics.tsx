import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, PenLine, Stars, X } from 'lucide-react';

import InputError from '@/components/input-error';
import RichTextEditor from '@/components/rich-text-editor';
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
import { cn } from '@/lib/utils';
import OnboardingLayout from '@/layouts/onboarding-layout';
import onboardingRoutes from '@/routes/onboarding';

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

type ProfileBasicsProps = {
    profile: {
        display_name: string | null;
        pronouns: string | null;
        gender: string | null;
        role: number | null;
        bio: string | null;
        interest_ids: number[];
        hashtags: string[];
    };
    interests: InterestResource[];
    hashtags: HashtagResource[];
};

const maxInterestSelections = 5;
const maxHashtags = 5;

const personaPrompts = [
    'How do you like people to greet you?',
    'What kind of energy or roles feel natural for you?',
    'What aftercare or check-ins help you feel grounded?',
];

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

const normalizeHashtag = (value: string): string | null => {
    const cleaned = value.replace('#', '').trim().toLowerCase();
    const safe = cleaned.replace(/[^a-z0-9._-]/g, '');

    if (safe.length === 0) {
        return null;
    }

    return safe.slice(0, 60);
};

export default function ProfileBasics({ profile, interests, hashtags }: ProfileBasicsProps) {
    const {
        data,
        setData,
        errors,
        processing,
        transform,
        put,
    } = useForm({
        display_name: profile.display_name ?? '',
        pronouns: profile.pronouns ?? '',
        gender: profile.gender ?? '',
        role: profile.role ?? 50,
        bio: profile.bio ?? '',
        interests: profile.interest_ids ?? [],
        hashtags: profile.hashtags ?? [],
    });

    // Invert role for display: 0 = 100% Dominant, 100 = 100% Submissive
    const displayRole = 100 - data.role;

    const [hashtagInput, setHashtagInput] = useState('');
    const [pronounOtherSelected, setPronounOtherSelected] = useState(false);

    const selectedInterests = useMemo(() => new Set<number>(data.interests), [data.interests]);
    const limitReached = data.interests.length >= maxInterestSelections;

    const suggestedHashtags = useMemo(
        () =>
            hashtags
                .filter((tag) => !data.hashtags.includes(tag.name))
                .slice(0, 16),
        [hashtags, data.hashtags],
    );

    const toggleInterest = (interestId: number): void => {
        if (selectedInterests.has(interestId)) {
            setData(
                'interests',
                data.interests.filter((id) => id !== interestId),
            );
            return;
        }

        if (data.interests.length >= maxInterestSelections) {
            return;
        }

        setData('interests', [...data.interests, interestId]);
    };

    const addHashtag = (rawTag: string): void => {
        const normalized = normalizeHashtag(rawTag);
        if (! normalized || data.hashtags.includes(normalized) || data.hashtags.length >= maxHashtags) {
            return;
        }

        setData('hashtags', [...data.hashtags, normalized]);
        setHashtagInput('');
    };

    const removeHashtag = (tag: string): void => {
        setData('hashtags', data.hashtags.filter((value) => value !== tag));
    };

    const handleHashtagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (['Enter', 'Tab', ','].includes(event.key)) {
            event.preventDefault();
            addHashtag(hashtagInput);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform((current) => ({
            ...current,
            display_name: current.display_name.trim(),
            pronouns: current.pronouns?.trim() || null,
            gender: current.gender?.trim() || null,
            role: current.role ?? null,
            bio: current.bio?.trim() || null,
        }));

        put(onboardingRoutes.profile.update.url(), {
            preserveScroll: true,
            onFinish: () => {
                transform((current) => current);
            },
        });
    };

    return (
        <OnboardingLayout
            currentStep="profile"
            eyebrow="Onboarding"
            title="Dial in how people experience you"
            description="Introduce yourself the way you want to be seen. These fields help friends, circles, and future collaborators understand your vibe and how to care for you."
        >
            <Head title="Profile basics" />

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-white shadow-[0_42px_120px_-60px_rgba(249,115,22,0.55)] sm:px-6 sm:py-7">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_60%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(124,58,237,0.18),_transparent_65%)]" />

                    <div className="relative space-y-5 sm:space-y-6">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70">
                            <PenLine className="size-3.5 sm:size-4" />
                            Persona setup
                        </div>
                        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
                            <div className="space-y-5 sm:space-y-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="display_name" className="text-sm font-medium text-white">Display name</Label>
                                    <Input
                                        id="display_name"
                                        value={data.display_name}
                                        onChange={(event) => setData('display_name', event.target.value)}
                                        placeholder="How should people shout you out?"
                                        autoComplete="name"
                                        maxLength={150}
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10"
                                    />
                                    <InputError message={errors.display_name} />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="pronouns" className="text-sm font-medium text-white">Pronouns</Label>
                                    {pronounOtherSelected && (
                                        <Input
                                            id="pronouns"
                                            value={data.pronouns}
                                            onChange={(event) => setData('pronouns', event.target.value)}
                                            placeholder="e.g. pup/handler · custom pronouns"
                                            maxLength={100}
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10"
                                        />
                                    )}
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                        {pronounSuggestions.map((suggestion) => {
                                            const isSelected =
                                                !pronounOtherSelected && data.pronouns.trim().toLowerCase() === suggestion;

                                            return (
                                                <button
                                                    key={suggestion}
                                                    type="button"
                                                    onClick={() => {
                                                        setPronounOtherSelected(false);
                                                        setData('pronouns', suggestion);
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
                                                setData('pronouns', '');
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
                                <div className="space-y-2.5">
                                    <Label htmlFor="gender" className="text-sm font-medium text-white">
                                        Gender <span className="text-white/50 font-normal">(optional)</span>
                                    </Label>
                                    <Select
                                        value={data.gender || ''}
                                        onValueChange={(value) => setData('gender', value)}
                                    >
                                        <SelectTrigger
                                            id="gender"
                                            className="h-auto w-full border-white/20 bg-white/5 py-2.5 text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/10 focus:ring-amber-500/40"
                                        >
                                            <SelectValue placeholder="Select your gender (optional)" />
                                        </SelectTrigger>
                                        <SelectContent className="border-white/20 bg-neutral-900 text-white">
                                            {genderOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="focus:bg-white/10 focus:text-white"
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.gender} />
                                </div>
                                <div className="space-y-4">
                                    <Label htmlFor="role" className="text-sm font-medium text-white">Role</Label>
                                    <div className="space-y-4">
                                        <div className="relative py-2">
                                            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
                                            <div
                                                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 will-change-[width]"
                                                style={{
                                                    left: '0%',
                                                    width: `${data.role}%`,
                                                }}
                                            />
                                            <input
                                                type="range"
                                                id="role"
                                                min="0"
                                                max="100"
                                                value={data.role}
                                                onChange={(e) => setData('role', Number(e.target.value))}
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
                                <div className="space-y-2.5">
                                    <Label htmlFor="bio" className="text-sm font-medium text-white">Bio</Label>
                                    <RichTextEditor
                                        value={data.bio}
                                        onChange={(html) => setData('bio', html)}
                                        maxLength={2500}
                                        placeholder="Share the scenes you love, comfort zones, and what people can expect from you."
                                        className="mt-1"
                                    />
                                    <InputError message={errors.bio} />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.08] to-white/[0.03] px-4 py-5 backdrop-blur sm:px-5 sm:py-6">
                                <p className="text-sm font-semibold text-white sm:text-base">Profile basics walkthrough</p>
                                <div className="space-y-4 text-sm text-white/75 sm:space-y-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60 font-medium">Display name</p>
                                        <p className="mt-1.5 leading-relaxed text-sm">
                                            This is what shows up across dashboards, search, and follow prompts. Choose a handle that feels safe and recognisable. You can change it later.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60 font-medium">Pronouns & vibe</p>
                                        <p className="mt-1.5 leading-relaxed text-sm">
                                            Setting pronouns helps others address you correctly in scenes and messages. Click a suggestion to auto-fill or type something custom.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60 font-medium">Gender</p>
                                        <p className="mt-1.5 leading-relaxed text-sm">
                                            Share how you identify. This helps others understand and respect your identity in the community.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60 font-medium">Role</p>
                                        <p className="mt-1.5 leading-relaxed text-sm">
                                            Indicate your preferred role on the spectrum from submissive to dominant. This helps match you with compatible partners and scenes.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60 font-medium">Bio essentials</p>
                                        <p className="mt-1.5 leading-relaxed text-sm">
                                            Share what lights you up, what boundaries matter, and how people can collaborate with you. Highlight key points with bold or underline. Max 2,500 characters.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60 font-medium">Need inspiration?</p>
                                        <ul className="mt-1.5 grid gap-2 leading-relaxed text-sm">
                                            {personaPrompts.map((prompt) => (
                                                <li key={prompt} className="flex items-start gap-2">
                                                    <span className="text-amber-400 mt-0.5">•</span>
                                                    <span>{prompt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-white shadow-[0_36px_110px_-58px_rgba(99,102,241,0.45)] sm:px-6 sm:py-7">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.18),_transparent_60%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(244,114,182,0.16),_transparent_65%)]" />

                    <div className="relative space-y-5 sm:space-y-6">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70">
                                <Stars className="size-3.5 sm:size-4" />
                                Interests ({data.interests.length}/{maxInterestSelections})
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-white/75 sm:text-base">
                            Choose up to {maxInterestSelections} focus areas. These help power recommendations and who we introduce you to first.
                        </p>
                        {limitReached && (
                            <p className="text-sm font-semibold text-amber-300 sm:text-base">
                                You've reached the maximum of {maxInterestSelections} interests. Remove one to add another.
                            </p>
                        )}

                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {interests.map((interest) => {
                                const isSelected = selectedInterests.has(interest.id);

                                return (
                                    <button
                                        key={interest.id}
                                        type="button"
                                        onClick={() => toggleInterest(interest.id)}
                                        className={cn(
                                            'group relative rounded-2xl border px-5 py-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 sm:px-6 sm:py-5',
                                            isSelected
                                                ? 'border-amber-400/80 bg-gradient-to-br from-amber-400/15 to-amber-400/5 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)] hover:border-amber-400/90 hover:shadow-[0_28px_65px_-25px_rgba(249,115,22,0.75)] hover:scale-[1.02]'
                                                : 'border-white/20 bg-white/5 hover:border-white/35 hover:bg-white/10 hover:scale-[1.01]',
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20">
                                                <div className="h-2 w-2 rounded-full bg-amber-400" />
                                            </div>
                                        )}
                                        <p className={cn(
                                            'pr-8 text-sm font-semibold transition-colors sm:text-base',
                                            isSelected ? 'text-white' : 'text-white group-hover:text-white/95'
                                        )}>
                                            {interest.name}
                                        </p>
                                        {interest.description && (
                                            <p className={cn(
                                                'mt-2 text-sm leading-relaxed transition-colors sm:text-sm',
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

                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-white shadow-[0_36px_110px_-58px_rgba(99,102,241,0.45)] sm:px-6 sm:py-7">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_60%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(96,165,250,0.22),_transparent_65%)]" />

                    <div className="relative space-y-5 sm:space-y-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70">
                                <Stars className="size-3.5 sm:size-4" />
                                Hashtags ({data.hashtags.length}/{maxHashtags})
                            </div>
                            <p className="text-sm leading-relaxed text-white/70 sm:text-right sm:text-base">
                                Hashtags are discoverable—add unique niches or align with trending topics.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {data.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {data.hashtags.map((tag) => (
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
                                    placeholder={data.hashtags.length === 0 ? "#ropephoria" : ""}
                                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition-all hover:border-white/35 hover:bg-white/15 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={() => addHashtag(hashtagInput)}
                                    disabled={hashtagInput.trim() === '' || data.hashtags.length >= maxHashtags}
                                >
                                    Add
                                </Button>
                            </div>
                            {data.hashtags.length >= maxHashtags && (
                                <p className="text-xs font-medium text-amber-300">
                                    You've reached the maximum of {maxHashtags} hashtags. Remove one to add another.
                                </p>
                            )}
                            <InputError message={errors.hashtags ?? errors['hashtags.0']} />
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/70 font-medium">Popular this week</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedHashtags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => addHashtag(tag.name)}
                                        disabled={data.hashtags.length >= maxHashtags}
                                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-all hover:border-white/35 hover:bg-white/15 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/20 disabled:hover:bg-white/10"
                                    >
                                        #{tag.name}
                                    </button>
                                ))}
                                {suggestedHashtags.length === 0 && (
                                    <span className="text-sm text-white/65">You've added every trending tag we suggested.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        asChild
                        type="button"
                        variant="secondary"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm text-white transition hover:bg-white/15 sm:text-base"
                    >
                        <Link href={onboardingRoutes.start.url()}>
                            <ArrowLeft className="size-4" /> Back
                        </Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01] disabled:opacity-60 sm:text-base"
                    >
                        Continue to media setup
                        <ArrowRight className="size-4" />
                    </Button>
                </div>
            </form>
        </OnboardingLayout>
    );
}