import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, PenLine, Stars, X } from 'lucide-react';

import InputError from '@/components/input-error';
import RichTextEditor from '@/components/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        bio: string | null;
        interest_ids: number[];
        hashtags: string[];
    };
    interests: InterestResource[];
    hashtags: HashtagResource[];
};

const maxInterestSelections = 5;
const maxHashtags = 20;

const personaPrompts = [
    'How do you like people to greet you?',
    'What kind of energy or roles feel natural for you?',
    'What aftercare or check-ins help you feel grounded?',
];

const pronounSuggestions = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they'];

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
        bio: profile.bio ?? '',
        interests: profile.interest_ids ?? [],
        hashtags: profile.hashtags ?? [],
    });

    const [hashtagInput, setHashtagInput] = useState('');

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

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_42px_120px_-60px_rgba(249,115,22,0.55)]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_60%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(124,58,237,0.18),_transparent_65%)]" />

                    <div className="relative space-y-6">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
                            <PenLine className="size-4" />
                            Persona setup
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="display_name">Display name</Label>
                                    <Input
                                        id="display_name"
                                        value={data.display_name}
                                        onChange={(event) => setData('display_name', event.target.value)}
                                        placeholder="How should people shout you out?"
                                        autoComplete="name"
                                        maxLength={150}
                                    />
                                    <InputError message={errors.display_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pronouns">Pronouns</Label>
                                    <Input
                                        id="pronouns"
                                        value={data.pronouns}
                                        onChange={(event) => setData('pronouns', event.target.value)}
                                        placeholder="e.g. he/him · they/them · pup/handler"
                                        maxLength={100}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {pronounSuggestions.map((suggestion) => {
                                            const isSelected =
                                                data.pronouns.trim().toLowerCase() === suggestion;

                                            return (
                                                <button
                                                    key={suggestion}
                                                    type="button"
                                                    onClick={() => setData('pronouns', suggestion)}
                                                    className={cn(
                                                        'rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
                                                        isSelected
                                                            ? 'border-amber-400/80 bg-amber-400/10 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.65)]'
                                                            : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white',
                                                    )}
                                                >
                                                    {suggestion}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.pronouns} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
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

                            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-5 text-xs text-white/60 backdrop-blur">
                                <p className="text-sm font-semibold text-white">Profile basics walkthrough</p>
                                <div className="space-y-3 text-white/65">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">Display name</p>
                                        <p className="mt-1 leading-relaxed">
                                            This is what shows up across dashboards, search, and follow prompts. Choose a handle that feels safe and recognisable. You can change it later.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">Pronouns & vibe</p>
                                        <p className="mt-1 leading-relaxed">
                                            Setting pronouns helps others address you correctly in scenes and messages. Click a suggestion to auto-fill or type something custom.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">Bio essentials</p>
                                        <p className="mt-1 leading-relaxed">
                                            Share what lights you up, what boundaries matter, and how people can collaborate with you. Highlight key points with bold or underline. Max 2,500 characters.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">Need inspiration?</p>
                                        <ul className="mt-1 grid gap-1.5 leading-relaxed">
                                            {personaPrompts.map((prompt) => (
                                                <li key={prompt}>• {prompt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_36px_110px_-58px_rgba(99,102,241,0.45)]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.18),_transparent_60%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(244,114,182,0.16),_transparent_65%)]" />

                    <div className="relative space-y-6">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
                                <Stars className="size-4" />
                                Interests ({data.interests.length}/{maxInterestSelections})
                            </div>
                        </div>
                        <p className="text-sm text-white/70">
                            Choose up to {maxInterestSelections} focus areas. These help power recommendations and who we introduce you to first.
                        </p>
                        {limitReached && (
                            <p className="text-xs font-semibold text-amber-300">
                                You’ve reached the maximum of {maxInterestSelections} interests. Remove one to add another.
                            </p>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {interests.map((interest) => {
                                const isSelected = selectedInterests.has(interest.id);

                                return (
                                    <button
                                        key={interest.id}
                                        type="button"
                                        onClick={() => toggleInterest(interest.id)}
                                        className={cn(
                                            'rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-500/40',
                                            isSelected
                                                ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)]'
                                                : 'border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10',
                                        )}
                                    >
                                        <p className="text-sm font-semibold text-white">{interest.name}</p>
                                        {interest.description && (
                                            <p className="mt-2 text-xs text-white/60">{interest.description}</p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={errors.interests} />
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_36px_110px_-58px_rgba(99,102,241,0.45)]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_60%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(96,165,250,0.22),_transparent_65%)]" />

                    <div className="relative space-y-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
                                <Stars className="size-4" />
                                Hashtags ({data.hashtags.length}/{maxHashtags})
                            </div>
                            <p className="text-xs text-white/60 sm:text-right">
                                Hashtags are discoverable—add unique niches or align with trending topics.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                                {data.hashtags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => removeHashtag(tag)}
                                            className="text-white/70 transition hover:text-white"
                                            aria-label={`Remove hashtag ${tag}`}
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={hashtagInput}
                                    onChange={(event) => setHashtagInput(event.target.value)}
                                    onKeyDown={handleHashtagKeyDown}
                                    placeholder="#ropephoria"
                                    className="flex-1 min-w-[140px] bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-full border border-white/15 bg-white/5 text-xs text-white transition hover:border-white/35 hover:bg-white/15"
                                    onClick={() => addHashtag(hashtagInput)}
                                    disabled={hashtagInput.trim() === '' || data.hashtags.length >= maxHashtags}
                                >
                                    Add
                                </Button>
                            </div>
                            <InputError message={errors.hashtags ?? errors['hashtags.0']} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Popular this week</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedHashtags.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        className="cursor-pointer rounded-full border border-white/15 bg-white/10 text-xs text-white/80 transition hover:border-white/35 hover:bg-white/15"
                                        onClick={() => addHashtag(tag.name)}
                                    >
                                        #{tag.name}
                                    </Badge>
                                ))}
                                {suggestedHashtags.length === 0 && (
                                    <span className="text-xs text-white/55">You’ve added every trending tag we suggested.</span>
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
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/15"
                    >
                        <Link href={onboardingRoutes.start.url()}>
                            <ArrowLeft className="size-4" /> Back
                        </Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01] disabled:opacity-60"
                    >
                        Continue to media setup
                        <ArrowRight className="size-4" />
                    </Button>
                </div>
            </form>
        </OnboardingLayout>
    );
}