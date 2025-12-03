import { getCsrfToken } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import { store as storiesStore } from '@/routes/stories';
import { router } from '@inertiajs/react';
import {
    Camera,
    Check,
    ChevronDown,
    Clock3,
    Image as ImageIcon,
    Loader2,
    Lock,
    Send,
    Star,
    Trash2,
    Upload,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
} from 'react';

type StoryCreatorModalProps = {
    open: boolean;
    onClose: () => void;
    audiences?: Array<{ value: string; label: string }>;
};

type UploadState = 'idle' | 'uploading' | 'uploaded' | 'error';

type UploadedMedia = {
    identifier: string;
    url: string;
    thumbnail_url?: string;
    mime_type: string;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    size?: number | null;
};

const AUDIENCE_ICONS: Record<string, typeof Users> = {
    public: Users,
    followers: UserRound,
    subscribers: Star,
};

const DEFAULT_AUDIENCES = [
    { value: 'public', label: 'Everyone' },
    { value: 'followers', label: 'Followers only' },
    { value: 'subscribers', label: 'Subscribers only' },
];

export default function StoryCreatorModal({
    open,
    onClose,
    audiences = DEFAULT_AUDIENCES,
}: StoryCreatorModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(null);

    // Form state
    const [audience, setAudience] = useState(audiences[0]?.value ?? 'public');
    const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
    const [showAudienceMenu, setShowAudienceMenu] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduledAt, setScheduledAt] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);

    const isVideo = useMemo(() => {
        return file?.type.startsWith('video/') ?? false;
    }, [file]);

    const canSubmit = uploadState === 'uploaded' && uploadedMedia && !isSubmitting;

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            // Delay reset to allow close animation
            const timer = setTimeout(() => {
                setFile(null);
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(null);
                setUploadState('idle');
                setUploadProgress(0);
                setUploadError(null);
                setUploadedMedia(null);
                setAudience(audiences[0]?.value ?? 'public');
                setIsSubscriberOnly(false);
                setShowAudienceMenu(false);
                setShowSchedule(false);
                setScheduledAt('');
                setIsSubmitting(false);
                setSubmitError(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, audiences, previewUrl]);

    // Handle escape key
    useEffect(() => {
        if (!open) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    const handleFileSelect = useCallback((selectedFile: File) => {
        // Validate file type
        if (!selectedFile.type.match(/^(image|video)\//)) {
            setUploadError('Please select an image or video file.');
            return;
        }

        // Validate file size (50MB max)
        const maxSize = 50 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            setUploadError('File must be less than 50MB.');
            return;
        }

        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setUploadError(null);
        setUploadState('uploading');
        setUploadProgress(0);

        // Start upload
        const xhr = new XMLHttpRequest();
        const csrfToken = getCsrfToken();

        xhr.open('POST', '/uploads/tmp');
        xhr.withCredentials = true;
        xhr.responseType = 'json';

        if (csrfToken) {
            xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
        }
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = xhr.response;
                if (response && response.id) {
                    setUploadedMedia({
                        identifier: String(response.id),
                        url: response.url,
                        thumbnail_url: response.thumbnail_url,
                        mime_type: response.mime_type,
                        width: response.width,
                        height: response.height,
                        duration: response.duration,
                        size: response.size,
                    });
                    setUploadState('uploaded');
                } else {
                    setUploadError('Upload failed. Please try again.');
                    setUploadState('error');
                }
            } else {
                const errorMsg = xhr.response?.message || 'Upload failed. Please try again.';
                setUploadError(errorMsg);
                setUploadState('error');
            }
        };

        xhr.onerror = () => {
            setUploadError('Network error. Please try again.');
            setUploadState('error');
        };

        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);
        xhr.send(formData);
    }, []);

    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                handleFileSelect(selectedFile);
            }
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [handleFileSelect],
    );

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);

            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
                handleFileSelect(droppedFile);
            }
        },
        [handleFileSelect],
    );

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleRemoveMedia = useCallback(() => {
        setFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setUploadState('idle');
        setUploadProgress(0);
        setUploadError(null);
        setUploadedMedia(null);
    }, [previewUrl]);

    const handleSubmit = useCallback(() => {
        if (!uploadedMedia) return;

        setIsSubmitting(true);
        setSubmitError(null);

        const payload = {
            media: [
                {
                    identifier: uploadedMedia.identifier,
                    mime_type: uploadedMedia.mime_type,
                    width: uploadedMedia.width,
                    height: uploadedMedia.height,
                    duration: uploadedMedia.duration,
                    size: uploadedMedia.size,
                },
            ],
            audience,
            is_subscriber_only: isSubscriberOnly,
            scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        };

        router.post(storiesStore().url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
            onError: (errors) => {
                setIsSubmitting(false);
                const firstError = Object.values(errors)[0];
                setSubmitError(typeof firstError === 'string' ? firstError : 'Failed to create story.');
            },
        });
    }, [uploadedMedia, audience, isSubscriberOnly, scheduledAt, onClose]);

    const AudienceIcon = AUDIENCE_ICONS[audience] ?? Users;
    const selectedAudienceLabel = audiences.find((a) => a.value === audience)?.label ?? 'Everyone';

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-neutral-950 sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-white/10">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                        <X className="size-5" />
                    </button>
                    <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                        Create Story
                    </h2>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition',
                            canSubmit
                                ? 'bg-amber-500 text-black hover:bg-amber-400'
                                : 'bg-white/10 text-white/40 cursor-not-allowed',
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                        <span className="hidden sm:inline">
                            {scheduledAt ? 'Schedule' : 'Share'}
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    {/* Media Preview / Upload Area */}
                    <div className="relative flex-1 sm:flex-none">
                        {!file ? (
                            /* Upload Zone */
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => inputRef.current?.click()}
                                className={cn(
                                    'flex h-full min-h-[400px] cursor-pointer flex-col items-center justify-center gap-6 p-8 transition sm:min-h-[500px]',
                                    isDragging ? 'bg-amber-500/10' : 'bg-black/40',
                                )}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleInputChange}
                                    className="hidden"
                                />

                                <div
                                    className={cn(
                                        'flex size-24 items-center justify-center rounded-full border-2 border-dashed transition',
                                        isDragging
                                            ? 'border-amber-400 bg-amber-500/20'
                                            : 'border-white/30 bg-white/5',
                                    )}
                                >
                                    <Upload
                                        className={cn(
                                            'size-10 transition',
                                            isDragging ? 'text-amber-400' : 'text-white/50',
                                        )}
                                    />
                                </div>

                                <div className="text-center">
                                    <p className="text-lg font-medium text-white">
                                        {isDragging ? 'Drop to upload' : 'Add to your story'}
                                    </p>
                                    <p className="mt-1 text-sm text-white/50">
                                        Drag and drop or tap to select
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            inputRef.current?.click();
                                        }}
                                        className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                                    >
                                        <ImageIcon className="size-4" />
                                        Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            inputRef.current?.click();
                                        }}
                                        className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                                    >
                                        <Camera className="size-4" />
                                        Video
                                    </button>
                                </div>

                                {uploadError && (
                                    <p className="text-sm text-red-400">{uploadError}</p>
                                )}
                            </div>
                        ) : (
                            /* Media Preview */
                            <div className="relative h-full min-h-[400px] bg-black sm:min-h-[500px]">
                                {isVideo ? (
                                    <video
                                        ref={videoRef}
                                        src={previewUrl ?? undefined}
                                        className="h-full w-full object-contain"
                                        controls
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={previewUrl ?? undefined}
                                        alt="Story preview"
                                        className="h-full w-full object-contain"
                                    />
                                )}

                                {/* Upload Progress Overlay */}
                                {uploadState === 'uploading' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                                        <Loader2 className="size-10 animate-spin text-amber-400" />
                                        <p className="mt-3 text-sm text-white">
                                            Uploading... {uploadProgress}%
                                        </p>
                                        <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-white/20">
                                            <div
                                                className="h-full bg-amber-400 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Error Overlay */}
                                {uploadState === 'error' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                                        <p className="text-sm text-red-400">{uploadError}</p>
                                        <button
                                            type="button"
                                            onClick={handleRemoveMedia}
                                            className="mt-3 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                )}

                                {/* Remove Button */}
                                {uploadState === 'uploaded' && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveMedia}
                                        className="absolute top-4 right-4 rounded-full bg-black/60 p-2.5 text-white transition hover:bg-black/80"
                                    >
                                        <Trash2 className="size-5" />
                                    </button>
                                )}

                                {/* Upload Success Badge */}
                                {uploadState === 'uploaded' && (
                                    <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-green-500/90 px-3 py-1.5 text-xs font-medium text-white">
                                        <Check className="size-3.5" />
                                        Ready
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Options (only show when media is uploaded) */}
                    {uploadState === 'uploaded' && (
                        <div className="shrink-0 space-y-3 border-t border-white/10 p-4">
                            {submitError && (
                                <p className="text-sm text-red-400">{submitError}</p>
                            )}

                            {/* Audience Selector */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                                    className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <AudienceIcon className="size-5 text-white/60" />
                                        <span className="text-sm text-white">{selectedAudienceLabel}</span>
                                    </div>
                                    <ChevronDown
                                        className={cn(
                                            'size-4 text-white/40 transition',
                                            showAudienceMenu && 'rotate-180',
                                        )}
                                    />
                                </button>

                                {showAudienceMenu && (
                                    <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-xl">
                                        {audiences.map((option) => {
                                            const Icon = AUDIENCE_ICONS[option.value] ?? Users;
                                            const isSelected = audience === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setAudience(option.value);
                                                        setShowAudienceMenu(false);
                                                    }}
                                                    className={cn(
                                                        'flex w-full items-center gap-3 px-4 py-3 text-left transition',
                                                        isSelected
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : 'text-white hover:bg-white/5',
                                                    )}
                                                >
                                                    <Icon className="size-5" />
                                                    <span className="text-sm">{option.label}</span>
                                                    {isSelected && <Check className="ml-auto size-4" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Subscriber Only Toggle */}
                            {audience === 'subscribers' && (
                                <button
                                    type="button"
                                    onClick={() => setIsSubscriberOnly(!isSubscriberOnly)}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-xl px-4 py-3 transition',
                                        isSubscriberOnly ? 'bg-amber-500/20' : 'bg-white/5 hover:bg-white/10',
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Lock className={cn('size-5', isSubscriberOnly ? 'text-amber-400' : 'text-white/60')} />
                                        <span className={cn('text-sm', isSubscriberOnly ? 'text-amber-400' : 'text-white')}>
                                            Exclusive content
                                        </span>
                                    </div>
                                    <div
                                        className={cn(
                                            'flex size-5 items-center justify-center rounded-full border-2 transition',
                                            isSubscriberOnly
                                                ? 'border-amber-400 bg-amber-400'
                                                : 'border-white/30',
                                        )}
                                    >
                                        {isSubscriberOnly && <Check className="size-3 text-black" />}
                                    </div>
                                </button>
                            )}

                            {/* Schedule Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowSchedule(!showSchedule)}
                                className={cn(
                                    'flex w-full items-center justify-between rounded-xl px-4 py-3 transition',
                                    scheduledAt ? 'bg-amber-500/20' : 'bg-white/5 hover:bg-white/10',
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Clock3 className={cn('size-5', scheduledAt ? 'text-amber-400' : 'text-white/60')} />
                                    <span className={cn('text-sm', scheduledAt ? 'text-amber-400' : 'text-white')}>
                                        {scheduledAt ? 'Scheduled' : 'Schedule for later'}
                                    </span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'size-4 transition',
                                        scheduledAt ? 'text-amber-400' : 'text-white/40',
                                        showSchedule && 'rotate-180',
                                    )}
                                />
                            </button>

                            {showSchedule && (
                                <div className="rounded-xl bg-white/5 p-4">
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                                    />
                                    {scheduledAt && (
                                        <button
                                            type="button"
                                            onClick={() => setScheduledAt('')}
                                            className="mt-2 text-xs text-white/50 hover:text-white/70"
                                        >
                                            Clear schedule
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


