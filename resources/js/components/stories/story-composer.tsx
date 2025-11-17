import { useForm } from '@inertiajs/react';
import { Clock3, Lock, Star, UserRound, Users, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StoryMediaUploader, { type StoryUploadedMedia } from './story-media-uploader';
import { store as storiesStore } from '@/routes/stories';
import type { LucideIcon } from 'lucide-react';

type StoryComposerProps = {
    audiences?: Array<{ value: string; label: string }>;
    onSubmitted?: () => void;
    onCancel?: () => void;
};

const AUDIENCE_ICON_MAP: Record<string, LucideIcon> = {
    public: Users,
    followers: UserRound,
    subscribers: Star,
};

const DEFAULT_AUDIENCES = [
    { value: 'public', label: 'Public' },
    { value: 'followers', label: 'Followers' },
    { value: 'subscribers', label: 'Subscribers' },
];

export default function StoryComposer({ audiences = DEFAULT_AUDIENCES, onSubmitted, onCancel }: StoryComposerProps) {
    const [uploadedMedia, setUploadedMedia] = useState<StoryUploadedMedia | null>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduledAt, setScheduledAt] = useState<string>('');
    const [submitError, setSubmitError] = useState<string | null>(null);

    const defaultAudience = useMemo(() => audiences[0]?.value ?? 'public', [audiences]);

    const form = useForm({
        media: [] as Array<{
            disk: string;
            path: string;
            thumbnail_path?: string | null;
            blur_path?: string | null;
            mime_type: string;
            width?: number | null;
            height?: number | null;
            duration?: number | null;
            size?: number | null;
            meta?: Record<string, unknown>;
        }>,
        audience: defaultAudience,
        is_subscriber_only: false,
        scheduled_at: null as string | null,
    });

    const audienceOptions = useMemo(() => {
        return audiences.map((audience) => {
            const Icon = AUDIENCE_ICON_MAP[audience.value] ?? Users;
            return {
                ...audience,
                icon: Icon,
            };
        });
    }, [audiences]);

    const handleMediaChange = useCallback(
        (media: StoryUploadedMedia | null) => {
            setUploadedMedia(media);
            if (media && media.identifier && media.mime_type) {
                const extractFilename = (path?: string | null): string | null => {
                    if (!path) {
                        return null;
                    }
                    const parts = path.split('/');
                    return parts[parts.length - 1] || null;
                };

                form.setData('media', [
                    {
                        identifier: media.identifier,
                        mime_type: media.mime_type,
                        width: media.width ?? null,
                        height: media.height ?? null,
                        duration: media.duration ?? null,
                        filename: extractFilename(media.path),
                        original_name: null,
                        size: media.size ?? null,
                        meta: {},
                    },
                ]);
            } else {
                form.setData('media', []);
            }
        },
        [form],
    );

    const handleScheduleChange = useCallback(
        (value: string) => {
            setScheduledAt(value);
            if (value) {
                const date = new Date(value);
                if (!isNaN(date.getTime()) && date > new Date()) {
                    form.setData('scheduled_at', date.toISOString());
                } else {
                    form.setData('scheduled_at', null);
                }
            } else {
                form.setData('scheduled_at', null);
            }
        },
        [form],
    );

    const handleSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setSubmitError(null);
            form.clearErrors();

            if (!uploadedMedia || !uploadedMedia.identifier) {
                setSubmitError('Please upload a media file.');
                return;
            }

            form.post(storiesStore().url, {
                preserveScroll: true,
                onSuccess: () => {
                    setUploadedMedia(null);
                    setScheduledAt('');
                    setScheduleOpen(false);
                    form.reset();
                    onSubmitted?.();
                },
                onError: (errors) => {
                    if (errors && Object.keys(errors).length > 0) {
                        setSubmitError('Please fix the highlighted fields and try again.');
                    } else {
                        setSubmitError('Unable to create story.');
                    }
                },
            });
        },
        [form, uploadedMedia, onSubmitted],
    );

    const canSubmit = uploadedMedia !== null && uploadedMedia.identifier && !form.processing;
    const AudienceIcon = AUDIENCE_ICON_MAP[form.data.audience] ?? Users;

    return (
        <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Create Story</CardTitle>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                        >
                            <X className="size-5" />
                        </button>
                    )}
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {submitError && (
                        <Alert variant="destructive">
                            <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="story-media">Media *</Label>
                        <StoryMediaUploader
                            value={uploadedMedia}
                            onChange={handleMediaChange}
                            disabled={form.processing}
                            acceptedMimeTypes={['image/*', 'video/*']}
                        />
                        {form.errors.media && (
                            <p className="text-sm text-red-400">{form.errors.media}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="story-audience">Audience</Label>
                        <div className="flex items-center gap-2">
                            <AudienceIcon className="size-5 text-white/60" />
                            <select
                                id="story-audience"
                                value={form.data.audience}
                                onChange={(e) => form.setData('audience', e.target.value)}
                                disabled={form.processing}
                                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {audienceOptions.map(({ value, label }) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {form.errors.audience && (
                            <p className="text-sm text-red-400">{form.errors.audience}</p>
                        )}
                    </div>

                    {form.data.audience === 'subscribers' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is-subscriber-only"
                                checked={form.data.is_subscriber_only}
                                onChange={(e) => form.setData('is_subscriber_only', e.target.checked)}
                                disabled={form.processing}
                                className="size-4 rounded border-white/20 bg-black/40 text-rose-500 focus:ring-2 focus:ring-rose-500/30"
                            />
                            <Label htmlFor="is-subscriber-only" className="flex items-center gap-2 cursor-pointer">
                                <Lock className="size-4 text-white/60" />
                                <span>Subscriber-only content</span>
                            </Label>
                        </div>
                    )}

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setScheduleOpen(!scheduleOpen)}
                            disabled={form.processing}
                            className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80 transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Clock3 className="size-4" />
                            <span>{form.data.scheduled_at ? 'Scheduled' : 'Schedule for later'}</span>
                        </button>

                        {scheduleOpen && (
                            <div className="space-y-2 rounded-lg border border-white/10 bg-black/40 p-3">
                                <Label htmlFor="scheduled-at">Schedule Date & Time</Label>
                                <input
                                    type="datetime-local"
                                    id="scheduled-at"
                                    value={scheduledAt}
                                    onChange={(e) => handleScheduleChange(e.target.value)}
                                    disabled={form.processing}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white/80 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                {form.data.scheduled_at && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScheduledAt('');
                                            form.setData('scheduled_at', null);
                                        }}
                                        className="text-xs text-white/60 hover:text-white/80"
                                    >
                                        Clear schedule
                                    </button>
                                )}
                                {form.errors.scheduled_at && (
                                    <p className="text-sm text-red-400">{form.errors.scheduled_at}</p>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={!canSubmit || form.processing}
                    >
                        {form.processing ? 'Creating...' : form.data.scheduled_at ? 'Schedule Story' : 'Create Story'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

