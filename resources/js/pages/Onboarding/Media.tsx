import { Head, Link, useForm } from '@inertiajs/react';
import type { FilePond as FilePondInstance, FilePondFile, FilePondErrorDescription } from 'filepond';
import { useEffect, useMemo, useRef, useState } from 'react';

import FilePondUploader from '@/components/filepond-uploader';
import CoverGradient from '@/components/cover-gradient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

    const [coverPreview, setCoverPreview] = useState<string>(initialCoverPreview);
    const [avatarPreview, setAvatarPreview] = useState<string>(initialAvatarPreview);
    const [coverUploading, setCoverUploading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);

    const coverObjectUrl = useRef<string | null>(null);
    const avatarObjectUrl = useRef<string | null>(null);

    const coverPond = useRef<FilePondInstance | null>(null);
    const avatarPond = useRef<FilePondInstance | null>(null);

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

    const updatePreviewFromFile = (file: File, type: 'cover' | 'avatar') => {
        const objectUrl = URL.createObjectURL(file);

        if (type === 'cover') {
            if (coverObjectUrl.current) {
                URL.revokeObjectURL(coverObjectUrl.current);
            }

            coverObjectUrl.current = objectUrl;
            setCoverPreview(objectUrl);
        } else {
            if (avatarObjectUrl.current) {
                URL.revokeObjectURL(avatarObjectUrl.current);
            }

            avatarObjectUrl.current = objectUrl;
            setAvatarPreview(objectUrl);
        }
    };

    const resetCoverPreview = () => {
        if (coverObjectUrl.current) {
            URL.revokeObjectURL(coverObjectUrl.current);
            coverObjectUrl.current = null;
        }

        setCoverPreview(initialCoverPreview);
    };

    const resetAvatarPreview = () => {
        if (avatarObjectUrl.current) {
            URL.revokeObjectURL(avatarObjectUrl.current);
            avatarObjectUrl.current = null;
        }

        setAvatarPreview(initialAvatarPreview);
    };

    useEffect(() => {
        return () => {
            if (coverObjectUrl.current) {
                URL.revokeObjectURL(coverObjectUrl.current);
            }

            if (avatarObjectUrl.current) {
                URL.revokeObjectURL(avatarObjectUrl.current);
            }
        };
    }, []);

    const handleCoverProcessed = (file: FilePondFile) => {
        const serverId = typeof file.serverId === 'string' ? file.serverId : '';
        setData('cover_upload_id', serverId);
        setCoverUploading(false);
        clearErrors('cover_upload_id');

        if (file.file) {
            updatePreviewFromFile(file.file, 'cover');
        }
    };

    const handleAvatarProcessed = (file: FilePondFile) => {
        const serverId = typeof file.serverId === 'string' ? file.serverId : '';
        setData('avatar_upload_id', serverId);
        setAvatarUploading(false);
        clearErrors('avatar_upload_id');

        if (file.file) {
            updatePreviewFromFile(file.file, 'avatar');
        }
    };

    const handleCoverRemoved = () => {
        setData('cover_upload_id', '');
        setCoverUploading(false);
        clearErrors('cover_upload_id');
        resetCoverPreview();
    };

    const handleAvatarRemoved = () => {
        setData('avatar_upload_id', '');
        setAvatarUploading(false);
        clearErrors('avatar_upload_id');
        resetAvatarPreview();
    };

    const handleCoverUploadError = (error: FilePondErrorDescription) => {
        setCoverUploading(false);
        setError('cover_upload_id', error.body ?? error.main ?? 'Cover upload failed. Please try again.');
    };

    const handleAvatarUploadError = (error: FilePondErrorDescription) => {
        setAvatarUploading(false);
        setError('avatar_upload_id', error.body ?? error.main ?? 'Profile photo upload failed. Please try again.');
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(onboardingRoutes.media.update.url());
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
                                    style={{ backgroundImage: `url(${coverPreview})` }}
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
                                <FilePondUploader
                                    ref={coverPond}
                                    name="cover"
                                    allowMultiple={false}
                                    acceptedFileTypes={['image/*']}
                                    maxFiles={1}
                                    className="absolute inset-0 opacity-0"
                                    style={{ pointerEvents: 'auto' }}
                                    labelIdle='<span class="text-xs uppercase tracking-[0.35em]">Drop cover or <span class="filepond--label-action">Browse</span></span>'
                                    onProcess={handleCoverProcessed}
                                    onRemove={handleCoverRemoved}
                                    onError={handleCoverUploadError}
                                    onprocessfilestart={() => setCoverUploading(true)}
                                    onprocessfileabort={() => setCoverUploading(false)}
                                    onaddfile={() => setCoverUploading(true)}
                                    onupdatefiles={(items) => {
                                        if (items.length === 0) {
                                            setCoverUploading(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="absolute inset-0 flex items-start justify-end p-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs text-white shadow-[0_12px_28px_-16px_rgba(249,115,22,0.55)] transition hover:border-white/35 hover:bg-white/20"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        coverPond.current?.browse();
                                    }}
                                    disabled={coverUploading || processing}
                                >
                                    <Camera className="size-4" />
                                    <span className="max-w-[140px] truncate">{coverButtonLabel}</span>
                                </Button>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8">
                            <div className="-mt-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="flex items-end gap-4">
                                    <div className="relative -mt-2 h-28 w-28 overflow-hidden rounded-3xl border-4 border-neutral-950 shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)]">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt={profile.display_name ?? 'Profile avatar'}
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
                                        <FilePondUploader
                                            ref={avatarPond}
                                            name="avatar"
                                            allowMultiple={false}
                                            acceptedFileTypes={['image/*']}
                                            maxFiles={1}
                                            className="absolute inset-0 opacity-0"
                                            style={{ pointerEvents: 'auto' }}
                                            labelIdle='<span class="text-xs uppercase tracking-[0.35em]">Drop photo or <span class="filepond--label-action">Browse</span></span>'
                                            onProcess={handleAvatarProcessed}
                                            onRemove={handleAvatarRemoved}
                                            onError={handleAvatarUploadError}
                                            onprocessfilestart={() => setAvatarUploading(true)}
                                            onprocessfileabort={() => setAvatarUploading(false)}
                                            onaddfile={() => setAvatarUploading(true)}
                                            onupdatefiles={(items) => {
                                                if (items.length === 0) {
                                                    setAvatarUploading(false);
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs text-white transition hover:border-white/35 hover:bg-white/20"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                avatarPond.current?.browse();
                                            }}
                                            disabled={avatarUploading || processing}
                                        >
                                            <Camera className="size-3.5" />
                                            <span className="max-w-[120px] truncate">{avatarButtonLabel}</span>
                                        </Button>
                                    </div>
                                    <div className="space-y-1 pt-4 text-white">
                                        <h1 className="text-2xl font-semibold leading-tight">
                                            {profile.display_name ?? 'Your display name'}
                                        </h1>
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                                            @{profile.username ?? 'username'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 text-sm text-white/70 lg:items-end lg:self-end lg:mb-5">
                                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/55">
                                        {preferredLocation && <span>{preferredLocation}</span>}
                                        {preferredLocation && profile.pronouns && <span className="text-white/45">•</span>}
                                        {profile.pronouns && <span>{profile.pronouns}</span>}
                                    </div>
                                    {profile.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            {profile.interests.slice(0, 4).map((interest) => (
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
                                    className="[&_p:not(:first-child)]:mt-3 [&_strong]:font-semibold [&_u]:underline [&_s]:line-through [&_br]:block"
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
                                <p className="mt-4 text-sm text-rose-400">{errors.avatar_upload_id}</p>
                            )}
                        </div>
                        {errors.cover_upload_id && (
                            <p className="px-6 pb-4 text-sm text-rose-400 sm:px-8">{errors.cover_upload_id}</p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.08] to-white/[0.03] px-5 py-5 backdrop-blur sm:px-6 sm:py-6">
                        <p className="text-sm font-semibold text-white sm:text-base">Cover & avatar checklist</p>
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:gap-6">
                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-[0.35em] text-white/70 font-medium">Cover image</p>
                                <ul className="space-y-2 text-sm leading-relaxed text-white/75">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                                        <span>1600×900 works best for large screens.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                                        <span>Keep the focal point centered — we crop for mobile automatically.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                                        <span>Avoid heavy compression so gradients and shadows stay crisp.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-[0.35em] text-white/70 font-medium">Profile photo</p>
                                <ul className="space-y-2 text-sm leading-relaxed text-white/75">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                                        <span>Use a square crop; we'll round the edges with a frame.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                                        <span>High-contrast lighting keeps you recognisable in small thumbnails.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                                        <span>You can swap this anytime from your dashboard.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-relaxed text-white/70 sm:text-base">
                            We store originals privately and optimise copies for feed, preview cards, and live sessions. You always control who sees what.
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
                    disabled={processing || coverUploading || avatarUploading}
                    >
                        Continue to follow suggestions
                        <ArrowRight className="size-4" />
                    </Button>
                </div>
            </form>
        </OnboardingLayout>
    );
}

