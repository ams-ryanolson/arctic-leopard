import PostComposerController from '@/actions/App/Http/Controllers/Posts/PostComposerController';
import FeedMediaUploader, {
    type FeedUploadedMedia,
    type FeedUploaderItemSummary,
} from '@/components/feed/feed-media-uploader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import type { FeedComposerConfig } from '@/types/feed';
import { useForm, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    Check,
    Clock3,
    Image as ImageIcon,
    Lock,
    Plus,
    Shield,
    Star,
    Target,
    Pin as Thumbtack,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type FeedPostComposerProps = {
    config: FeedComposerConfig;
    onSubmitted?: () => void;
};

type ComposerMediaAttachment = {
    disk: string;
    path: string;
    mime_type: string;
    position: number;
    thumbnail_path?: string | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    is_primary: boolean;
};

type ComposerFormState = {
    type: string;
    audience: string;
    body: string;
    is_pinned: boolean;
    scheduled_at: string | null;
    media: ComposerMediaAttachment[];
    hashtags: string[];
    poll?: PollPayload | null;
    paywall_price: number | null;
    paywall_currency: string;
    extra_attributes: TipGoalExtra | null;
    post_to_circles: boolean;
};

type TipGoalExtra = {
    tip_goal: {
        amount: number;
        currency: string;
        label: string | null;
        deadline: string | null;
    };
};

type PollOptionDraft = {
    id: string;
    value: string;
};

type PollDraft = {
    question: string;
    options: PollOptionDraft[];
    allow_multiple: boolean;
    max_choices: number | null;
    closes_at: string;
};

type PollPayload = {
    question: string;
    options: string[];
    allow_multiple: boolean;
    max_choices: number | null;
    closes_at: string | null;
};

type ComposerMode = 'text' | 'media' | 'poll';

type AudienceDefinition = {
    value: string;
    label: string;
    icon: LucideIcon;
};

const AUDIENCE_ICON_MAP: Record<string, LucideIcon> = {
    public: Users,
    pay_to_view: Lock,
    circles: Users,
    subscribers: Star,
    followers: UserRound,
    private: Lock,
};

const FOCUS_RING =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const MAX_MEDIA_FILES = 6;
const MAX_POLL_OPTIONS = 6;
const MIN_POLL_OPTIONS = 2;
const MAX_HASHTAGS = 8;
const BODY_CHARACTER_LIMIT = 10000;
const MIN_CURRENCY_CENTS = 100;

const supportedCurrencies = ['USD', 'EUR', 'GBP'];

const COMPOSER_PLACEHOLDER = "What's lighting up your circles tonight?";

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

type IconToggleProps = {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    onClick: () => void;
    disabled?: boolean;
    tone?: 'default' | 'primary' | 'danger';
    collapseLabel?: boolean;
};

function IconToggle({
    icon: Icon,
    label,
    active = false,
    onClick,
    disabled = false,
    tone = 'default',
    collapseLabel = true,
}: IconToggleProps) {
    const baseTone =
        tone === 'primary'
            ? 'text-amber-200'
            : tone === 'danger'
              ? 'text-rose-200'
              : 'text-white/70';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'group flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.25em] uppercase transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:px-3 sm:py-1.5',
                active
                    ? 'border-white/40 bg-white/15 text-white shadow-[0_14px_30px_-22px_rgba(249,115,22,0.8)]'
                    : 'hover:border-white/25 hover:bg-white/10 hover:text-white',
                FOCUS_RING,
            )}
        >
            <Icon
                className={cn(
                    'size-4 transition',
                    active ? 'text-white' : baseTone,
                    'group-hover:text-white',
                )}
            />
            {collapseLabel ? (
                <>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.charAt(0)}</span>
                </>
            ) : (
                <span>{label}</span>
            )}
        </button>
    );
}

type ComposerIconButtonProps = {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    onClick: () => void;
    disabled?: boolean;
};

function ComposerIconButton({
    icon: Icon,
    label,
    active = false,
    onClick,
    disabled = false,
}: ComposerIconButtonProps) {
    return (
        <TooltipPrimitive.Root>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                    aria-label={label}
                    aria-pressed={active}
                    className={cn(
                        'flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition active:scale-95 hover:border-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:size-9',
                        active &&
                            'border-white/40 bg-white/20 text-white shadow-[0_14px_30px_-22px_rgba(249,115,22,0.8)]',
                        FOCUS_RING,
                    )}
                >
                    <Icon className="size-3.5 sm:size-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="bg-black/90 text-white border-white/20"
            >
                {label}
            </TooltipContent>
        </TooltipPrimitive.Root>
    );
}

const toCurrencyCents = (input: string): number | null => {
    const normalized = input.replace(/[^\d.,]/g, '').replace(',', '.');

    if (normalized.trim() === '') {
        return null;
    }

    const parsed = Number.parseFloat(normalized);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }

    return Math.round(parsed * 100);
};

const createDefaultPoll = (): PollDraft => ({
    question: '',
    options: [
        { id: generateOptionId(), value: '' },
        { id: generateOptionId(), value: '' },
    ],
    allow_multiple: false,
    max_choices: null,
    closes_at: '',
});

function generateOptionId(): string {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return crypto.randomUUID();
    }

    return `poll-option-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeHashtag(value: string): string {
    return value.replace(/^#+/, '').toLowerCase();
}

function extractHashtagsFromBody(body: string): string[] {
    const matches = new Set<string>();
    const regex = /(^|\s)#([a-z0-9_]{2,120})/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(body)) !== null) {
        const normalized = normalizeHashtag(match[2]);

        if (!matches.has(normalized)) {
            matches.add(normalized);
        }

        if (matches.size >= MAX_HASHTAGS) {
            break;
        }
    }

    return Array.from(matches);
}

function pollDraftHasContent(poll: PollDraft): boolean {
    if (poll.question.trim() !== '') {
        return true;
    }

    return poll.options.some((option) => option.value.trim() !== '');
}

function ComposerAvatar(): JSX.Element {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const initials = useMemo(() => {
        const source = user?.display_name ?? user?.name ?? user?.username ?? '';

        if (source.trim() === '') {
            return 'RK';
        }

        return source
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    }, [user?.display_name, user?.name, user?.username]);

    return (
        <Avatar className="flex size-9 shrink-0 border border-white/10 bg-white/10 sm:size-12">
            <AvatarImage
                src={user?.avatar_url ?? undefined}
                alt={user?.display_name ?? user?.username ?? 'You'}
            />
            <AvatarFallback className="bg-white/10 text-[0.625rem] font-semibold text-white/80 sm:text-sm">
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}

export default function FeedPostComposer({
    config,
    onSubmitted,
}: FeedPostComposerProps) {
    const { features } = usePage<SharedData>().props;
    const circlesEnabled = features?.feature_circles_enabled ?? false;
    const signalsEnabled = features?.feature_signals_enabled ?? false;
    
    const defaultTypeValue = useMemo(
        () => config.post_types[0]?.value ?? 'text',
        [config.post_types],
    );
    const defaultAudience = useMemo(
        () => config.audiences[0]?.value ?? 'public',
        [config.audiences],
    );

    const initialMode: ComposerMode = (
        ['text', 'media', 'poll'] as readonly ComposerMode[]
    ).includes(defaultTypeValue as ComposerMode)
        ? (defaultTypeValue as ComposerMode)
        : 'text';

    const form = useForm<ComposerFormState>({
        type: initialMode,
        audience: defaultAudience,
        body: '',
        is_pinned: false,
        scheduled_at: null,
        media: [],
        hashtags: [],
        poll: undefined as unknown as null,
        paywall_price: null,
        paywall_currency: 'USD',
        extra_attributes: null,
        post_to_circles: false,
    });
    const formData = form.data;
    const setFormData = form.setData;

    const [uploadedMedia, setUploadedMedia] = useState<FeedUploadedMedia[]>([]);
    const [uploaderItems, setUploaderItems] = useState<
        FeedUploaderItemSummary[]
    >([]);
    const [uploaderKey, setUploaderKey] = useState(() =>
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
    );
    const [pollDraft, setPollDraft] = useState<PollDraft>(createDefaultPoll);
    const [paywallPriceInput, setPaywallPriceInput] = useState('');
    const [paywallError, setPaywallError] = useState<string | null>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [tipGoalOpen, setTipGoalOpen] = useState(false);
    const [tipGoalAmountInput, setTipGoalAmountInput] = useState('');
    const [tipGoalLabel, setTipGoalLabel] = useState('');
    const [tipGoalDeadline, setTipGoalDeadline] = useState('');
    const [tipGoalError, setTipGoalError] = useState<string | null>(null);
    const [tipGoalCurrency, setTipGoalCurrency] = useState('USD');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [previousAudience, setPreviousAudience] = useState(defaultAudience);
    const [mediaTrayOpen, setMediaTrayOpen] = useState(false);
    const [pollTrayOpen, setPollTrayOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const resetUploader = useCallback(() => {
        const nextKey =
            typeof crypto !== 'undefined' &&
            typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : String(Date.now());
        setUploaderKey(nextKey);
        setUploadedMedia([]);
        setUploaderItems([]);
    }, []);

    const payToViewAvailable = useMemo(
        () => config.audiences.some((option) => option.value === 'pay_to_view'),
        [config.audiences],
    );
    const paywallActive = formData.audience === 'pay_to_view';
    const pollHasContent = useMemo(
        () => pollDraftHasContent(pollDraft),
        [pollDraft],
    );

    const mediaUploadsInProgress = useMemo(
        () => uploaderItems.some((item) => item.status === 'uploading'),
        [uploaderItems],
    );

    const mediaHasErrors = useMemo(
        () => uploaderItems.some((item) => item.status === 'error'),
        [uploaderItems],
    );

    const audienceOptions = useMemo<AudienceDefinition[]>(
        () =>
            config.audiences
                .filter((option) => {
                    // Hide subscribers and pay_to_view options when Signals is disabled
                    if (!signalsEnabled && (option.value === 'subscribers' || option.value === 'pay_to_view')) {
                        return false;
                    }
                    return true;
                })
                .map((option) => ({
                    value: option.value,
                    label: option.label,
                    icon: AUDIENCE_ICON_MAP[option.value] ?? Users,
                })),
        [config.audiences, signalsEnabled],
    );

    const pollActive = pollTrayOpen || pollHasContent;
    const mediaActive = mediaTrayOpen || uploaderItems.length > 0;
    const mediaSectionVisible = mediaTrayOpen || uploaderItems.length > 0;
    const pollSectionVisible = pollActive;
    const toolbarDisabled = !config.can_post || form.processing;

    const clearPoll = useCallback(() => {
        setPollDraft(createDefaultPoll());
        setFormData('poll', null);
    }, [setFormData]);

    const handleMediaButton = useCallback(() => {
        if (!config.can_post || form.processing) {
            return;
        }

        setIsExpanded(true);

        if (mediaTrayOpen && uploaderItems.length === 0) {
            setMediaTrayOpen(false);
            return;
        }

        if (pollActive) {
            setPollTrayOpen(false);
            clearPoll();
        }

        setMediaTrayOpen(true);
    }, [
        clearPoll,
        config.can_post,
        form.processing,
        mediaTrayOpen,
        pollActive,
        uploaderItems.length,
    ]);

    const handleMediaTrayClose = useCallback(() => {
        setMediaTrayOpen(false);
        if (uploaderItems.length > 0) {
            resetUploader();
        }
    }, [resetUploader, uploaderItems.length]);

    const handlePollButton = useCallback(() => {
        if (!config.can_post || form.processing) {
            return;
        }

        setIsExpanded(true);

        if (pollActive) {
            setPollTrayOpen(false);
            clearPoll();
            return;
        }

        if (uploaderItems.length > 0) {
            resetUploader();
        }

        setMediaTrayOpen(false);
        setPollTrayOpen(true);
    }, [
        clearPoll,
        config.can_post,
        form.processing,
        pollActive,
        resetUploader,
        uploaderItems.length,
    ]);

    const handlePollTrayClose = useCallback(() => {
        setPollTrayOpen(false);
        clearPoll();
    }, [clearPoll]);

    const validatePaywallPrice = useCallback(
        (rawValue: string): { cents: number | null; error: string | null } => {
            const trimmed = rawValue.trim();

            if (trimmed === '') {
                return {
                    cents: null,
                    error: 'Add a paywall price to continue.',
                };
            }

            const cents = toCurrencyCents(trimmed);

            if (cents === null) {
                return {
                    cents: null,
                    error: 'Enter a valid amount (e.g. 19.99).',
                };
            }

            if (cents < MIN_CURRENCY_CENTS) {
                return { cents: null, error: 'Minimum amount is $1.00.' };
            }

            return { cents, error: null };
        },
        [],
    );

    const resetPaywall = useCallback(() => {
        setPaywallPriceInput('');
        setPaywallError(null);

        if (formData.paywall_price !== null) {
            setFormData('paywall_price', null);
        }

        if (formData.paywall_currency !== 'USD') {
            setFormData('paywall_currency', 'USD');
        }
    }, [formData.paywall_currency, formData.paywall_price, setFormData]);

    const applyPaywallValidation = useCallback(
        (value: string) => {
            const { cents, error } = validatePaywallPrice(value);

            setPaywallError(error);

            if (cents !== null) {
                if (formData.paywall_price !== cents) {
                    setFormData('paywall_price', cents);
                }
            } else if (formData.paywall_price !== null) {
                setFormData('paywall_price', null);
            }
        },
        [formData.paywall_price, setFormData, validatePaywallPrice],
    );

    const validateTipGoalAmount = useCallback(
        (rawValue: string): { cents: number | null; error: string | null } => {
            const trimmed = rawValue.trim();

            if (trimmed === '') {
                return {
                    cents: null,
                    error: 'Enter a tip goal amount (e.g. 150 or 250.00).',
                };
            }

            const cents = toCurrencyCents(trimmed);

            if (cents === null) {
                return {
                    cents: null,
                    error: 'Enter a tip goal amount (e.g. 150 or 250.00).',
                };
            }

            if (cents < MIN_CURRENCY_CENTS) {
                return {
                    cents: null,
                    error: 'Tip goal must be at least $1.00.',
                };
            }

            return { cents, error: null };
        },
        [],
    );

    const syncTipGoalExtra = useCallback(
        (
            open: boolean,
            amountValue: string,
            currencyValue: string,
            labelValue: string,
            deadlineValue: string,
        ) => {
            if (!open) {
                setTipGoalError(null);

                if (formData.extra_attributes !== null) {
                    setFormData('extra_attributes', null);
                }

                return;
            }

            const { cents, error } = validateTipGoalAmount(amountValue);

            if (error !== null || cents === null) {
                setTipGoalError(error);

                if (formData.extra_attributes !== null) {
                    setFormData('extra_attributes', null);
                }

                return;
            }

            setTipGoalError(null);

            const nextExtra = {
                tip_goal: {
                    amount: cents,
                    currency: currencyValue,
                    label: labelValue.trim() === '' ? null : labelValue.trim(),
                    deadline: deadlineValue ? deadlineValue : null,
                },
            };

            if (
                JSON.stringify(formData.extra_attributes ?? null) !==
                JSON.stringify(nextExtra)
            ) {
                setFormData('extra_attributes', nextExtra);
            }
        },
        [formData.extra_attributes, setFormData, validateTipGoalAmount],
    );

    const currentMode = useMemo<ComposerMode>(() => {
        if (pollActive) {
            return 'poll';
        }

        if (mediaActive) {
            return 'media';
        }

        return 'text';
    }, [mediaActive, pollActive]);

    useEffect(() => {
        if (formData.type !== currentMode) {
            setFormData('type', currentMode);
        }
    }, [currentMode, formData.type, setFormData]);

    useEffect(() => {
        if (!circlesEnabled && formData.post_to_circles) {
            setFormData('post_to_circles', false);
        }
    }, [circlesEnabled, formData.post_to_circles, setFormData]);

    useEffect(() => {
        if (
            !signalsEnabled &&
            (formData.audience === 'subscribers' ||
                formData.audience === 'pay_to_view')
        ) {
            // Reset to first available audience when Signals is disabled
            const firstAvailableAudience =
                audienceOptions[0]?.value ?? defaultAudience;
            setFormData('audience', firstAvailableAudience);
        }
    }, [
        signalsEnabled,
        formData.audience,
        audienceOptions,
        defaultAudience,
        setFormData,
    ]);

    useEffect(() => {
        setFormData(
            'media',
            uploadedMedia
                .filter(
                    (media) =>
                        typeof media.identifier === 'string' &&
                        media.identifier.trim() !== '',
                )
                .map((media, index) => {
                    const { isPrimary } = media as FeedUploadedMedia & {
                        isPrimary?: boolean;
                    };

                    const extractFilename = (
                        path?: string | null,
                    ): string | null => {
                        if (!path) {
                            return null;
                        }
                        const parts = path.split('/');
                        return parts[parts.length - 1] || null;
                    };

                    return {
                        identifier: media.identifier ?? '',
                        mime_type:
                            media.mime_type ?? 'application/octet-stream',
                        width: media.width ?? null,
                        height: media.height ?? null,
                        duration: media.duration ?? null,
                        position: index,
                        is_primary: isPrimary ?? index === 0,
                        filename: extractFilename(media.path),
                        original_name: null,
                        size: media.size ?? null,
                    };
                }),
        );
    }, [setFormData, uploadedMedia]);

    useEffect(() => {
        if (currentMode !== 'poll') {
            if (formData.poll !== null) {
                setFormData('poll', null);
            }

            return;
        }

        const nextPoll: PollPayload = {
            question: pollDraft.question,
            options: pollDraft.options.map((option) => option.value),
            allow_multiple: pollDraft.allow_multiple,
            max_choices: pollDraft.allow_multiple
                ? pollDraft.max_choices
                : null,
            closes_at: pollDraft.closes_at ? pollDraft.closes_at : null,
        };

        const currentPoll = formData.poll;
        const isSame =
            currentPoll !== null &&
            currentPoll !== undefined &&
            currentPoll.question === nextPoll.question &&
            !!currentPoll.allow_multiple === !!nextPoll.allow_multiple &&
            (currentPoll.max_choices ?? null) ===
                (nextPoll.max_choices ?? null) &&
            (currentPoll.closes_at ?? null) === (nextPoll.closes_at ?? null) &&
            Array.isArray(currentPoll.options) &&
            currentPoll.options.length === nextPoll.options.length &&
            currentPoll.options.every(
                (option, index) => option === nextPoll.options[index],
            );

        if (!isSame) {
            setFormData('poll', nextPoll);
        }
    }, [currentMode, formData.poll, pollDraft, setFormData]);

    const handleBodyChange = useCallback(
        (value: string) => {
            setFormData('body', value);
            setHasTyped(value.trim().length > 0);

            const extracted = extractHashtagsFromBody(value).slice(
                0,
                MAX_HASHTAGS,
            );
            setFormData('hashtags', extracted);
        },
        [setFormData],
    );

    const handleTextareaFocus = useCallback(() => {
        setIsExpanded(true);
    }, []);

    const handleTextareaBlur = useCallback(() => {
        // Only collapse if user hasn't typed anything and no media/poll is active
        if (
            !hasTyped &&
            !mediaActive &&
            !pollActive &&
            !scheduleOpen &&
            !tipGoalOpen &&
            !paywallActive
        ) {
            setIsExpanded(false);
        }
    }, [
        hasTyped,
        mediaActive,
        pollActive,
        scheduleOpen,
        tipGoalOpen,
        paywallActive,
    ]);

    const handlePinToggle = useCallback(() => {
        if (!config.can_post || form.processing) {
            return;
        }

        setFormData('is_pinned', !formData.is_pinned);
    }, [config.can_post, form.processing, formData.is_pinned, setFormData]);

    const handleAudienceSelect = useCallback(
        (value: string) => {
            if (
                !config.can_post ||
                form.processing ||
                value === formData.audience
            ) {
                return;
            }

            if (value === 'pay_to_view') {
                if (formData.audience !== 'pay_to_view') {
                    setPreviousAudience(formData.audience);
                }

                setFormData('audience', 'pay_to_view');
                applyPaywallValidation(paywallPriceInput);
                return;
            }

            setPreviousAudience(value);
            setFormData('audience', value);

            if (paywallActive) {
                resetPaywall();
            }
        },
        [
            applyPaywallValidation,
            config.can_post,
            form.processing,
            formData.audience,
            paywallActive,
            paywallPriceInput,
            resetPaywall,
            setFormData,
        ],
    );

    const handlePaywallToggle = useCallback(() => {
        if (!payToViewAvailable || !config.can_post || form.processing) {
            return;
        }

        setIsExpanded(true);

        if (paywallActive) {
            setFormData('audience', previousAudience);
            resetPaywall();
            return;
        }

        if (formData.audience !== 'pay_to_view') {
            setPreviousAudience(formData.audience);
        }

        setFormData('audience', 'pay_to_view');
        applyPaywallValidation(paywallPriceInput);
    }, [
        applyPaywallValidation,
        config.can_post,
        form.processing,
        formData.audience,
        payToViewAvailable,
        paywallActive,
        paywallPriceInput,
        previousAudience,
        resetPaywall,
        setFormData,
    ]);

    const handlePaywallPriceChange = useCallback(
        (value: string) => {
            setPaywallPriceInput(value);

            if (!paywallActive) {
                setPaywallError(null);

                if (formData.paywall_price !== null) {
                    setFormData('paywall_price', null);
                }

                return;
            }

            applyPaywallValidation(value);
        },
        [
            applyPaywallValidation,
            formData.paywall_price,
            paywallActive,
            setFormData,
        ],
    );

    const handleScheduleToggle = useCallback(() => {
        if (!config.can_post || form.processing) {
            return;
        }

        setIsExpanded(true);

        setScheduleOpen((open) => {
            if (open) {
                setFormData('scheduled_at', null);
            }

            return !open;
        });
    }, [config.can_post, form.processing, setFormData]);

    const handleTipGoalToggle = useCallback(() => {
        if (!config.can_post || form.processing) {
            return;
        }

        setIsExpanded(true);

        setTipGoalOpen((open) => {
            const nextOpen = !open;

            if (!nextOpen) {
                setTipGoalAmountInput('');
                setTipGoalLabel('');
                setTipGoalDeadline('');
                setTipGoalError(null);
                setTipGoalCurrency('USD');
                syncTipGoalExtra(false, '', 'USD', '', '');
            } else {
                syncTipGoalExtra(
                    true,
                    tipGoalAmountInput,
                    tipGoalCurrency,
                    tipGoalLabel,
                    tipGoalDeadline,
                );
            }

            return nextOpen;
        });
    }, [
        config.can_post,
        form.processing,
        syncTipGoalExtra,
        tipGoalAmountInput,
        tipGoalCurrency,
        tipGoalDeadline,
        tipGoalLabel,
    ]);

    const handleTipGoalAmountChange = useCallback(
        (value: string) => {
            setTipGoalAmountInput(value);
            syncTipGoalExtra(
                true,
                value,
                tipGoalCurrency,
                tipGoalLabel,
                tipGoalDeadline,
            );
        },
        [syncTipGoalExtra, tipGoalCurrency, tipGoalDeadline, tipGoalLabel],
    );

    const handleTipGoalLabelChange = useCallback(
        (value: string) => {
            setTipGoalLabel(value);
            syncTipGoalExtra(
                true,
                tipGoalAmountInput,
                tipGoalCurrency,
                value,
                tipGoalDeadline,
            );
        },
        [
            syncTipGoalExtra,
            tipGoalAmountInput,
            tipGoalCurrency,
            tipGoalDeadline,
        ],
    );

    const handleTipGoalDeadlineChange = useCallback(
        (value: string) => {
            setTipGoalDeadline(value);
            syncTipGoalExtra(
                true,
                tipGoalAmountInput,
                tipGoalCurrency,
                tipGoalLabel,
                value,
            );
        },
        [syncTipGoalExtra, tipGoalAmountInput, tipGoalCurrency, tipGoalLabel],
    );

    const handleTipGoalCurrencyChange = useCallback(
        (currency: string) => {
            setTipGoalCurrency(currency);
            syncTipGoalExtra(
                true,
                tipGoalAmountInput,
                currency,
                tipGoalLabel,
                tipGoalDeadline,
            );
        },
        [syncTipGoalExtra, tipGoalAmountInput, tipGoalDeadline, tipGoalLabel],
    );

    const togglePostToCircles = useCallback(() => {
        if (!config.can_post || form.processing) {
            return;
        }

        setFormData('post_to_circles', !formData.post_to_circles);
    }, [
        config.can_post,
        form.processing,
        formData.post_to_circles,
        setFormData,
    ]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSubmitError(null);
        form.clearErrors();

        form.post(PostComposerController.url(), {
            preserveScroll: true,
                onSuccess: () => {
                resetUploader();
                setPollDraft(createDefaultPoll());
                setMediaTrayOpen(false);
                setPollTrayOpen(false);
                setScheduleOpen(false);
                setTipGoalOpen(false);
                setTipGoalAmountInput('');
                setTipGoalLabel('');
                setTipGoalDeadline('');
                setTipGoalError(null);
                setTipGoalCurrency('USD');
                setPreviousAudience(defaultAudience);
                setHasTyped(false);
                setIsExpanded(false);
                handleBodyChange('');

                resetPaywall();

                form.reset();

                onSubmitted?.();
            },
            onError: (errors) => {
                if (errors && Object.keys(errors).length > 0) {
                    setSubmitError(
                        'Please fix the highlighted fields and try again.',
                    );
                } else {
                    setSubmitError('Unable to publish post.');
                }
            },
        });
    };

    const pollErrors = useMemo(
        () =>
            Object.entries(form.errors)
                .filter(([field]) => field.startsWith('poll.'))
                .map(([, message]) => message),
        [form.errors],
    );

    const highlightedBody = useMemo(() => {
        if (formData.body === '') {
            return '';
        }

        const escaped = escapeHtml(formData.body);
        const pattern = /(@[a-zA-Z0-9_]{1,30}|#[a-z0-9_]{1,120})/g;
        return escaped
            .replace(
                pattern,
                (match) => `<span class="text-amber-200">${match}</span>`,
            )
            .replace(/\n/g, '<br />');
    }, [formData.body]);

    const overlayContent = useMemo(() => {
        if (highlightedBody === '') {
            return `<span class="text-white/40">${escapeHtml(COMPOSER_PLACEHOLDER)}</span>`;
        }

        return highlightedBody;
    }, [highlightedBody]);

    const syncOverlayScroll = useCallback(() => {
        if (!textareaRef.current || !overlayRef.current) {
            return;
        }

        overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }, []);

    useEffect(() => {
        if (!textareaRef.current) {
            return;
        }

        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;

        syncOverlayScroll();
    }, [formData.body, syncOverlayScroll]);

    const bodyCharacterCount = formData.body.length;
    const bodyRemaining = BODY_CHARACTER_LIMIT - bodyCharacterCount;
    const bodyOverLimit = bodyRemaining < 0;
    const bodyCounterClass =
        bodyOverLimit || bodyRemaining <= 100
            ? bodyOverLimit
                ? 'text-rose-300'
                : 'text-amber-200'
            : 'text-white/50';

    const requiresBody = currentMode === 'text';
    const requiresMedia = currentMode === 'media';
    const hasBody = formData.body.trim().length > 0;
    const tipGoalInvalid = tipGoalOpen && tipGoalError !== null;
    const mediaReadyCount = uploadedMedia.length;
    const canSubmit =
        config.can_post &&
        !form.processing &&
        (!requiresBody || hasBody) &&
        (!requiresMedia || mediaReadyCount > 0) &&
        !mediaUploadsInProgress &&
        !mediaHasErrors &&
        !bodyOverLimit &&
        !tipGoalInvalid &&
        (!paywallError || !paywallActive);

    // Keep expanded if there's content or active sections
    const shouldStayExpanded =
        hasTyped ||
        mediaActive ||
        pollActive ||
        scheduleOpen ||
        tipGoalOpen ||
        paywallActive;

    useEffect(() => {
        if (shouldStayExpanded && !isExpanded) {
            setIsExpanded(true);
        }
    }, [shouldStayExpanded, isExpanded]);

    return (
        <Card className="border border-white/10 bg-white/5 text-sm text-white/80 !py-2">
            <form
                action={PostComposerController.url()}
                method="post"
                noValidate
                onSubmit={handleSubmit}
            >
                <CardContent
                    className={cn(
                        'px-3 pt-3 sm:px-6 sm:pt-2',
                        isExpanded || shouldStayExpanded
                            ? 'pb-3 space-y-3 sm:pb-2 sm:space-y-6'
                            : 'pb-0 space-y-0 sm:pb-0 sm:space-y-6',
                    )}
                >
                    {!config.can_post && (
                        <Alert
                            variant="destructive"
                            className="border-rose-500/40 bg-rose-500/10 text-sm text-rose-100"
                        >
                            <Shield className="size-4" />
                            <AlertDescription>
                                Finish onboarding to unlock posting. Head to
                                profile basics to complete your setup.
                            </AlertDescription>
                        </Alert>
                    )}

                    {submitError && (
                        <Alert variant="destructive">
                            <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2.5 sm:gap-4 sm:items-start">
                        <ComposerAvatar />
                        <div
                            className={cn(
                                'flex-1 min-w-0',
                                isExpanded || shouldStayExpanded
                                    ? 'space-y-3'
                                    : 'space-y-0',
                            )}
                        >
                            <div className="space-y-2 sm:space-y-3">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-2xl border border-white/10 bg-black/30 transition-all duration-300 sm:rounded-3xl" />
                                    <div
                                        ref={overlayRef}
                                        className={cn(
                                            'pointer-events-none absolute inset-0 overflow-y-auto rounded-2xl px-3 py-2.5 text-sm leading-relaxed text-white transition-all duration-300 sm:rounded-3xl sm:px-5 sm:py-4 sm:text-base',
                                        )}
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: overlayContent,
                                            }}
                                        />
                                    </div>
                                    <textarea
                                        ref={textareaRef}
                                        value={formData.body}
                                        onChange={(event) =>
                                            handleBodyChange(event.target.value)
                                        }
                                        onFocus={handleTextareaFocus}
                                        onBlur={handleTextareaBlur}
                                        onScroll={syncOverlayScroll}
                                        placeholder=""
                                        className={cn(
                                            'relative z-10 w-full resize-none rounded-2xl border border-transparent bg-transparent px-3 py-2.5 text-sm text-transparent caret-white transition-all duration-300 focus:ring-2 focus:ring-rose-500/30 focus:outline-none disabled:opacity-60 sm:rounded-3xl sm:px-5 sm:py-4 sm:text-base',
                                            isExpanded
                                                ? 'min-h-[100px] sm:min-h-[170px]'
                                                : 'min-h-[60px] sm:min-h-[80px]',
                                        )}
                                        maxLength={BODY_CHARACTER_LIMIT}
                                        disabled={
                                            !config.can_post || form.processing
                                        }
                                    />
                                    <div
                                        className={cn(
                                            'pointer-events-none absolute right-2.5 bottom-2.5 text-[0.6rem] sm:right-5 sm:bottom-4 sm:text-[0.65rem]',
                                            bodyCounterClass,
                                        )}
                                        aria-live="polite"
                                    >
                                        {bodyCharacterCount.toLocaleString()}/
                                        {BODY_CHARACTER_LIMIT.toLocaleString()}
                                    </div>
                                </div>

                                {form.errors.body && (
                                    <p className="text-xs text-rose-300">
                                        {form.errors.body}
                                    </p>
                                )}
                            </div>

                            <div
                                className={cn(
                                    'mb-2 flex flex-col gap-2.5 overflow-hidden transition-all duration-300 sm:mb-3 sm:gap-3',
                                    isExpanded
                                        ? 'max-h-[500px] opacity-100'
                                        : 'max-h-0 opacity-0',
                                )}
                            >
                                <TooltipProvider delayDuration={300}>
                                <div className="flex flex-wrap items-center gap-1.5 sm:justify-between sm:gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <ComposerIconButton
                                            icon={ImageIcon}
                                            label="Add media"
                                            onClick={handleMediaButton}
                                            active={mediaSectionVisible}
                                            disabled={toolbarDisabled}
                                        />
                                        <ComposerIconButton
                                            icon={BarChart3}
                                            label="Add poll"
                                            onClick={handlePollButton}
                                            active={pollSectionVisible}
                                            disabled={toolbarDisabled}
                                        />
                                        <ComposerIconButton
                                            icon={Clock3}
                                            label="Schedule publish"
                                            onClick={handleScheduleToggle}
                                            active={scheduleOpen}
                                            disabled={toolbarDisabled}
                                        />
                                        {signalsEnabled && (
                                            <ComposerIconButton
                                                icon={Lock}
                                                label="Toggle paywall"
                                                onClick={handlePaywallToggle}
                                                active={paywallActive}
                                                disabled={
                                                    toolbarDisabled ||
                                                    !payToViewAvailable
                                                }
                                            />
                                        )}
                                        {signalsEnabled && (
                                            <ComposerIconButton
                                                icon={Target}
                                                label="Tip goal"
                                                onClick={handleTipGoalToggle}
                                                active={tipGoalOpen}
                                                disabled={toolbarDisabled}
                                            />
                                        )}
                                        <ComposerIconButton
                                            icon={Thumbtack}
                                            label="Pin post"
                                            onClick={handlePinToggle}
                                            active={formData.is_pinned}
                                            disabled={toolbarDisabled}
                                        />
                                        {circlesEnabled && (
                                            <ComposerIconButton
                                                icon={Users}
                                                label="Share to circles"
                                                onClick={togglePostToCircles}
                                                active={formData.post_to_circles}
                                                disabled={toolbarDisabled}
                                            />
                                        )}
                                    </div>
                                    <select
                                        value={formData.audience}
                                        onChange={(event) =>
                                            handleAudienceSelect(
                                                event.target.value,
                                            )
                                        }
                                        disabled={toolbarDisabled}
                                        aria-label="Select audience"
                                        className="h-9 w-full min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/80 focus:border-white/40 focus:ring-2 focus:ring-rose-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-auto sm:min-w-[180px] sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                                    >
                                        {audienceOptions.map(
                                            ({ value, label }) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                                </TooltipProvider>
                            </div>

                            {scheduleOpen && (
                                <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 sm:rounded-2xl sm:p-5">
                                    <Label className="text-xs tracking-[0.3em] text-white/45 uppercase">
                                        Schedule publish
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.scheduled_at ?? ''}
                                        onChange={(event) =>
                                            setFormData(
                                                'scheduled_at',
                                                event.target.value
                                                    ? event.target.value
                                                    : null,
                                            )
                                        }
                                        disabled={
                                            !config.can_post || form.processing
                                        }
                                        className="h-11 border-white/10 bg-white/5 text-sm text-white/90 sm:h-10"
                                    />
                                    <span className="text-[0.65rem] leading-relaxed text-white/55">
                                        Leave blank to share immediately. Times
                                        use your local timezone.
                                    </span>
                                </div>
                            )}

                            {signalsEnabled && paywallActive && (
                                <div className="space-y-4 rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-400/15 via-rose-500/10 to-violet-500/10 p-4 sm:rounded-2xl sm:p-5">
                                    <p className="text-[0.65rem] tracking-[0.3em] text-amber-100/80 uppercase">
                                        Paywall
                                    </p>
                                    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                                        <div className="space-y-2">
                                            <Label className="text-xs tracking-[0.25em] text-white/50 uppercase">
                                                Price
                                            </Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="19.99"
                                                value={paywallPriceInput}
                                                onChange={(event) =>
                                                    handlePaywallPriceChange(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    !config.can_post ||
                                                    form.processing
                                                }
                                                className="h-11 border-white/20 bg-black/30 text-sm text-white/90 sm:h-10"
                                            />
                                            <span className="text-[0.65rem] leading-relaxed text-white/60">
                                                Minimum $1.00. Unlocks grant
                                                access instantly.
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs tracking-[0.25em] text-white/50 uppercase">
                                                Currency
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {supportedCurrencies.map(
                                                    (currency) => (
                                                        <button
                                                            key={currency}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(
                                                                    'paywall_currency',
                                                                    currency,
                                                                );

                                                                if (
                                                                    paywallActive
                                                                ) {
                                                                    applyPaywallValidation(
                                                                        paywallPriceInput,
                                                                    );
                                                                }
                                                            }}
                                                            disabled={
                                                                !config.can_post ||
                                                                form.processing
                                                            }
                                                            className={cn(
                                                                'min-h-[44px] rounded-full border px-4 py-2 text-xs transition active:scale-95 disabled:cursor-not-allowed sm:min-h-0 sm:px-3 sm:py-1',
                                                                FOCUS_RING,
                                                                formData.paywall_currency ===
                                                                    currency
                                                                    ? 'border-white/40 bg-white/20 text-white'
                                                                    : 'border-white/15 bg-black/20 text-white/65 hover:border-white/30 hover:bg-white/10 hover:text-white',
                                                                (!config.can_post ||
                                                                    form.processing) &&
                                                                    'opacity-60',
                                                            )}
                                                        >
                                                            {currency}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {form.errors.paywall_price && (
                                        <p className="text-xs text-rose-300">
                                            {form.errors.paywall_price}
                                        </p>
                                    )}
                                    {form.errors.paywall_currency && (
                                        <p className="text-xs text-rose-300">
                                            {form.errors.paywall_currency}
                                        </p>
                                    )}
                                    {paywallError && (
                                        <p className="text-xs text-rose-300">
                                            {paywallError}
                                        </p>
                                    )}
                                </div>
                            )}

                            {signalsEnabled && tipGoalOpen && (
                                <div className="space-y-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 sm:rounded-2xl sm:p-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs tracking-[0.25em] text-white/55 uppercase">
                                                Goal amount
                                            </Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="250"
                                                value={tipGoalAmountInput}
                                                onChange={(event) =>
                                                    handleTipGoalAmountChange(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    !config.can_post ||
                                                    form.processing
                                                }
                                                className="h-11 border-white/20 bg-black/30 text-sm text-white/90 sm:h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs tracking-[0.25em] text-white/55 uppercase">
                                                Currency
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {supportedCurrencies.map(
                                                    (currency) => (
                                                        <button
                                                            key={currency}
                                                            type="button"
                                                            onClick={() =>
                                                                handleTipGoalCurrencyChange(
                                                                    currency,
                                                                )
                                                            }
                                                            disabled={
                                                                !config.can_post ||
                                                                form.processing
                                                            }
                                                            className={cn(
                                                                'min-h-[44px] rounded-full border px-4 py-2 text-xs transition active:scale-95 disabled:cursor-not-allowed sm:min-h-0 sm:px-3 sm:py-1',
                                                                FOCUS_RING,
                                                                tipGoalCurrency ===
                                                                    currency
                                                                    ? 'border-white/40 bg-white/20 text-white'
                                                                    : 'border-white/15 bg-black/20 text-white/65 hover:border-white/30 hover:bg-white/10 hover:text-white',
                                                                (!config.can_post ||
                                                                    form.processing) &&
                                                                    'opacity-60',
                                                            )}
                                                        >
                                                            {currency}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs tracking-[0.25em] text-white/55 uppercase">
                                                Goal headline
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Unlock the wax cascade ritual"
                                                value={tipGoalLabel}
                                                onChange={(event) =>
                                                    handleTipGoalLabelChange(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    !config.can_post ||
                                                    form.processing
                                                }
                                                className="h-11 border-white/20 bg-black/30 text-sm text-white/90 sm:h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs tracking-[0.25em] text-white/55 uppercase">
                                                Deadline (optional)
                                            </Label>
                                            <Input
                                                type="datetime-local"
                                                value={tipGoalDeadline}
                                                onChange={(event) =>
                                                    handleTipGoalDeadlineChange(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    !config.can_post ||
                                                    form.processing
                                                }
                                                className="h-11 border-white/20 bg-black/30 text-sm text-white/90 sm:h-10"
                                            />
                                        </div>
                                    </div>
                                    {tipGoalError && (
                                        <p className="text-xs text-rose-300">
                                            {tipGoalError}
                                        </p>
                                    )}
                                </div>
                            )}

                            {mediaSectionVisible && (
                                <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-3 sm:rounded-2xl sm:p-4">
                                    <div className="flex items-center justify-between gap-3 text-xs tracking-[0.3em] text-white/45 uppercase">
                                        <span>Media & teasers</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/30">
                                                {uploaderItems.length}/
                                                {MAX_MEDIA_FILES}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleMediaTrayClose}
                                                className={cn(
                                                    'flex size-10 items-center justify-center rounded-full bg-black/40 text-white/70 transition active:scale-95 hover:bg-black/70 sm:size-8 sm:p-1',
                                                    FOCUS_RING,
                                                )}
                                                aria-label="Remove media"
                                                disabled={toolbarDisabled}
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <FeedMediaUploader
                                            key={uploaderKey}
                                            maxFiles={MAX_MEDIA_FILES}
                                            acceptedMimeTypes={
                                                config.media.accepted_mime_types
                                            }
                                            disabled={toolbarDisabled}
                                            onChange={setUploadedMedia}
                                            onItemsChange={setUploaderItems}
                                        />
                                        {mediaHasErrors && !toolbarDisabled && (
                                            <p className="mt-2 text-xs text-rose-300">
                                                Resolve upload errors before
                                                publishing.
                                            </p>
                                        )}
                                        {form.errors.media && (
                                            <p className="text-xs text-rose-300">
                                                {form.errors.media}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {pollSectionVisible && (
                                <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:rounded-2xl sm:p-5">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <Label className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                                Poll question
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={handlePollTrayClose}
                                                className={cn(
                                                    'min-h-[44px] rounded-full bg-black/30 px-4 py-2 text-xs text-white/70 transition active:scale-95 hover:bg-black/50 sm:min-h-0 sm:px-3 sm:py-1',
                                                    FOCUS_RING,
                                                )}
                                                aria-label="Remove poll"
                                                disabled={toolbarDisabled}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <Input
                                            value={pollDraft.question}
                                            placeholder="What are you asking your audience?"
                                            onChange={(event) =>
                                                setPollDraft((previous) => ({
                                                    ...previous,
                                                    question:
                                                        event.target.value,
                                                }))
                                            }
                                            disabled={
                                                !config.can_post ||
                                                form.processing
                                            }
                                            className="h-11 text-sm sm:h-10"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <Label className="text-xs tracking-[0.25em] text-white/50 uppercase">
                                                Options
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPollDraft((previous) => {
                                                        const nextOptions = [
                                                            ...previous.options,
                                                            {
                                                                id: generateOptionId(),
                                                                value: '',
                                                            },
                                                        ];

                                                        return {
                                                            ...previous,
                                                            options:
                                                                nextOptions,
                                                            max_choices:
                                                                previous.allow_multiple
                                                                    ? Math.min(
                                                                          previous.max_choices ??
                                                                              nextOptions.length,
                                                                          nextOptions.length,
                                                                      )
                                                                    : null,
                                                        };
                                                    })
                                                }
                                                disabled={
                                                    pollDraft.options.length >=
                                                        MAX_POLL_OPTIONS ||
                                                    !config.can_post ||
                                                    form.processing
                                                }
                                                className={cn(
                                                    'flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs tracking-[0.3em] text-white/70 uppercase transition active:scale-95 hover:border-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:px-3 sm:py-1.5',
                                                    FOCUS_RING,
                                                )}
                                            >
                                                <Plus className="size-3.5" />{' '}
                                                Add option
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {pollDraft.options.map(
                                                (option, index) => (
                                                    <div
                                                        key={option.id}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Input
                                                            value={option.value}
                                                            placeholder={`Option ${index + 1}`}
                                                            onChange={(event) =>
                                                                setPollDraft(
                                                                    (
                                                                        previous,
                                                                    ) => ({
                                                                        ...previous,
                                                                        options:
                                                                            previous.options.map(
                                                                                (
                                                                                    existing,
                                                                                ) =>
                                                                                    existing.id ===
                                                                                    option.id
                                                                                        ? {
                                                                                              ...existing,
                                                                                              value: event
                                                                                                  .target
                                                                                                  .value,
                                                                                          }
                                                                                        : existing,
                                                                            ),
                                                                    }),
                                                                )
                                                            }
                                                            disabled={
                                                                !config.can_post ||
                                                                form.processing
                                                            }
                                                            className="h-11 flex-1 text-sm sm:h-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPollDraft(
                                                                    (
                                                                        previous,
                                                                    ) => {
                                                                        const nextOptions =
                                                                            previous.options.filter(
                                                                                (
                                                                                    existing,
                                                                                ) =>
                                                                                    existing.id !==
                                                                                    option.id,
                                                                            );

                                                                        return {
                                                                            ...previous,
                                                                            options:
                                                                                nextOptions,
                                                                            max_choices:
                                                                                previous.allow_multiple
                                                                                    ? Math.min(
                                                                                          previous.max_choices ??
                                                                                              nextOptions.length,
                                                                                          nextOptions.length,
                                                                                      )
                                                                                    : null,
                                                                        };
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                pollDraft
                                                                    .options
                                                                    .length <=
                                                                    MIN_POLL_OPTIONS ||
                                                                !config.can_post ||
                                                                form.processing
                                                            }
                                                            className={cn(
                                                                'flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 transition active:scale-95 hover:border-white/30 hover:bg-black/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:size-8 sm:p-1',
                                                                FOCUS_RING,
                                                            )}
                                                            aria-label={`Remove option ${index + 1}`}
                                                        >
                                                            <X className="size-3.5" />
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <IconToggle
                                            icon={Check}
                                            label="Multiple choice"
                                            active={pollDraft.allow_multiple}
                                            onClick={() =>
                                                setPollDraft((previous) => ({
                                                    ...previous,
                                                    allow_multiple:
                                                        !previous.allow_multiple,
                                                    max_choices:
                                                        !previous.allow_multiple
                                                            ? Math.min(
                                                                  previous.max_choices ??
                                                                      Math.min(
                                                                          previous
                                                                              .options
                                                                              .length,
                                                                          2,
                                                                      ),
                                                                  previous
                                                                      .options
                                                                      .length,
                                                              )
                                                            : null,
                                                }))
                                            }
                                            disabled={
                                                !config.can_post ||
                                                form.processing
                                            }
                                            collapseLabel={false}
                                        />

                                        {pollDraft.allow_multiple && (
                                            <Input
                                                type="number"
                                                min={2}
                                                max={pollDraft.options.length}
                                                value={
                                                    pollDraft.max_choices ?? ''
                                                }
                                                onChange={(event) => {
                                                    const value =
                                                        event.target.value.trim() ===
                                                        ''
                                                            ? null
                                                            : Number(
                                                                  event.target
                                                                      .value,
                                                              );
                                                    setPollDraft(
                                                        (previous) => ({
                                                            ...previous,
                                                            max_choices: value,
                                                        }),
                                                    );
                                                }}
                                                disabled={
                                                    !config.can_post ||
                                                    form.processing
                                                }
                                                className="h-11 w-full text-sm sm:h-10 sm:w-32"
                                                placeholder="Max choices"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs tracking-[0.25em] text-white/50 uppercase">
                                            Closes at (optional)
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={pollDraft.closes_at}
                                            onChange={(event) =>
                                                setPollDraft((previous) => ({
                                                    ...previous,
                                                    closes_at:
                                                        event.target.value,
                                                }))
                                            }
                                            disabled={
                                                !config.can_post ||
                                                form.processing
                                            }
                                            className="h-11 w-full text-sm sm:h-10 sm:w-64"
                                        />
                                    </div>

                                    {pollErrors.length > 0 && (
                                        <div className="space-y-1 text-xs text-rose-300">
                                            {pollErrors.map((message) => (
                                                <p key={message}>{message}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {Object.entries(form.errors)
                                .filter(
                                    ([field]) =>
                                        field !== 'media' &&
                                        field !== 'hashtags' &&
                                        field !== 'body' &&
                                        field !== 'paywall_price' &&
                                        field !== 'paywall_currency' &&
                                        !field.startsWith('poll.'),
                                )
                                .map(([field, message]) => (
                                    <p
                                        key={field}
                                        className="text-xs text-rose-300"
                                    >
                                        {message}
                                    </p>
                                ))}
                        </div>
                    </div>
                </CardContent>

                {(isExpanded || shouldStayExpanded) && (
                <CardFooter className="flex justify-end border-t border-white/10 p-3 pt-3 transition-all duration-300 sm:p-6">
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="h-10 w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] transition active:scale-95 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:w-auto sm:px-6"
                    >
                        {form.processing ? 'Publishing…' : 'Share update'}
                    </Button>
                </CardFooter>
                )}
            </form>
        </Card>
    );
}
