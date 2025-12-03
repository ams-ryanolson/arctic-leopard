import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import CoverGradient from '@/components/cover-gradient';
import MediaUploader from '@/components/media/MediaUploader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import OnboardingLayout from '@/layouts/onboarding-layout';
import onboardingRoutes from '@/routes/onboarding';
import { ArrowLeft, ArrowRight, Camera, Loader2 } from 'lucide-react';

type MediaProfile = {
    display_name: string | null;
    username: string | null;
    pronouns: string | null;
    bio: string | null;
    age: number | null;
    location_city: string | null;
    location_region: string | null;
    location_country: string | null;
    hashtags: string[];
    interests: string[];
    avatar_path: string | null;
    avatar_url: string | null;
    cover_path: string | null;
    cover_url: string | null;
};

type MediaSetupProps = {
    profile: MediaProfile;
};

export default function MediaSetup({ profile }: MediaSetupProps) {
    const initialCoverPreview = profile.cover_url ?? '';
    const initialAvatarPreview = profile.avatar_url ?? '';

    const [coverPreview, setCoverPreview] =
        useState<string>(initialCoverPreview);
    const [avatarPreview, setAvatarPreview] =
        useState<string>(initialAvatarPreview);
    const [coverUploading, setCoverUploading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [_coverFile, setCoverFile] = useState<File | null>(null);
    const [_avatarFile, setAvatarFile] = useState<File | null>(null);

    const form = useForm({
        avatar_upload_id: '',
        cover_upload_id: '',
    });
    const { setData, processing, put, setError, clearErrors, errors } = form;

    const preferredLocation = useMemo(() => {
        const parts = [
            profile.location_region,
            profile.location_country,
        ].filter(Boolean);

        return parts.join(', ');
    }, [profile.location_region, profile.location_country]);

    const handleCoverUploadComplete = (identifiers: string[]) => {
        if (identifiers.length > 0) {
            setData('cover_upload_id', identifiers[0]);
            setCoverUploading(false);
            clearErrors('cover_upload_id');
        }
    };

    const handleCoverUploadError = (error: string) => {
        setError('cover_upload_id', error);
        setCoverUploading(false);
        setCoverFile(null);
        setCoverPreview(initialCoverPreview);
    };

    const handleCoverFileSelect = (file: File) => {
        setCoverFile(file);
        setCoverUploading(true);
        clearErrors('cover_upload_id');
        const objectUrl = URL.createObjectURL(file);
        setCoverPreview(objectUrl);
    };

    const handleAvatarUploadComplete = (identifiers: string[]) => {
        if (identifiers.length > 0) {
            setData('avatar_upload_id', identifiers[0]);
            setAvatarUploading(false);
            clearErrors('avatar_upload_id');
        }
    };

    const handleAvatarUploadError = (error: string) => {
        setError('avatar_upload_id', error);
        setAvatarUploading(false);
        setAvatarFile(null);
        setAvatarPreview(initialAvatarPreview);
    };

    const handleAvatarFileSelect = (file: File) => {
        setAvatarFile(file);
        setAvatarUploading(true);
        clearErrors('avatar_upload_id');
        const objectUrl = URL.createObjectURL(file);
        setAvatarPreview(objectUrl);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('[Media] Submitting form', {
            avatar_upload_id: form.data.avatar_upload_id,
            cover_upload_id: form.data.cover_upload_id,
            allData: form.data,
            hasAvatar: !!form.data.avatar_upload_id,
            hasCover: !!form.data.cover_upload_id,
        });

        if (!form.data.avatar_upload_id && !form.data.cover_upload_id) {
            console.warn('[Media] No upload IDs to submit - skipping');
            // Still submit to allow continuing without media
        }

        put(onboardingRoutes.media.update.url(), {
            onStart: () => {
                console.log('[Media] Form submission started');
            },
            onSuccess: () => {
                console.log('[Media] Form submission successful');
            },
            onError: (errors) => {
                console.error('[Media] Form submission error', errors);
            },
            onFinish: () => {
                console.log('[Media] Form submission finished');
            },
        });
    };

    const coverButtonLabel = coverPreview ? 'Change cover' : 'Upload cover';
    const avatarButtonLabel = avatarPreview ? 'Change photo' : 'Upload photo';

    return (
        <OnboardingLayout
            currentStep="media"
            eyebrow="Onboarding"
            title="Add visuals that feel like you"
            description="Your photo and cover help friends recognise you across the network. Full controls are coming soon—think of this as a guided preview of where everything will live."
        >
            <Head title="Media setup" />

            <form className="space-y-8" onSubmit={submit}>
                <div className="space-y-6 text-white">
                    <div className="rounded-3xl border border-white/15 bg-black/30">
                        <div className="relative h-48 w-full overflow-hidden rounded-t-3xl md:h-56">
                            {coverPreview ? (
                                <div
                                    className="h-full w-full bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${coverPreview})`,
                                    }}
                                />
                            ) : (
                                <CoverGradient className="h-full w-full" />
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-black/20" />
                            {coverUploading && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <Loader2 className="size-8 animate-spin text-white" />
                                </div>
                            )}
                            <div className="absolute inset-0">
                                <MediaUploader
                                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                    maxFiles={1}
                                    multiple={false}
                                    onUploadComplete={handleCoverUploadComplete}
                                    onError={handleCoverUploadError}
                                    onFileSelect={handleCoverFileSelect}
                                    disabled={coverUploading || processing}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                            </div>
                            <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-4">
                                <div className="pointer-events-auto">
                                    <MediaUploader
                                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                        maxFiles={1}
                                        multiple={false}
                                        onUploadComplete={
                                            handleCoverUploadComplete
                                        }
                                        onError={handleCoverUploadError}
                                        onFileSelect={handleCoverFileSelect}
                                        disabled={coverUploading || processing}
                                    >
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs text-white shadow-[0_12px_28px_-16px_rgba(249,115,22,0.55)] transition hover:border-white/35 hover:bg-white/20"
                                            disabled={
                                                coverUploading || processing
                                            }
                                        >
                                            <Camera className="size-4" />
                                            <span className="max-w-[140px] truncate">
                                                {coverButtonLabel}
                                            </span>
                                        </Button>
                                    </MediaUploader>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8">
                            <div className="-mt-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="flex items-end gap-4">
                                    <div className="relative -mt-2 h-28 w-28 overflow-hidden rounded-3xl border-4 border-neutral-950 shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)]">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt={
                                                    profile.display_name ??
                                                    'Profile avatar'
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-neutral-800" />
                                        )}
                                        {avatarUploading && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                <Loader2 className="size-6 animate-spin text-white" />
                                            </div>
                                        )}
                                        <MediaUploader
                                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                            maxFiles={1}
                                            multiple={false}
                                            onUploadComplete={
                                                handleAvatarUploadComplete
                                            }
                                            onError={handleAvatarUploadError}
                                            onFileSelect={
                                                handleAvatarFileSelect
                                            }
                                            disabled={
                                                avatarUploading || processing
                                            }
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />
                                        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
                                            <MediaUploader
                                                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                                maxFiles={1}
                                                multiple={false}
                                                onUploadComplete={
                                                    handleAvatarUploadComplete
                                                }
                                                onError={
                                                    handleAvatarUploadError
                                                }
                                                onFileSelect={
                                                    handleAvatarFileSelect
                                                }
                                                disabled={
                                                    avatarUploading ||
                                                    processing
                                                }
                                            >
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs text-white transition hover:border-white/35 hover:bg-white/20"
                                                    disabled={
                                                        avatarUploading ||
                                                        processing
                                                    }
                                                >
                                                    <Camera className="size-3.5" />
                                                    <span className="max-w-[120px] truncate">
                                                        {avatarButtonLabel}
                                                    </span>
                                                </Button>
                                            </MediaUploader>
                                        </div>
                                    </div>
                                    <div className="space-y-1 pt-4 text-white">
                                        <h1 className="text-2xl leading-tight font-semibold">
                                            {profile.display_name ??
                                                'Your display name'}
                                        </h1>
                                        <p className="text-xs tracking-[0.2em] text-white/50 uppercase">
                                            @{profile.username ?? 'username'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 text-sm text-white/70 lg:mb-5 lg:items-end lg:self-end">
                                    <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.35em] text-white/55 uppercase">
                                        {preferredLocation && (
                                            <span>{preferredLocation}</span>
                                        )}
                                        {preferredLocation &&
                                            profile.pronouns && (
                                                <span className="text-white/45">
                                                    •
                                                </span>
                                            )}
                                        {profile.pronouns && (
                                            <span>{profile.pronouns}</span>
                                        )}
                                    </div>
                                    {profile.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            {profile.interests
                                                .slice(0, 4)
                                                .map((interest) => (
                                                    <Badge
                                                        key={interest}
                                                        className="rounded-full border-white/20 bg-white/10 text-xs text-white/70"
                                                    >
                                                        {interest}
                                                    </Badge>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Separator className="my-6 border-white/10" />
                            <div className="space-y-4 text-sm text-white/70">
                                <div
                                    className="[&_br]:block [&_p:not(:first-child)]:mt-3 [&_s]:line-through [&_strong]:font-semibold [&_u]:underline"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            profile.bio ??
                                            '<p>Share a short intro, your approach to scenes, and what you’re excited to create.</p>',
                                    }}
                                />
                                {profile.hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.hashtags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="rounded-full border-white/20 bg-white/5 text-xs text-white/60"
                                            >
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.avatar_upload_id && (
                                <p className="mt-4 text-sm text-rose-400">
                                    {errors.avatar_upload_id}
                                </p>
                            )}
                        </div>
                        {errors.cover_upload_id && (
                            <p className="px-6 pb-4 text-sm text-rose-400 sm:px-8">
                                {errors.cover_upload_id}
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.08] to-white/[0.03] px-5 py-5 backdrop-blur sm:px-6 sm:py-6">
                        <p className="text-sm font-semibold text-white sm:text-base">
                            Cover & avatar checklist
                        </p>
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:gap-6">
                            <div className="space-y-3">
                                <p className="text-xs font-medium tracking-[0.35em] text-white/70 uppercase">
                                    Cover image
                                </p>
                                <ul className="space-y-2 text-sm leading-relaxed text-white/75">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 flex-shrink-0 text-amber-400">
                                            •
                                        </span>
                                        <span>
                                            1600×900 works best for large
                                            screens.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 flex-shrink-0 text-amber-400">
                                            •
                                        </span>
                                        <span>
                                            Keep the focal point centered — we
                                            crop for mobile automatically.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 flex-shrink-0 text-amber-400">
                                            •
                                        </span>
                                        <span>
                                            Avoid heavy compression so gradients
                                            and shadows stay crisp.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <p className="text-xs font-medium tracking-[0.35em] text-white/70 uppercase">
                                    Profile photo
                                </p>
                                <ul className="space-y-2 text-sm leading-relaxed text-white/75">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 flex-shrink-0 text-amber-400">
                                            •
                                        </span>
                                        <span>
                                            Use a square crop; we'll round the
                                            edges with a frame.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 flex-shrink-0 text-amber-400">
                                            •
                                        </span>
                                        <span>
                                            High-contrast lighting keeps you
                                            recognisable in small thumbnails.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 flex-shrink-0 text-amber-400">
                                            •
                                        </span>
                                        <span>
                                            You can swap this anytime from your
                                            dashboard.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-relaxed text-white/70 sm:text-base">
                            We store originals privately and optimise copies for
                            feed, preview cards, and live sessions. You always
                            control who sees what.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        variant="secondary"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/15"
                        type="button"
                        asChild
                    >
                        <Link href={onboardingRoutes.profile.url()}>
                            <ArrowLeft className="size-4" /> Back
                        </Link>
                    </Button>
                    <Button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01]"
                        disabled={
                            processing || coverUploading || avatarUploading
                        }
                    >
                        Continue to follow suggestions
                        <ArrowRight className="size-4" />
                    </Button>
                </div>
            </form>
        </OnboardingLayout>
    );
}
