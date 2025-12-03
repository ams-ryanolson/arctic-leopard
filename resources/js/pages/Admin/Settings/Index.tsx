import AgeConsentModal from '@/components/age-consent-modal';
import AnnouncementBar from '@/components/announcement-bar';
import CookiesBanner from '@/components/cookies-banner';
import MediaUploader from '@/components/media/MediaUploader';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Cookie as CookieIcon,
    ExternalLink,
    Image as ImageIcon,
    Loader2,
    Mail,
    Megaphone,
    Save,
    ScrollText,
    Search,
    Settings as SettingsIcon,
    ShieldCheck,
    Upload,
    X,
} from 'lucide-react';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
// (Cookie preferences sheet imports removed for now)

type AdminSetting = {
    key: string;
    value: string | number | boolean;
    description: string | null;
    type: 'string' | 'integer' | 'boolean' | 'json';
    category: string;
};

type AdminSettingsPageProps = {
    settings: AdminSetting[];
    categories: string[];
    selectedCategory: string;
};

export default function AdminSettingsIndex({
    settings,
}: AdminSettingsPageProps) {
    type UiState = {
        // Branding
        site_name: string;
        site_tagline: string;
        site_logo_url: string;
        site_logo_2x_url: string;
        site_logo_dark_url: string;
        site_logo_dark_2x_url: string;
        favicon_url: string;
        app_icon_url: string;
        og_default_image_url: string;
        // Communication & Support
        support_email: string;
        legal_email: string;
        press_email: string;
        abuse_email: string;
        outbound_from_name: string;
        outbound_from_email: string;
        contact_url: string;
        // Announcements & Maintenance
        global_announcement_enabled: boolean;
        global_announcement_level: 'info' | 'warn' | 'urgent';
        global_announcement_message: string;
        global_announcement_dismissible: boolean;
        global_announcement_start_at: string;
        global_announcement_end_at: string;
        maintenance_banner_enabled: boolean;
        maintenance_banner_message: string;
        maintenance_banner_cta_label: string;
        maintenance_banner_cta_url: string;
        emergency_interstitial_enabled: boolean;
        emergency_interstitial_message: string;
        // Feature Flags (global)
        feature_ads_enabled: boolean;
        feature_radar_enabled: boolean;
        feature_signals_enabled: boolean;
        feature_video_chat_enabled: boolean;
        feature_messaging_enabled: boolean;
        feature_events_enabled: boolean;
        feature_bookmarks_enabled: boolean;
        feature_circles_enabled: boolean;
        feature_stories_enabled: boolean;
        feature_beta_enabled: boolean;
        // SEO & Social
        seo_default_title: string;
        seo_default_description: string;
        robots_index_enabled: boolean;
        canonical_host: string;
        twitter_card_type: 'summary' | 'summary_large_image';
        // Performance & Caching
        cdn_base_url: string;
        public_cache_ttl_seconds: number;
        image_presets: Array<{
            name: string;
            width: number;
            height: number;
            fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
        }>;
        // Compliance & Legal
        terms_content: string;
        privacy_content: string;
        guidelines_content: string;
        cookie_policy_url: string;
        dmca_policy_url: string;
        age_of_consent_text: string;
        // Cookies & GDPR
        cookie_banner_enabled: boolean;
        cookie_banner_message: string;
        cookie_banner_cta_label: string;
        cookie_banner_policy_url: string;
        cookie_allow_analytics: boolean;
        cookie_allow_marketing: boolean;
        cookies_services: Array<{ name: string; url: string }>;
        // Age Verification
        age_gate_enabled: boolean;
        age_gate_minimum: number;
        age_gate_message: string;
    };
    // Mock UI state for new sections (no backend calls yet)
    const [ui, setUi] = useState<UiState>(() => ({
        // Branding
        site_name: '',
        site_tagline: '',
        site_logo_url: '',
        site_logo_2x_url: '',
        site_logo_dark_url: '',
        site_logo_dark_2x_url: '',
        favicon_url: '',
        app_icon_url: '',
        og_default_image_url: '',
        // Communication & Support
        support_email: '',
        legal_email: '',
        press_email: '',
        abuse_email: '',
        outbound_from_name: '',
        outbound_from_email: '',
        contact_url: '',
        // Announcements & Maintenance
        global_announcement_enabled: false,
        global_announcement_level: 'info' as 'info' | 'warn' | 'urgent',
        global_announcement_message: '',
        global_announcement_dismissible: true,
        global_announcement_start_at: '',
        global_announcement_end_at: '',
        maintenance_banner_enabled: false,
        maintenance_banner_message: '',
        maintenance_banner_cta_label: '',
        maintenance_banner_cta_url: '',
        emergency_interstitial_enabled: false,
        emergency_interstitial_message: '',
        // Feature Flags (global)
        feature_ads_enabled: false,
        feature_radar_enabled: true,
        feature_signals_enabled: true,
        feature_video_chat_enabled: false,
        feature_messaging_enabled: true,
        feature_events_enabled: true,
        feature_bookmarks_enabled: true,
        feature_circles_enabled: true,
        feature_stories_enabled: true,
        feature_beta_enabled: false,
        // SEO & Social
        seo_default_title: '',
        seo_default_description: '',
        robots_index_enabled: true,
        canonical_host: '',
        twitter_card_type: 'summary_large_image' as
            | 'summary'
            | 'summary_large_image',
        // Performance & Caching
        cdn_base_url: '',
        public_cache_ttl_seconds: 300,
        image_presets: [
            { name: 'thumb', width: 320, height: 320, fit: 'cover' as const },
        ],
        // Compliance & Legal
        terms_content: '',
        privacy_content: '',
        guidelines_content: '',
        cookie_policy_url: '',
        dmca_policy_url: '',
        age_of_consent_text: 'You must be 18 or older to use this site.',
        // Cookies & GDPR
        cookie_banner_enabled: false,
        cookie_banner_message: '',
        cookie_banner_cta_label: 'Accept',
        cookie_banner_policy_url: '',
        cookie_allow_analytics: false,
        cookie_allow_marketing: false,
        cookies_services: [],
        // Age Verification
        age_gate_enabled: true,
        age_gate_minimum: 18,
        age_gate_message: 'You must be 18 or older to use this site.',
    }));

    const update = <K extends keyof UiState>(key: K, value: UiState[K]) =>
        setUi((s) => ({ ...s, [key]: value }));
    // (Presets logic removed with Performance section)

    const handleLogoUploadComplete = async (
        logoType: string,
        identifiers: string[],
    ) => {
        if (identifiers.length === 0) {
            return;
        }

        const key = `upload_${logoType}`;
        setUploading((prev) => ({ ...prev, [key]: true }));

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';

            // Send identifier to backend for processing
            const processResponse = await fetch(
                '/admin/settings/branding/upload',
                {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'X-XSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        logo_type: logoType,
                        identifier: identifiers[0],
                    }),
                },
            );

            if (!processResponse.ok) {
                throw new Error('Processing failed');
            }

            const data = await processResponse.json();
            const settingKeyMap: Record<string, keyof UiState> = {
                light_1x: 'site_logo_url',
                light_2x: 'site_logo_2x_url',
                dark_1x: 'site_logo_dark_url',
                dark_2x: 'site_logo_dark_2x_url',
                favicon: 'favicon_url',
                app_icon: 'app_icon_url',
                og_default: 'og_default_image_url',
            };

            const settingKey = settingKeyMap[logoType];
            if (settingKey && data.url) {
                setValues((prev) => ({ ...prev, [settingKey]: data.url }));
                router.reload({ only: ['settings'] });
            }
        } catch (error) {
            console.error('Upload error:', error);
            setStatus({
                section: null,
                type: 'error',
                message: `Failed to upload ${logoType}`,
            });
        } finally {
            setUploading((prev) => ({ ...prev, [key]: false }));
        }
    };

    const [processing, setProcessing] = useState<string | null>(null);
    const [status, setStatus] = useState<{
        section: 'features' | 'comms' | 'ann' | null;
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [preview, setPreview] = useState<
        null | 'announcement' | 'maintenance' | 'emergency'
    >(null);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    useEffect(() => {
        const handler = () => setPreview(null);
        window.addEventListener(
            'rk-announcement-preview-close',
            handler as any,
        );
        return () =>
            window.removeEventListener(
                'rk-announcement-preview-close',
                handler as any,
            );
    }, []);
    const [values, setValues] = useState<
        Record<string, string | number | boolean>
    >(() => {
        const initial: Record<string, string | number | boolean> = {};
        settings.forEach((setting) => {
            initial[setting.key] = setting.value;
        });
        return initial;
    });
    // Leave prompt on unsaved changes
    useEffect(() => {
        const commKeys = [
            'support_email',
            'legal_email',
            'press_email',
            'abuse_email',
            'outbound_from_name',
            'outbound_from_email',
            'contact_url',
        ] as const;
        const isDirtyComms = commKeys.some(
            (k) =>
                String(settings.find((s) => s.key === k)?.value ?? '') !==
                String(values[k] ?? ''),
        );
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirtyComms) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values]);

    const seoTitleCount = useMemo(
        () => ui.seo_default_title?.length ?? 0,
        [ui.seo_default_title],
    );
    const seoDescCount = useMemo(
        () => ui.seo_default_description?.length ?? 0,
        [ui.seo_default_description],
    );

    // Side navigation for sections
    const sections = [
        { id: 'branding', title: 'Branding', icon: ImageIcon },
        { id: 'comms', title: 'Communication & Support', icon: Mail },
        {
            id: 'announcements',
            title: 'Announcements & Maintenance',
            icon: Megaphone,
        },
        { id: 'seo', title: 'SEO & Social', icon: Search },
        { id: 'legal', title: 'Compliance & Legal', icon: ScrollText },
        { id: 'cookies', title: 'Cookies & GDPR', icon: CookieIcon },
        { id: 'age', title: 'Age Verification', icon: ShieldCheck },
    ] as const;
    const [activeSection, setActiveSection] =
        useState<(typeof sections)[number]['id']>('branding');
    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top,
                    );
                if (visible[0]?.target?.id) {
                    setActiveSection(
                        visible[0].target.id as typeof activeSection,
                    );
                }
            },
            {
                rootMargin: '-40% 0px -55% 0px',
                threshold: [0, 0.25, 0.5, 0.75, 1],
            },
        );
        sections.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = (e: FormEvent<HTMLFormElement>, key: string) => {
        e.preventDefault();
        if (processing) {
            return;
        }

        setProcessing(key);

        router.patch(
            `/admin/settings/${key}`,
            { value: values[key] },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(null),
            },
        );
    };

    const verificationSettings = settings.filter(
        (s) => s.category === 'verification',
    );
    const _otherSettings = settings.filter(
        (s) => s.category !== 'verification' && !s.key.startsWith('feature_'),
    );
    const commKeys = [
        'support_email',
        'legal_email',
        'press_email',
        'abuse_email',
        'outbound_from_name',
        'outbound_from_email',
        'contact_url',
    ] as const;
    const commConfiguredCount = useMemo(() => {
        return commKeys.reduce((acc, k) => {
            const v = String(values[k] ?? '').trim();
            return acc + (v.length > 0 ? 1 : 0);
        }, 0);
    }, [values]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: '/admin' },
                { title: 'Settings', href: '/admin/settings' },
            ]}
        >
            <Head title="Admin Settings" />

            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Admin Settings
                    </h1>
                    <p className="mt-2 text-sm text-white/70">
                        Manage application-wide configuration settings
                    </p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Side Menu */}
                    <aside className="w-full lg:w-64 lg:shrink-0">
                        <nav className="sticky top-20 flex max-h-[80vh] flex-col gap-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent p-2 shadow-[0_28px_72px_-55px_rgba(249,115,22,0.45)] backdrop-blur-sm transition hover:border-white/20 hover:shadow-[0_20px_60px_-40px_rgba(249,115,22,0.3)]">
                            {sections.map((s) => {
                                const selected = activeSection === s.id;
                                const Icon = s.icon;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => scrollTo(s.id)}
                                        className={[
                                            'relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-300',
                                            selected
                                                ? 'scale-[1.02] border border-amber-400/30 bg-gradient-to-r from-amber-400/20 via-amber-400/10 to-transparent text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.45)]'
                                                : 'text-white/70 hover:translate-x-[1px] hover:bg-white/10 hover:text-white',
                                        ].join(' ')}
                                    >
                                        {Icon && (
                                            <div
                                                className={[
                                                    'flex items-center justify-center rounded-lg transition-all duration-300',
                                                    selected
                                                        ? 'scale-110 bg-gradient-to-br from-amber-400/20 to-amber-500/10 p-1.5 ring-1 ring-amber-400/30'
                                                        : 'p-1.5',
                                                ].join(' ')}
                                            >
                                                <Icon
                                                    className={
                                                        selected
                                                            ? 'size-4 text-amber-200'
                                                            : 'size-4 opacity-80'
                                                    }
                                                />
                                            </div>
                                        )}
                                        <span className="flex-1">
                                            {s.title}
                                        </span>
                                        {selected && (
                                            <span className="absolute top-1/2 right-2 size-2 -translate-y-1/2 animate-pulse rounded-full bg-amber-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    <div className="flex-1 space-y-10">
                        {/* BRANDING */}
                        <section id="branding">
                            <Card className="border-2 border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm transition hover:border-white/20 hover:shadow-[0_20px_60px_-40px_rgba(249,115,22,0.3)]">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-white">
                                        <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-pink-500/5 p-2.5 shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] ring-1 ring-purple-400/20">
                                            <ImageIcon className="size-5 text-purple-200" />
                                        </div>
                                        <span>Branding</span>
                                    </CardTitle>
                                    <CardDescription className="text-white/70">
                                        Site name, tagline, logos and colors
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="site_name"
                                                className="text-white"
                                            >
                                                Site Name
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="site_name"
                                                    className="border-2 border-white/10 bg-white/5 text-white transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                                                    value={ui.site_name}
                                                    onChange={(e) =>
                                                        update(
                                                            'site_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Real Kink Men"
                                                />
                                                <div className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 blur-xl transition-opacity focus-within:opacity-100" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="site_tagline"
                                                className="text-white"
                                            >
                                                Tagline
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="site_tagline"
                                                    className="border-2 border-white/10 bg-white/5 text-white transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                                                    value={ui.site_tagline}
                                                    onChange={(e) =>
                                                        update(
                                                            'site_tagline',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Live Your Fetish Out Loud"
                                                />
                                                <div className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 blur-xl transition-opacity focus-within:opacity-100" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logo Upload Cards */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium text-white">
                                            Logos
                                        </Label>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {(
                                                [
                                                    {
                                                        type: 'light_1x',
                                                        label: 'Logo (Light) 1x',
                                                        key: 'site_logo_url' as const,
                                                        size: 'h-16',
                                                        bg: undefined,
                                                    },
                                                    {
                                                        type: 'light_2x',
                                                        label: 'Logo (Light) 2x',
                                                        key: 'site_logo_2x_url' as const,
                                                        size: 'h-16',
                                                        bg: undefined,
                                                    },
                                                    {
                                                        type: 'dark_1x',
                                                        label: 'Logo (Dark) 1x',
                                                        key: 'site_logo_dark_url' as const,
                                                        size: 'h-16',
                                                        bg: 'bg-neutral-900',
                                                    },
                                                    {
                                                        type: 'dark_2x',
                                                        label: 'Logo (Dark) 2x',
                                                        key: 'site_logo_dark_2x_url' as const,
                                                        size: 'h-16',
                                                        bg: 'bg-neutral-900',
                                                    },
                                                ] as const
                                            ).map(
                                                ({
                                                    type,
                                                    label,
                                                    key,
                                                    size,
                                                    bg,
                                                }) => {
                                                    const currentUrl = String(
                                                        values[key] ?? '',
                                                    );
                                                    const isUploading =
                                                        uploading[
                                                            `upload_${type}`
                                                        ];
                                                    const fileInputId = `file-input-${type}`;

                                                    return (
                                                        <div
                                                            key={type}
                                                            className="space-y-2"
                                                        >
                                                            <Label className="text-xs text-white">
                                                                {label}
                                                            </Label>
                                                            <div
                                                                onClick={() =>
                                                                    !isUploading &&
                                                                    document
                                                                        .getElementById(
                                                                            fileInputId,
                                                                        )
                                                                        ?.click()
                                                                }
                                                                className={[
                                                                    'relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition',
                                                                    currentUrl
                                                                        ? 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                                                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5',
                                                                    isUploading &&
                                                                        'cursor-not-allowed opacity-50',
                                                                    bg || '',
                                                                ].join(' ')}
                                                                style={{
                                                                    minHeight:
                                                                        '80px',
                                                                }}
                                                            >
                                                                <MediaUploader
                                                                    accept="image/png,image/svg+xml,image/webp"
                                                                    maxFiles={1}
                                                                    multiple={
                                                                        false
                                                                    }
                                                                    onUploadComplete={(
                                                                        identifiers,
                                                                    ) =>
                                                                        handleLogoUploadComplete(
                                                                            type,
                                                                            identifiers,
                                                                        )
                                                                    }
                                                                    onError={(
                                                                        error,
                                                                    ) => {
                                                                        setStatus(
                                                                            {
                                                                                section:
                                                                                    null,
                                                                                type: 'error',
                                                                                message: `Failed to upload ${type}: ${error}`,
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="hidden"
                                                                />
                                                                {isUploading ? (
                                                                    <Loader2 className="size-6 animate-spin text-white/60" />
                                                                ) : currentUrl ? (
                                                                    <>
                                                                        <img
                                                                            src={
                                                                                currentUrl
                                                                            }
                                                                            alt={
                                                                                label
                                                                            }
                                                                            className={`${size} object-contain p-2`}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                setValues(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        [key]: '',
                                                                                    }),
                                                                                );
                                                                            }}
                                                                            className="absolute top-2 right-2 rounded-full border border-red-500/30 bg-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/30"
                                                                        >
                                                                            <X className="size-3.5" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-2 text-white/50">
                                                                        <Upload className="size-6" />
                                                                        <span className="text-xs">
                                                                            Click
                                                                            to
                                                                            upload
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>

                                    {/* Other Assets */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium text-white">
                                            Other Assets
                                        </Label>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            {(
                                                [
                                                    {
                                                        type: 'favicon',
                                                        label: 'Favicon',
                                                        key: 'favicon_url' as const,
                                                        size: 'h-12 w-12',
                                                    },
                                                    {
                                                        type: 'app_icon',
                                                        label: 'App Icon',
                                                        key: 'app_icon_url' as const,
                                                        size: 'h-16 w-16',
                                                    },
                                                    {
                                                        type: 'og_default',
                                                        label: 'OG Default Image',
                                                        key: 'og_default_image_url' as const,
                                                        size: 'h-24 w-full',
                                                    },
                                                ] as const
                                            ).map(
                                                ({
                                                    type,
                                                    label,
                                                    key,
                                                    size,
                                                }) => {
                                                    const currentUrl = String(
                                                        values[key] ?? '',
                                                    );
                                                    const isUploading =
                                                        uploading[
                                                            `upload_${type}`
                                                        ];
                                                    const fileInputId = `file-input-${type}`;

                                                    return (
                                                        <div
                                                            key={type}
                                                            className="space-y-2"
                                                        >
                                                            <Label className="text-xs text-white">
                                                                {label}
                                                            </Label>
                                                            <div
                                                                onClick={() =>
                                                                    !isUploading &&
                                                                    document
                                                                        .getElementById(
                                                                            fileInputId,
                                                                        )
                                                                        ?.click()
                                                                }
                                                                className={[
                                                                    'relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition',
                                                                    currentUrl
                                                                        ? 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                                                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5',
                                                                    isUploading &&
                                                                        'cursor-not-allowed opacity-50',
                                                                    size ===
                                                                    'h-24 w-full'
                                                                        ? 'aspect-video'
                                                                        : '',
                                                                ].join(' ')}
                                                                style={
                                                                    size ===
                                                                    'h-24 w-full'
                                                                        ? {}
                                                                        : {
                                                                              minHeight:
                                                                                  '80px',
                                                                          }
                                                                }
                                                            >
                                                                <MediaUploader
                                                                    accept={
                                                                        type ===
                                                                        'favicon'
                                                                            ? 'image/png,image/x-icon,image/svg+xml'
                                                                            : type ===
                                                                                'app_icon'
                                                                              ? 'image/png,image/svg+xml'
                                                                              : 'image/jpeg,image/png,image/webp'
                                                                    }
                                                                    maxFiles={1}
                                                                    multiple={
                                                                        false
                                                                    }
                                                                    onUploadComplete={(
                                                                        identifiers,
                                                                    ) =>
                                                                        handleLogoUploadComplete(
                                                                            type,
                                                                            identifiers,
                                                                        )
                                                                    }
                                                                    onError={(
                                                                        error,
                                                                    ) => {
                                                                        setStatus(
                                                                            {
                                                                                section:
                                                                                    null,
                                                                                type: 'error',
                                                                                message: `Failed to upload ${type}: ${error}`,
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="hidden"
                                                                />
                                                                {isUploading ? (
                                                                    <Loader2 className="size-6 animate-spin text-white/60" />
                                                                ) : currentUrl ? (
                                                                    <>
                                                                        <img
                                                                            src={
                                                                                currentUrl
                                                                            }
                                                                            alt={
                                                                                label
                                                                            }
                                                                            className={`${size} object-contain ${size === 'h-24 w-full' ? 'object-cover' : 'p-2'}`}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                setValues(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        [key]: '',
                                                                                    }),
                                                                                );
                                                                            }}
                                                                            className="absolute top-2 right-2 rounded-full border border-red-500/30 bg-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/30"
                                                                        >
                                                                            <X className="size-3.5" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-2 text-white/50">
                                                                        <Upload className="size-6" />
                                                                        <span className="text-xs">
                                                                            Click
                                                                            to
                                                                            upload
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* COMMUNICATION & SUPPORT */}
                        <section id="comms">
                            <Card className="border-2 border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm transition hover:border-white/20 hover:shadow-[0_20px_60px_-40px_rgba(249,115,22,0.3)]">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-white">
                                        <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-cyan-500/5 p-2.5 shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)] ring-1 ring-blue-400/20">
                                            <Mail className="size-5 text-blue-200" />
                                        </div>
                                        <span>Communication & Support</span>
                                        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-blue-400/35 bg-blue-400/15 px-2.5 py-1 text-[10px] font-semibold text-blue-200">
                                            <span className="relative flex size-1.5">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-75"></span>
                                                <span className="relative inline-flex h-full w-full rounded-full bg-blue-300"></span>
                                            </span>
                                            {commConfiguredCount}/
                                            {commKeys.length} configured
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-white/70">
                                        Configure public contact points and
                                        outbound sender identity. Use
                                        organizational mailboxes when possible.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-white/85"
                                            onClick={() => {
                                                if (
                                                    !confirm(
                                                        'Clear all Communication & Support fields?',
                                                    )
                                                )
                                                    return;
                                                const next = { ...values };
                                                (
                                                    commKeys as readonly string[]
                                                ).forEach((k) => {
                                                    next[k] = '';
                                                });
                                                setValues(next);
                                            }}
                                        >
                                            Clear all
                                        </Button>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {(
                                            [
                                                [
                                                    'support_email',
                                                    'Support Email',
                                                ],
                                                ['legal_email', 'Legal Email'],
                                                [
                                                    'press_email',
                                                    'Press/Media Email',
                                                ],
                                                [
                                                    'abuse_email',
                                                    'Abuse Reports Email',
                                                ],
                                            ] as const
                                        ).map(([key, label]) => (
                                            <div
                                                className="space-y-2"
                                                key={key}
                                            >
                                                <Label className="flex items-center gap-2 text-white">
                                                    <span>{label}</span>
                                                    {String(
                                                        settings.find(
                                                            (s) =>
                                                                s.key === key,
                                                        )?.value ?? '',
                                                    ) !==
                                                        String(
                                                            values[key] ?? '',
                                                        ) && (
                                                        <span
                                                            className="relative inline-flex size-2"
                                                            aria-label="Changed"
                                                        >
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                                            <span className="relative inline-flex h-full w-full rounded-full bg-amber-400"></span>
                                                        </span>
                                                    )}
                                                </Label>
                                                <div className="relative">
                                                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/50" />
                                                    <Input
                                                        className="border-white/10 bg-white/5 pl-9 text-white"
                                                        type="email"
                                                        value={String(
                                                            values[key] ?? '',
                                                        )}
                                                        onChange={(e) =>
                                                            setValues(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [key]: e
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="name@example.com"
                                                    />
                                                </div>
                                                <p className="text-xs text-white/50">
                                                    Must be a valid email
                                                    address.
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-white">
                                                <span>Outbound From Name</span>
                                                {String(
                                                    settings.find(
                                                        (s) =>
                                                            s.key ===
                                                            'outbound_from_name',
                                                    )?.value ?? '',
                                                ) !==
                                                    String(
                                                        values.outbound_from_name ??
                                                            '',
                                                    ) && (
                                                    <span
                                                        className="relative inline-flex size-2"
                                                        aria-label="Changed"
                                                    >
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                                        <span className="relative inline-flex h-full w-full rounded-full bg-amber-400"></span>
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                className="border-white/10 bg-white/5 text-white"
                                                value={String(
                                                    values.outbound_from_name ??
                                                        '',
                                                )}
                                                onChange={(e) =>
                                                    setValues((prev) => ({
                                                        ...prev,
                                                        outbound_from_name:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                            <p className="text-xs text-white/50">
                                                Displayed as the sender name for
                                                outbound emails.
                                            </p>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="flex items-center gap-2 text-white">
                                                <span>Outbound From Email</span>
                                                {String(
                                                    settings.find(
                                                        (s) =>
                                                            s.key ===
                                                            'outbound_from_email',
                                                    )?.value ?? '',
                                                ) !==
                                                    String(
                                                        values.outbound_from_email ??
                                                            '',
                                                    ) && (
                                                    <span
                                                        className="inline-block size-1.5 rounded-full bg-amber-300"
                                                        aria-label="Changed"
                                                    />
                                                )}
                                            </Label>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/50" />
                                                <Input
                                                    className="border-white/10 bg-white/5 pl-9 text-white"
                                                    type="email"
                                                    value={String(
                                                        values.outbound_from_email ??
                                                            '',
                                                    )}
                                                    onChange={(e) =>
                                                        setValues((prev) => ({
                                                            ...prev,
                                                            outbound_from_email:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <p className="text-xs text-white/50">
                                                Used as the From address for
                                                transactional mail.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-white">
                                            <span>Contact URL</span>
                                            {String(
                                                settings.find(
                                                    (s) =>
                                                        s.key === 'contact_url',
                                                )?.value ?? '',
                                            ) !==
                                                String(
                                                    values.contact_url ?? '',
                                                ) && (
                                                <span
                                                    className="inline-block size-1.5 rounded-full bg-amber-300"
                                                    aria-label="Changed"
                                                />
                                            )}
                                        </Label>
                                        <div className="relative">
                                            <ExternalLink className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/50" />
                                            <Input
                                                className="border-white/10 bg-white/5 pl-9 text-white"
                                                type="url"
                                                value={String(
                                                    values.contact_url ?? '',
                                                )}
                                                onChange={(e) =>
                                                    setValues((prev) => ({
                                                        ...prev,
                                                        contact_url:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <p className="text-xs text-white/50">
                                            A link to your contact form or
                                            support portal.
                                        </p>
                                    </div>
                                    {(() => {
                                        const commKeys = [
                                            'support_email',
                                            'legal_email',
                                            'press_email',
                                            'abuse_email',
                                            'outbound_from_name',
                                            'outbound_from_email',
                                            'contact_url',
                                        ] as const;
                                        const hasChanges = commKeys.some(
                                            (k) => {
                                                const initial =
                                                    settings.find(
                                                        (s) => s.key === k,
                                                    )?.value ?? '';
                                                return (
                                                    String(initial ?? '') !==
                                                    String(values[k] ?? '')
                                                );
                                            },
                                        );
                                        return (
                                            <div
                                                className={[
                                                    'sticky bottom-0 z-[1] mt-2 flex items-center justify-end gap-3 rounded-xl border-2 p-4 backdrop-blur-xl transition',
                                                    hasChanges
                                                        ? 'border-amber-400/30 bg-neutral-900/90 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)] ring-2 ring-amber-400/30'
                                                        : 'border-white/10 bg-neutral-900/80',
                                                ].join(' ')}
                                            >
                                                <span
                                                    aria-live="polite"
                                                    className="min-h-5"
                                                >
                                                    {status?.section ===
                                                        'comms' && (
                                                        <span
                                                            className={[
                                                                'inline-flex items-center gap-2 text-sm',
                                                                status.type ===
                                                                'success'
                                                                    ? 'text-emerald-300'
                                                                    : 'text-red-300',
                                                            ].join(' ')}
                                                        >
                                                            {status.type ===
                                                            'success' ? (
                                                                <CheckCircle2 className="size-4" />
                                                            ) : (
                                                                <AlertCircle className="size-4" />
                                                            )}
                                                            {status.message}
                                                        </span>
                                                    )}
                                                </span>
                                                <Button
                                                    variant={
                                                        hasChanges
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    onClick={() => {
                                                        if (!hasChanges) return;
                                                        const payload: Record<
                                                            string,
                                                            string
                                                        > = {};
                                                        commKeys.forEach(
                                                            (k) => {
                                                                payload[k] =
                                                                    String(
                                                                        values[
                                                                            k
                                                                        ] ?? '',
                                                                    );
                                                            },
                                                        );
                                                        setProcessing('comms');
                                                        setStatus(null);
                                                        router.post(
                                                            adminRoutes.settings.index()
                                                                .url,
                                                            {
                                                                _method:
                                                                    'patch',
                                                                settings:
                                                                    payload,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess: () =>
                                                                    setStatus({
                                                                        section:
                                                                            'comms',
                                                                        type: 'success',
                                                                        message:
                                                                            'Settings saved',
                                                                    }),
                                                                onError: () =>
                                                                    setStatus({
                                                                        section:
                                                                            'comms',
                                                                        type: 'error',
                                                                        message:
                                                                            'Failed to save settings',
                                                                    }),
                                                                onFinish: () =>
                                                                    setProcessing(
                                                                        null,
                                                                    ),
                                                            },
                                                        );
                                                    }}
                                                    disabled={
                                                        !hasChanges ||
                                                        processing === 'comms'
                                                    }
                                                    className={[
                                                        hasChanges
                                                            ? 'border-0 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.45)] transition-all hover:scale-[1.02] hover:shadow-[0_18px_40px_-12px_rgba(249,115,22,0.55)]'
                                                            : '',
                                                    ].join(' ')}
                                                >
                                                    {processing === 'comms' ? (
                                                        <>
                                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 size-4" />
                                                            Save
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </section>

                        {/* ANNOUNCEMENTS & MAINTENANCE */}
                        <section id="announcements">
                            <Card className="border-2 border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm transition hover:border-white/20 hover:shadow-[0_20px_60px_-40px_rgba(249,115,22,0.3)]">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-white">
                                        <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 via-violet-600/10 to-purple-500/5 p-2.5 shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] ring-1 ring-violet-400/20">
                                            <Megaphone className="size-5 text-violet-200" />
                                        </div>
                                        <span>Announcements & Maintenance</span>
                                    </CardTitle>
                                    <CardDescription className="text-white/70">
                                        Show messages to users
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-white">
                                            Global Announcement
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="ga_en"
                                                checked={
                                                    ui.global_announcement_enabled
                                                }
                                                onCheckedChange={(c) =>
                                                    update(
                                                        'global_announcement_enabled',
                                                        c === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="ga_en"
                                                className="text-white"
                                            >
                                                Enabled
                                            </Label>
                                        </div>
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-white">
                                                    Level
                                                </Label>
                                                <Select
                                                    value={
                                                        ui.global_announcement_level
                                                    }
                                                    onValueChange={(v) =>
                                                        update(
                                                            'global_announcement_level',
                                                            v as typeof ui.global_announcement_level,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="info">
                                                            Info
                                                        </SelectItem>
                                                        <SelectItem value="warn">
                                                            Warning
                                                        </SelectItem>
                                                        <SelectItem value="urgent">
                                                            Urgent
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white">
                                                    Dismissible
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={
                                                            ui.global_announcement_dismissible
                                                        }
                                                        onCheckedChange={(c) =>
                                                            update(
                                                                'global_announcement_dismissible',
                                                                c === true,
                                                            )
                                                        }
                                                    />
                                                    <span className="text-sm text-white/80">
                                                        Allow users to dismiss
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white">
                                                Message
                                            </Label>
                                            <Textarea
                                                className="border-white/10 bg-white/5 text-white"
                                                rows={3}
                                                value={
                                                    ui.global_announcement_message
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'global_announcement_message',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-white">
                                                    Start Time
                                                </Label>
                                                <Input
                                                    className="border-white/10 bg-white/5 text-white"
                                                    type="datetime-local"
                                                    value={
                                                        ui.global_announcement_start_at
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            'global_announcement_start_at',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white">
                                                    End Time
                                                </Label>
                                                <Input
                                                    className="border-white/10 bg-white/5 text-white"
                                                    type="datetime-local"
                                                    value={
                                                        ui.global_announcement_end_at
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            'global_announcement_end_at',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setPreview('announcement')
                                                }
                                            >
                                                Preview
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-white">
                                            Maintenance Banner
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="mb_en"
                                                checked={
                                                    ui.maintenance_banner_enabled
                                                }
                                                onCheckedChange={(c) =>
                                                    update(
                                                        'maintenance_banner_enabled',
                                                        c === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="mb_en"
                                                className="text-white"
                                            >
                                                Enabled
                                            </Label>
                                        </div>
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-white">
                                                    Message
                                                </Label>
                                                <Input
                                                    className="border-white/10 bg-white/5 text-white"
                                                    value={
                                                        ui.maintenance_banner_message
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            'maintenance_banner_message',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white">
                                                    CTA Label
                                                </Label>
                                                <Input
                                                    className="border-white/10 bg-white/5 text-white"
                                                    value={
                                                        ui.maintenance_banner_cta_label
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            'maintenance_banner_cta_label',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Learn more"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="text-white">
                                                    CTA URL
                                                </Label>
                                                <Input
                                                    className="border-white/10 bg-white/5 text-white"
                                                    value={
                                                        ui.maintenance_banner_cta_url
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            'maintenance_banner_cta_url',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="https://status.example.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setPreview('maintenance')
                                            }
                                        >
                                            Preview
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-white">
                                            Emergency Interstitial
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="ei_en"
                                                checked={
                                                    ui.emergency_interstitial_enabled
                                                }
                                                onCheckedChange={(c) =>
                                                    update(
                                                        'emergency_interstitial_enabled',
                                                        c === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="ei_en"
                                                className="text-white"
                                            >
                                                Enabled
                                            </Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white">
                                                Message
                                            </Label>
                                            <Textarea
                                                className="border-white/10 bg-white/5 text-white"
                                                rows={3}
                                                value={
                                                    ui.emergency_interstitial_message
                                                }
                                                onChange={(e) =>
                                                    update(
                                                        'emergency_interstitial_message',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setPreview('emergency')
                                            }
                                        >
                                            Preview
                                        </Button>
                                    </div>

                                    <div className="sticky bottom-0 z-[1] mt-2 flex items-center justify-end gap-3 rounded-xl border-2 border-amber-400/30 bg-neutral-900/90 p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)] ring-2 ring-amber-400/30 backdrop-blur-xl transition">
                                        <span
                                            aria-live="polite"
                                            className="min-h-5"
                                        >
                                            {status?.section === 'ann' && (
                                                <span
                                                    className={[
                                                        'inline-flex items-center gap-2 text-sm',
                                                        status.type ===
                                                        'success'
                                                            ? 'text-emerald-300'
                                                            : 'text-red-300',
                                                    ].join(' ')}
                                                >
                                                    {status.type ===
                                                    'success' ? (
                                                        <CheckCircle2 className="size-4" />
                                                    ) : (
                                                        <AlertCircle className="size-4" />
                                                    )}
                                                    {status.message}
                                                </span>
                                            )}
                                        </span>
                                        <Button
                                            onClick={() => {
                                                const payload: Record<
                                                    string,
                                                    string | number | boolean
                                                > = {
                                                    global_announcement_enabled:
                                                        ui.global_announcement_enabled,
                                                    global_announcement_level:
                                                        ui.global_announcement_level,
                                                    global_announcement_message:
                                                        ui.global_announcement_message,
                                                    global_announcement_dismissible:
                                                        ui.global_announcement_dismissible,
                                                    global_announcement_start_at:
                                                        ui.global_announcement_start_at,
                                                    global_announcement_end_at:
                                                        ui.global_announcement_end_at,
                                                    maintenance_banner_enabled:
                                                        ui.maintenance_banner_enabled,
                                                    maintenance_banner_message:
                                                        ui.maintenance_banner_message,
                                                    maintenance_banner_cta_label:
                                                        ui.maintenance_banner_cta_label,
                                                    maintenance_banner_cta_url:
                                                        ui.maintenance_banner_cta_url,
                                                    emergency_interstitial_enabled:
                                                        ui.emergency_interstitial_enabled,
                                                    emergency_interstitial_message:
                                                        ui.emergency_interstitial_message,
                                                };
                                                setProcessing('ann');
                                                setStatus(null);
                                                router.post(
                                                    adminRoutes.settings.index()
                                                        .url,
                                                    {
                                                        _method: 'patch',
                                                        settings: payload,
                                                    },
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () =>
                                                            setStatus({
                                                                section: 'ann',
                                                                type: 'success',
                                                                message:
                                                                    'Announcements saved',
                                                            }),
                                                        onError: () =>
                                                            setStatus({
                                                                section: 'ann',
                                                                type: 'error',
                                                                message:
                                                                    'Failed to save announcements',
                                                            }),
                                                        onFinish: () =>
                                                            setProcessing(null),
                                                    },
                                                );
                                            }}
                                            disabled={processing === 'ann'}
                                            variant="default"
                                            className="border-0 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.45)] transition-all hover:scale-[1.02] hover:shadow-[0_18px_40px_-12px_rgba(249,115,22,0.55)]"
                                        >
                                            {processing === 'ann' ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 size-4" />
                                                    Save
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Preview Overlay */}
                        {preview && (
                            <div className="fixed inset-0 z-[60]">
                                {/* Backdrop below the banner, clickable to close */}
                                <div
                                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                    onClick={() => setPreview(null)}
                                />
                                {/* Banner at very top, matching site placement */}
                                <div className="relative z-[61]">
                                    <AnnouncementBar
                                        isPreview
                                        mode="card"
                                        preview={{
                                            announcement:
                                                preview === 'announcement'
                                                    ? {
                                                          enabled: true,
                                                          level: ui.global_announcement_level,
                                                          message:
                                                              ui.global_announcement_message ||
                                                              'Announcement message',
                                                          dismissible:
                                                              ui.global_announcement_dismissible,
                                                          start_at:
                                                              ui.global_announcement_start_at,
                                                          end_at: ui.global_announcement_end_at,
                                                      }
                                                    : { enabled: false },
                                            maintenance:
                                                preview === 'maintenance'
                                                    ? {
                                                          enabled: true,
                                                          message:
                                                              ui.maintenance_banner_message ||
                                                              'Maintenance message',
                                                          cta_label:
                                                              ui.maintenance_banner_cta_label ||
                                                              'Learn more',
                                                          cta_url:
                                                              ui.maintenance_banner_cta_url ||
                                                              '#',
                                                      }
                                                    : { enabled: false },
                                            emergency:
                                                preview === 'emergency'
                                                    ? {
                                                          enabled: true,
                                                          message:
                                                              ui.emergency_interstitial_message ||
                                                              'Emergency message',
                                                      }
                                                    : { enabled: false },
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPreview(null)}
                                        className="absolute top-2 right-4 z-[62] rounded-full border border-white/20 bg-black/40 px-3 py-1 text-sm text-white hover:bg-black/55"
                                    >
                                        Close preview
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Feature Flags moved to /admin/features - entire section removed */}

                        {/* SEO & SOCIAL */}
                        <section id="seo">
                            <Card className="border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Search className="size-5 opacity-80" />
                                        SEO & Social
                                    </CardTitle>
                                    <CardDescription className="text-white/70">
                                        Default metadata and social card
                                        settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-white">
                                                Default Title
                                            </Label>
                                            <Input
                                                className="border-white/10 bg-white/5 text-white"
                                                value={ui.seo_default_title}
                                                onChange={(e) =>
                                                    update(
                                                        'seo_default_title',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Site title..."
                                            />
                                            <p className="text-xs text-white/50">
                                                {seoTitleCount}/60
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white">
                                                Canonical Host
                                            </Label>
                                            <Input
                                                className="border-white/10 bg-white/5 text-white"
                                                value={ui.canonical_host}
                                                onChange={(e) =>
                                                    update(
                                                        'canonical_host',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="www.realkinkmen.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white">
                                            Default Description
                                        </Label>
                                        <Textarea
                                            className="border-white/10 bg-white/5 text-white"
                                            rows={3}
                                            value={ui.seo_default_description}
                                            onChange={(e) =>
                                                update(
                                                    'seo_default_description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Describe your site..."
                                        />
                                        <p className="text-xs text-white/50">
                                            {seoDescCount}/160
                                        </p>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-white">
                                                Robots Indexing
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={
                                                        ui.robots_index_enabled
                                                    }
                                                    onCheckedChange={(c) =>
                                                        update(
                                                            'robots_index_enabled',
                                                            c === true,
                                                        )
                                                    }
                                                />
                                                <span className="text-sm text-white/80">
                                                    Allow indexing
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-white">
                                                Twitter Card Type
                                            </Label>
                                            <Select
                                                value={ui.twitter_card_type}
                                                onValueChange={(v) =>
                                                    update(
                                                        'twitter_card_type',
                                                        v as typeof ui.twitter_card_type,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="summary">
                                                        summary
                                                    </SelectItem>
                                                    <SelectItem value="summary_large_image">
                                                        summary_large_image
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {/* SERP Mock */}
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <p className="mb-3 text-xs text-white/60">
                                            Search Preview
                                        </p>
                                        <div className="space-y-1">
                                            <p className="text-base text-[#8ab4f8]">
                                                {ui.seo_default_title ||
                                                    'Your title here'}
                                            </p>
                                            <p className="text-sm text-[#bdc1c6]">
                                                {ui.canonical_host ||
                                                    'example.com'}{' '}
                                                ›
                                            </p>
                                            <p className="text-sm text-[#bdc1c6]">
                                                {ui.seo_default_description ||
                                                    'Your description here...'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button variant="outline" disabled>
                                            <Save className="mr-2 size-4" />
                                            Save (mock)
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* PERFORMANCE & CACHING — removed per feedback */}

                        {/* COMPLIANCE & LEGAL */}
                        <section id="legal">
                            <Card className="border-2 border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm transition hover:border-white/20 hover:shadow-[0_20px_60px_-40px_rgba(249,115,22,0.3)]">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-white">
                                        <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 via-rose-600/10 to-pink-500/5 p-2.5 shadow-[0_0_20px_-5px_rgba(244,63,94,0.4)] ring-1 ring-rose-400/20">
                                            <ScrollText className="size-5 text-rose-200" />
                                        </div>
                                        <span>Compliance & Legal</span>
                                    </CardTitle>
                                    <CardDescription className="text-white/70">
                                        Manage your legal pages and related
                                        links. Write content in plain text or
                                        basic HTML.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-6 text-white/80">
                                        These pages are rendered publicly at{' '}
                                        <code className="text-white/90">
                                            /legal/terms
                                        </code>
                                        ,{' '}
                                        <code className="text-white/90">
                                            /legal/privacy
                                        </code>
                                        ,{' '}
                                        <code className="text-white/90">
                                            /legal/guidelines
                                        </code>
                                        ,{' '}
                                        <code className="text-white/90">
                                            /legal/cookies
                                        </code>
                                        , and{' '}
                                        <code className="text-white/90">
                                            /legal/dmca
                                        </code>
                                        .
                                    </div>
                                    {/* Age text */}
                                    <div className="space-y-2">
                                        <Label className="text-white">
                                            Age of Consent Text
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                className="border-white/10 bg-white/5 text-white"
                                                value={String(
                                                    values.age_of_consent_text ??
                                                        '',
                                                )}
                                                onChange={(e) =>
                                                    setValues((p) => ({
                                                        ...p,
                                                        age_of_consent_text:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="You must be 18 or older to use this site."
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUi(
                                                        (s) =>
                                                            ({
                                                                ...s,
                                                                _showAgePreview: true,
                                                            }) as any,
                                                    )
                                                }
                                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                                            >
                                                Preview
                                            </button>
                                        </div>
                                        <p className="text-xs text-white/50">
                                            Shown in age gate and other legal
                                            surfaces.
                                        </p>
                                    </div>
                                    {(ui as any)._showAgePreview && (
                                        <div className="fixed inset-0 z-[200]">
                                            <div className="absolute inset-0">
                                                <Suspense>
                                                    <AgeConsentModal
                                                        open
                                                        isPreview
                                                        text={String(
                                                            values.age_of_consent_text ??
                                                                '',
                                                        )}
                                                        onClose={() =>
                                                            setUi(
                                                                (s) =>
                                                                    ({
                                                                        ...s,
                                                                        _showAgePreview: false,
                                                                    }) as any,
                                                            )
                                                        }
                                                    />
                                                </Suspense>
                                            </div>
                                        </div>
                                    )}

                                    {/* Editors */}
                                    <div className="rounded-xl border border-white/10 bg-neutral-900/50">
                                        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUi(
                                                        (s) =>
                                                            ({
                                                                ...s,
                                                                _legalTab:
                                                                    'terms',
                                                            }) as any,
                                                    )
                                                }
                                                className={[
                                                    'rounded-lg px-3 py-1.5 text-sm',
                                                    ((ui as any)._legalTab ??
                                                        'terms') === 'terms'
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                                                ].join(' ')}
                                            >
                                                Terms of Service
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUi(
                                                        (s) =>
                                                            ({
                                                                ...s,
                                                                _legalTab:
                                                                    'privacy',
                                                            }) as any,
                                                    )
                                                }
                                                className={[
                                                    'rounded-lg px-3 py-1.5 text-sm',
                                                    (ui as any)._legalTab ===
                                                    'privacy'
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                                                ].join(' ')}
                                            >
                                                Privacy Policy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUi(
                                                        (s) =>
                                                            ({
                                                                ...s,
                                                                _legalTab:
                                                                    'guidelines',
                                                            }) as any,
                                                    )
                                                }
                                                className={[
                                                    'rounded-lg px-3 py-1.5 text-sm',
                                                    (ui as any)._legalTab ===
                                                    'guidelines'
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                                                ].join(' ')}
                                            >
                                                Community Guidelines
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUi(
                                                        (s) =>
                                                            ({
                                                                ...s,
                                                                _legalTab:
                                                                    'cookie',
                                                            }) as any,
                                                    )
                                                }
                                                className={[
                                                    'rounded-lg px-3 py-1.5 text-sm',
                                                    (ui as any)._legalTab ===
                                                    'cookie'
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                                                ].join(' ')}
                                            >
                                                Cookie Policy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setUi(
                                                        (s) =>
                                                            ({
                                                                ...s,
                                                                _legalTab:
                                                                    'dmca',
                                                            }) as any,
                                                    )
                                                }
                                                className={[
                                                    'rounded-lg px-3 py-1.5 text-sm',
                                                    (ui as any)._legalTab ===
                                                    'dmca'
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                                                ].join(' ')}
                                            >
                                                DMCA Policy
                                            </button>
                                        </div>
                                        <div className="p-3">
                                            {((ui as any)._legalTab ??
                                                'terms') === 'terms' && (
                                                <div className="space-y-2">
                                                    <Label className="text-white">
                                                        Terms of Service
                                                    </Label>
                                                    <Textarea
                                                        className="border-white/10 bg-white/5 text-white"
                                                        rows={16}
                                                        value={String(
                                                            values.terms_content ??
                                                                '',
                                                        )}
                                                        onChange={(e) =>
                                                            setValues((p) => ({
                                                                ...p,
                                                                terms_content:
                                                                    e.target
                                                                        .value,
                                                            }))
                                                        }
                                                        placeholder="<h1>Terms</h1><p>By using this site, you agree...</p>"
                                                    />
                                                    <div className="flex items-center justify-between text-xs text-white/50">
                                                        <span>
                                                            Characters:{' '}
                                                            {
                                                                String(
                                                                    values.terms_content ??
                                                                        '',
                                                                ).length
                                                            }
                                                        </span>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="size-3.5 accent-amber-400"
                                                                checked={
                                                                    (ui as any)
                                                                        ._legalPreview ===
                                                                    'terms'
                                                                }
                                                                onChange={(e) =>
                                                                    setUi(
                                                                        (s) =>
                                                                            ({
                                                                                ...s,
                                                                                _legalPreview:
                                                                                    e
                                                                                        .target
                                                                                        .checked
                                                                                        ? 'terms'
                                                                                        : null,
                                                                            }) as any,
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                Preview rendered
                                                            </span>
                                                        </label>
                                                    </div>
                                                    {(ui as any)
                                                        ._legalPreview ===
                                                        'terms' && (
                                                        <div
                                                            className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/85"
                                                            dangerouslySetInnerHTML={{
                                                                __html: String(
                                                                    values.terms_content ??
                                                                        '',
                                                                ),
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            {(ui as any)._legalTab ===
                                                'privacy' && (
                                                <div className="space-y-2">
                                                    <Label className="text-white">
                                                        Privacy Policy
                                                    </Label>
                                                    <Textarea
                                                        className="border-white/10 bg-white/5 text-white"
                                                        rows={16}
                                                        value={String(
                                                            values.privacy_content ??
                                                                '',
                                                        )}
                                                        onChange={(e) =>
                                                            setValues((p) => ({
                                                                ...p,
                                                                privacy_content:
                                                                    e.target
                                                                        .value,
                                                            }))
                                                        }
                                                        placeholder="<h1>Privacy</h1><p>We value your privacy...</p>"
                                                    />
                                                    <div className="flex items-center justify-between text-xs text-white/50">
                                                        <span>
                                                            Characters:{' '}
                                                            {
                                                                String(
                                                                    values.privacy_content ??
                                                                        '',
                                                                ).length
                                                            }
                                                        </span>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="size-3.5 accent-amber-400"
                                                                checked={
                                                                    (ui as any)
                                                                        ._legalPreview ===
                                                                    'privacy'
                                                                }
                                                                onChange={(e) =>
                                                                    setUi(
                                                                        (s) =>
                                                                            ({
                                                                                ...s,
                                                                                _legalPreview:
                                                                                    e
                                                                                        .target
                                                                                        .checked
                                                                                        ? 'privacy'
                                                                                        : null,
                                                                            }) as any,
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                Preview rendered
                                                            </span>
                                                        </label>
                                                    </div>
                                                    {(ui as any)
                                                        ._legalPreview ===
                                                        'privacy' && (
                                                        <div
                                                            className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/85"
                                                            dangerouslySetInnerHTML={{
                                                                __html: String(
                                                                    values.privacy_content ??
                                                                        '',
                                                                ),
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            {(ui as any)._legalTab ===
                                                'guidelines' && (
                                                <div className="space-y-2">
                                                    <Label className="text-white">
                                                        Community Guidelines
                                                    </Label>
                                                    <Textarea
                                                        className="border-white/10 bg-white/5 text-white"
                                                        rows={16}
                                                        value={String(
                                                            values.guidelines_content ??
                                                                '',
                                                        )}
                                                        onChange={(e) =>
                                                            setValues((p) => ({
                                                                ...p,
                                                                guidelines_content:
                                                                    e.target
                                                                        .value,
                                                            }))
                                                        }
                                                        placeholder="<h1>Guidelines</h1><p>Be respectful...</p>"
                                                    />
                                                    <div className="flex items-center justify-between text-xs text-white/50">
                                                        <span>
                                                            Characters:{' '}
                                                            {
                                                                String(
                                                                    values.guidelines_content ??
                                                                        '',
                                                                ).length
                                                            }
                                                        </span>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="size-3.5 accent-amber-400"
                                                                checked={
                                                                    (ui as any)
                                                                        ._legalPreview ===
                                                                    'guidelines'
                                                                }
                                                                onChange={(e) =>
                                                                    setUi(
                                                                        (s) =>
                                                                            ({
                                                                                ...s,
                                                                                _legalPreview:
                                                                                    e
                                                                                        .target
                                                                                        .checked
                                                                                        ? 'guidelines'
                                                                                        : null,
                                                                            }) as any,
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                Preview rendered
                                                            </span>
                                                        </label>
                                                    </div>
                                                    {(ui as any)
                                                        ._legalPreview ===
                                                        'guidelines' && (
                                                        <div
                                                            className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/85"
                                                            dangerouslySetInnerHTML={{
                                                                __html: String(
                                                                    values.guidelines_content ??
                                                                        '',
                                                                ),
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            {(ui as any)._legalTab ===
                                                'cookie' && (
                                                <div className="space-y-2">
                                                    <Label className="text-white">
                                                        Cookie Policy
                                                    </Label>
                                                    <Textarea
                                                        className="border-white/10 bg-white/5 text-white"
                                                        rows={16}
                                                        value={String(
                                                            values.cookie_policy_content ??
                                                                '',
                                                        )}
                                                        onChange={(e) =>
                                                            setValues((p) => ({
                                                                ...p,
                                                                cookie_policy_content:
                                                                    e.target
                                                                        .value,
                                                            }))
                                                        }
                                                        placeholder="<h1>Cookie Policy</h1><p>We use cookies to...</p>"
                                                    />
                                                    <div className="flex items-center justify-between text-xs text-white/50">
                                                        <span>
                                                            Characters:{' '}
                                                            {
                                                                String(
                                                                    values.cookie_policy_content ??
                                                                        '',
                                                                ).length
                                                            }
                                                        </span>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="size-3.5 accent-amber-400"
                                                                checked={
                                                                    (ui as any)
                                                                        ._legalPreview ===
                                                                    'cookie'
                                                                }
                                                                onChange={(e) =>
                                                                    setUi(
                                                                        (s) =>
                                                                            ({
                                                                                ...s,
                                                                                _legalPreview:
                                                                                    e
                                                                                        .target
                                                                                        .checked
                                                                                        ? 'cookie'
                                                                                        : null,
                                                                            }) as any,
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                Preview rendered
                                                            </span>
                                                        </label>
                                                    </div>
                                                    {(ui as any)
                                                        ._legalPreview ===
                                                        'cookie' && (
                                                        <div
                                                            className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/85"
                                                            dangerouslySetInnerHTML={{
                                                                __html: String(
                                                                    values.cookie_policy_content ??
                                                                        '',
                                                                ),
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            {(ui as any)._legalTab ===
                                                'dmca' && (
                                                <div className="space-y-2">
                                                    <Label className="text-white">
                                                        DMCA Policy
                                                    </Label>
                                                    <Textarea
                                                        className="border-white/10 bg-white/5 text-white"
                                                        rows={16}
                                                        value={String(
                                                            values.dmca_policy_content ??
                                                                '',
                                                        )}
                                                        onChange={(e) =>
                                                            setValues((p) => ({
                                                                ...p,
                                                                dmca_policy_content:
                                                                    e.target
                                                                        .value,
                                                            }))
                                                        }
                                                        placeholder="<h1>DMCA Policy</h1><p>How to file a takedown...</p>"
                                                    />
                                                    <div className="flex items-center justify-between text-xs text-white/50">
                                                        <span>
                                                            Characters:{' '}
                                                            {
                                                                String(
                                                                    values.dmca_policy_content ??
                                                                        '',
                                                                ).length
                                                            }
                                                        </span>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="size-3.5 accent-amber-400"
                                                                checked={
                                                                    (ui as any)
                                                                        ._legalPreview ===
                                                                    'dmca'
                                                                }
                                                                onChange={(e) =>
                                                                    setUi(
                                                                        (s) =>
                                                                            ({
                                                                                ...s,
                                                                                _legalPreview:
                                                                                    e
                                                                                        .target
                                                                                        .checked
                                                                                        ? 'dmca'
                                                                                        : null,
                                                                            }) as any,
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                Preview rendered
                                                            </span>
                                                        </label>
                                                    </div>
                                                    {(ui as any)
                                                        ._legalPreview ===
                                                        'dmca' && (
                                                        <div
                                                            className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/85"
                                                            dangerouslySetInnerHTML={{
                                                                __html: String(
                                                                    values.dmca_policy_content ??
                                                                        '',
                                                                ),
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sticky actions */}
                                    {(() => {
                                        const legalKeys = [
                                            'cookie_policy_content',
                                            'dmca_policy_content',
                                            'age_of_consent_text',
                                            'terms_content',
                                            'privacy_content',
                                            'guidelines_content',
                                        ] as const;
                                        const hasChanges = legalKeys.some(
                                            (k) => {
                                                const initial =
                                                    settings.find(
                                                        (s) => s.key === k,
                                                    )?.value ?? '';
                                                return (
                                                    String(initial ?? '') !==
                                                    String(values[k] ?? '')
                                                );
                                            },
                                        );
                                        return (
                                            <div
                                                className={[
                                                    'sticky bottom-0 z-[1] mt-2 flex items-center justify-end gap-3 rounded-xl border-2 p-4 backdrop-blur-xl transition',
                                                    hasChanges
                                                        ? 'border-amber-400/30 bg-neutral-900/90 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)] ring-2 ring-amber-400/30'
                                                        : 'border-white/10 bg-neutral-900/80',
                                                ].join(' ')}
                                            >
                                                <span
                                                    aria-live="polite"
                                                    className="min-h-5"
                                                >
                                                    {status?.section ===
                                                        'comms' /* reuse status block? keep separate */ &&
                                                        null}
                                                    {status?.section ===
                                                        'legal' && (
                                                        <span
                                                            className={[
                                                                'inline-flex items-center gap-2 text-sm',
                                                                status.type ===
                                                                'success'
                                                                    ? 'text-emerald-300'
                                                                    : 'text-red-300',
                                                            ].join(' ')}
                                                        >
                                                            {status.type ===
                                                            'success' ? (
                                                                <CheckCircle2 className="size-4" />
                                                            ) : (
                                                                <AlertCircle className="size-4" />
                                                            )}
                                                            {status.message}
                                                        </span>
                                                    )}
                                                </span>
                                                <Button
                                                    variant={
                                                        hasChanges
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    onClick={() => {
                                                        if (!hasChanges) return;
                                                        const payload: Record<
                                                            string,
                                                            string
                                                        > = {};
                                                        legalKeys.forEach(
                                                            (k) =>
                                                                (payload[k] =
                                                                    String(
                                                                        values[
                                                                            k
                                                                        ] ?? '',
                                                                    )),
                                                        );
                                                        setProcessing('legal');
                                                        setStatus(null);
                                                        router.post(
                                                            adminRoutes.settings.index()
                                                                .url,
                                                            {
                                                                _method:
                                                                    'patch',
                                                                settings:
                                                                    payload,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess: () =>
                                                                    setStatus({
                                                                        section:
                                                                            'legal' as any,
                                                                        type: 'success',
                                                                        message:
                                                                            'Legal content saved',
                                                                    }),
                                                                onError: () =>
                                                                    setStatus({
                                                                        section:
                                                                            'legal' as any,
                                                                        type: 'error',
                                                                        message:
                                                                            'Failed to save legal content',
                                                                    }),
                                                                onFinish: () =>
                                                                    setProcessing(
                                                                        null,
                                                                    ),
                                                            },
                                                        );
                                                    }}
                                                    disabled={
                                                        !hasChanges ||
                                                        processing === 'legal'
                                                    }
                                                    className={[
                                                        hasChanges
                                                            ? 'border-0 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.45)] transition-all hover:scale-[1.02] hover:shadow-[0_18px_40px_-12px_rgba(249,115,22,0.55)]'
                                                            : '',
                                                    ].join(' ')}
                                                >
                                                    {processing === 'legal' ? (
                                                        <>
                                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 size-4" />
                                                            Save
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </section>

                        {/* COOKIES & GDPR */}
                        <section id="cookies">
                            <Card className="border-2 border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-sm transition hover:border-white/20 hover:shadow-[0_20px_60px_-40px_rgba(249,115,22,0.3)]">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-white">
                                        <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-orange-500/5 p-2.5 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/20">
                                            <CookieIcon className="size-5 text-amber-200" />
                                        </div>
                                        <span>Cookies & GDPR</span>
                                    </CardTitle>
                                    <CardDescription className="text-white/70">
                                        Consent banner, categories, and
                                        third-party services
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-6 text-white/80">
                                        We use cookies to deliver and improve
                                        our services, analyze site usage, and if
                                        the visitor agrees, to personalize their
                                        experience and market our services.
                                        Configure the default categories, banner
                                        copy, and listed services here.
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-white">
                                            Cookie Banner
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="cookie_banner_enabled"
                                                checked={
                                                    ui.cookie_banner_enabled
                                                }
                                                onCheckedChange={(c) =>
                                                    update(
                                                        'cookie_banner_enabled',
                                                        c === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="cookie_banner_enabled"
                                                className="text-white"
                                            >
                                                Enabled
                                            </Label>
                                        </div>
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-white">
                                                    Message
                                                </Label>
                                                <Input
                                                    className="border-white/10 bg-white/5 text-white"
                                                    value={
                                                        ui.cookie_banner_message
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            'cookie_banner_message',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="We use cookies to improve your experience..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white">
                                                    CTA Label
                                                </Label>
                                                <Input
                                                    className="border-white/10 bg-white/5 text-white"
                                                    value={
                                                        ui.cookie_banner_cta_label
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            'cookie_banner_cta_label',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Accept"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="text-white">
                                                    Policy URL
                                                </Label>
                                                <Input
                                                    className="border-white/10 bg-white/5 text-white"
                                                    type="url"
                                                    value={
                                                        ui.cookie_banner_policy_url
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            'cookie_banner_policy_url',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="https://example.com/cookies"
                                                />
                                            </div>
                                            <div className="flex items-center justify-end md:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setUi(
                                                            (s) =>
                                                                ({
                                                                    ...s,
                                                                    _showCookiePreview: true,
                                                                }) as any,
                                                        )
                                                    }
                                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                                                >
                                                    Preview Banner
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {(ui as any)._showCookiePreview && (
                                        <div className="fixed inset-0 z-[200]">
                                            <div className="absolute inset-0">
                                                <Suspense>
                                                    <CookiesBanner
                                                        open
                                                        isPreview
                                                        onClose={() =>
                                                            setUi(
                                                                (s) =>
                                                                    ({
                                                                        ...s,
                                                                        _showCookiePreview: false,
                                                                    }) as any,
                                                            )
                                                        }
                                                    />
                                                </Suspense>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-white">
                                            Consent Categories
                                        </h3>
                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-left shadow-[0_0_0_1px_rgba(251,191,36,0.25)_inset]">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-white">
                                                        Necessary
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                                        Enabled
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-xs leading-5 text-white/65">
                                                    Required for sign‑in,
                                                    security, and core features.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    update(
                                                        'cookie_allow_analytics',
                                                        !ui.cookie_allow_analytics,
                                                    )
                                                }
                                                className={[
                                                    'rounded-xl border p-4 text-left transition',
                                                    ui.cookie_allow_analytics
                                                        ? 'border-amber-400/40 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)_inset]'
                                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10',
                                                ].join(' ')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-white">
                                                        Analytics
                                                    </p>
                                                    {ui.cookie_allow_analytics && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                                            Enabled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs leading-5 text-white/65">
                                                    Helps us understand usage to
                                                    improve the product.
                                                </p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    update(
                                                        'cookie_allow_marketing',
                                                        !ui.cookie_allow_marketing,
                                                    )
                                                }
                                                className={[
                                                    'rounded-xl border p-4 text-left transition',
                                                    ui.cookie_allow_marketing
                                                        ? 'border-amber-400/40 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)_inset]'
                                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10',
                                                ].join(' ')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-white">
                                                        Marketing
                                                    </p>
                                                    {ui.cookie_allow_marketing && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                                            Enabled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs leading-5 text-white/65">
                                                    Used for personalization and
                                                    partner tools.
                                                </p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    update(
                                                        'do_not_sell_default',
                                                        !(values[
                                                            'do_not_sell_default'
                                                        ] as boolean),
                                                    )
                                                }
                                                className={[
                                                    'rounded-xl border p-4 text-left transition md:col-span-2',
                                                    (values[
                                                        'do_not_sell_default'
                                                    ] as boolean)
                                                        ? 'border-amber-400/40 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)_inset]'
                                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10',
                                                ].join(' ')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-white">
                                                        Do not sell or share my
                                                        personal information
                                                        (default)
                                                    </p>
                                                    {(values[
                                                        'do_not_sell_default'
                                                    ] as boolean) && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                                            Enabled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs leading-5 text-white/65">
                                                    Controls the default state
                                                    for the “do not sell/share”
                                                    option in the banner
                                                    Customize view.
                                                </p>
                                            </button>
                                            <div className="md:col-span-2">
                                                <Label className="text-white">
                                                    Re‑prompt after (days)
                                                </Label>
                                                <Input
                                                    className="mt-2 border-white/10 bg-white/5 text-white"
                                                    type="number"
                                                    min={1}
                                                    max={730}
                                                    value={String(
                                                        values[
                                                            'consent_reprompt_days'
                                                        ] ?? 180,
                                                    )}
                                                    onChange={(e) =>
                                                        setValues((prev) => ({
                                                            ...prev,
                                                            consent_reprompt_days:
                                                                parseInt(
                                                                    e.target
                                                                        .value ||
                                                                        '0',
                                                                    10,
                                                                ) || 0,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-white">
                                            Third-Party Services
                                        </h3>
                                        <p className="text-sm text-white/60">
                                            List services that set cookies
                                            (e.g., analytics, payment, chat),
                                            and link to their terms.
                                        </p>
                                        <div className="space-y-2">
                                            {ui.cookies_services.length ===
                                                0 && (
                                                <p className="text-sm text-white/60">
                                                    No services added yet.
                                                </p>
                                            )}
                                            {ui.cookies_services.map(
                                                (svc, i) => (
                                                    <div
                                                        key={i}
                                                        className="grid items-end gap-2 rounded-lg border border-white/10 bg-white/5 p-3 md:grid-cols-5"
                                                    >
                                                        <div className="space-y-1 md:col-span-2">
                                                            <Label className="text-xs text-white">
                                                                Service Name
                                                            </Label>
                                                            <Input
                                                                className="border-white/10 bg-white/5 text-white"
                                                                value={svc.name}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const copy =
                                                                        [
                                                                            ...ui.cookies_services,
                                                                        ];
                                                                    copy[i] = {
                                                                        ...copy[
                                                                            i
                                                                        ],
                                                                        name: e
                                                                            .target
                                                                            .value,
                                                                    };
                                                                    update(
                                                                        'cookies_services',
                                                                        copy,
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1 md:col-span-2">
                                                            <Label className="text-xs text-white">
                                                                URL (Privacy /
                                                                Terms)
                                                            </Label>
                                                            <Input
                                                                className="border-white/10 bg-white/5 text-white"
                                                                value={svc.url}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const copy =
                                                                        [
                                                                            ...ui.cookies_services,
                                                                        ];
                                                                    copy[i] = {
                                                                        ...copy[
                                                                            i
                                                                        ],
                                                                        url: e
                                                                            .target
                                                                            .value,
                                                                    };
                                                                    update(
                                                                        'cookies_services',
                                                                        copy,
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                className="text-red-400 hover:text-red-300"
                                                                onClick={() => {
                                                                    const copy =
                                                                        ui.cookies_services.filter(
                                                                            (
                                                                                _,
                                                                                idx,
                                                                            ) =>
                                                                                idx !==
                                                                                i,
                                                                        );
                                                                    update(
                                                                        'cookies_services',
                                                                        copy,
                                                                    );
                                                                }}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                            <div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        update(
                                                            'cookies_services',
                                                            [
                                                                ...ui.cookies_services,
                                                                {
                                                                    name: '',
                                                                    url: '',
                                                                },
                                                            ],
                                                        )
                                                    }
                                                >
                                                    Add service
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Banner Preview intentionally removed for now per request */}
                                    <div className="sticky bottom-0 z-[1] mt-2 flex items-center justify-end gap-3 rounded-xl border-2 border-amber-400/30 bg-neutral-900/90 p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)] ring-2 ring-amber-400/30 backdrop-blur-xl transition">
                                        <Button
                                            variant="default"
                                            onClick={() => {
                                                const payload: Record<
                                                    string,
                                                    | string
                                                    | number
                                                    | boolean
                                                    | Array<{
                                                          name: string;
                                                          url: string;
                                                      }>
                                                > = {
                                                    cookie_banner_enabled:
                                                        ui.cookie_banner_enabled,
                                                    cookie_banner_message:
                                                        ui.cookie_banner_message,
                                                    cookie_banner_cta_label:
                                                        ui.cookie_banner_cta_label,
                                                    cookie_banner_policy_url:
                                                        ui.cookie_banner_policy_url,
                                                    cookie_allow_analytics:
                                                        ui.cookie_allow_analytics,
                                                    cookie_allow_marketing:
                                                        ui.cookie_allow_marketing,
                                                    cookies_services:
                                                        ui.cookies_services,
                                                    do_not_sell_default:
                                                        Boolean(
                                                            values[
                                                                'do_not_sell_default'
                                                            ],
                                                        ),
                                                    consent_reprompt_days:
                                                        Number(
                                                            values[
                                                                'consent_reprompt_days'
                                                            ] ?? 180,
                                                        ),
                                                };
                                                router.post(
                                                    adminRoutes.settings.index()
                                                        .url,
                                                    {
                                                        _method: 'patch',
                                                        settings: payload,
                                                    },
                                                    { preserveScroll: true },
                                                );
                                            }}
                                            className="border-0 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.45)] transition-all hover:scale-[1.02] hover:shadow-[0_18px_40px_-12px_rgba(249,115,22,0.55)]"
                                        >
                                            <Save className="mr-2 size-4" />
                                            Save Cookies Settings
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* VERIFICATION SETTINGS */}
                        {verificationSettings.length > 0 && (
                            <section id="verification">
                                <Card className="border-violet-400/20 bg-violet-400/5">
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <SettingsIcon className="size-5 text-violet-300" />
                                            <CardTitle className="text-white">
                                                Verification Settings
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="text-white/70">
                                            Configure ID verification expiration
                                            periods and provider settings
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {verificationSettings.map((setting) => (
                                            <form
                                                key={setting.key}
                                                onSubmit={(e) =>
                                                    handleSubmit(e, setting.key)
                                                }
                                                className="space-y-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor={setting.key}
                                                        className="text-white"
                                                    >
                                                        {setting.key
                                                            .replace(/_/g, ' ')
                                                            .replace(
                                                                /\b\w/g,
                                                                (l) =>
                                                                    l.toUpperCase(),
                                                            )}
                                                    </Label>
                                                    {setting.description && (
                                                        <p className="text-xs text-white/60">
                                                            {
                                                                setting.description
                                                            }
                                                        </p>
                                                    )}
                                                    {setting.type ===
                                                        'integer' && (
                                                        <Input
                                                            id={setting.key}
                                                            type="number"
                                                            value={
                                                                values[
                                                                    setting.key
                                                                ] as number
                                                            }
                                                            onChange={(e) =>
                                                                setValues({
                                                                    ...values,
                                                                    [setting.key]:
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                            10,
                                                                        ),
                                                                })
                                                            }
                                                            className="border-white/10 bg-white/5 text-white"
                                                        />
                                                    )}
                                                    {setting.type ===
                                                        'boolean' && (
                                                        <Select
                                                            value={String(
                                                                values[
                                                                    setting.key
                                                                ],
                                                            )}
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                setValues({
                                                                    ...values,
                                                                    [setting.key]:
                                                                        value ===
                                                                        'true',
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="true">
                                                                    True
                                                                </SelectItem>
                                                                <SelectItem value="false">
                                                                    False
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                    {setting.type ===
                                                        'string' && (
                                                        <Input
                                                            id={setting.key}
                                                            type="text"
                                                            value={String(
                                                                values[
                                                                    setting.key
                                                                ],
                                                            )}
                                                            onChange={(e) =>
                                                                setValues({
                                                                    ...values,
                                                                    [setting.key]:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            className="border-white/10 bg-white/5 text-white"
                                                        />
                                                    )}
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ===
                                                        setting.key
                                                    }
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    {processing ===
                                                    setting.key ? (
                                                        <>
                                                            <Loader2 className="size-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="size-4" />
                                                            Save
                                                        </>
                                                    )}
                                                </Button>
                                            </form>
                                        ))}
                                    </CardContent>
                                </Card>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
