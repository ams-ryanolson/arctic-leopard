import { usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

type Announcement = {
    enabled: boolean;
    level: 'info' | 'warn' | 'urgent' | string;
    message: string;
    dismissible: boolean;
    start_at?: string;
    end_at?: string;
};

type Maintenance = {
    enabled: boolean;
    message: string;
    cta_label?: string;
    cta_url?: string;
};

type Emergency = {
    enabled: boolean;
    message: string;
};

export default function AnnouncementBar(propsIn?: {
    preview?: {
        announcement?: Partial<Announcement>;
        maintenance?: Partial<Maintenance>;
        emergency?: Partial<Emergency>;
    };
    isPreview?: boolean;
    mode?: 'bar' | 'card';
}) {
    const { props } = usePage<any>();
    const baseAnn: Announcement = props.announcements?.announcement ?? {
        enabled: false,
        level: 'info',
        message: '',
        dismissible: true,
    };
    const baseMaint: Maintenance = props.announcements?.maintenance ?? {
        enabled: false,
        message: '',
    };
    const baseEmerg: Emergency = props.announcements?.emergency ?? {
        enabled: false,
        message: '',
    };

    // Admin detection (role name contains 'admin')
    const isAdmin =
        Boolean((props as any)?.auth?.user) &&
        Array.isArray((props as any)?.auth?.user?.roles) &&
        ((props as any).auth.user.roles as any[]).some((r) =>
            String(r?.name || '')
                .toLowerCase()
                .includes('admin'),
        );

    const ann: Announcement = {
        ...baseAnn,
        ...(propsIn?.preview?.announcement ?? {}),
    };
    const maintenance: Maintenance = {
        ...baseMaint,
        ...(propsIn?.preview?.maintenance ?? {}),
    };
    const emergency: Emergency = {
        ...baseEmerg,
        ...(propsIn?.preview?.emergency ?? {}),
    };

    const [dismissedKey, setDismissedKey] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [adminDismissKeys, setAdminDismissKeys] = useState<{
        emer?: string;
        maint?: string;
        ann?: string;
    }>({});

    useEffect(() => {
        const key = `rk_announcement_dismissed_${btoa((ann.message || '').slice(0, 48))}`;
        setDismissedKey(key);
    }, [ann.message]);

    useEffect(() => {
        // Build admin-only bypass keys per message
        setAdminDismissKeys({
            emer: emergency.message
                ? `rk_admin_dismiss_emergency_${btoa((emergency.message || '').slice(0, 48))}`
                : undefined,
            maint: maintenance.message
                ? `rk_admin_dismiss_maintenance_${btoa((maintenance.message || '').slice(0, 48))}`
                : undefined,
            ann: ann.message
                ? `rk_admin_dismiss_announcement_${btoa((ann.message || '').slice(0, 48))}`
                : undefined,
        });
    }, [emergency.message, maintenance.message, ann.message]);

    useEffect(() => {
        // Animate in
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const withinSchedule = useMemo(() => {
        if (!ann.start_at && !ann.end_at) return true;
        const now = new Date();
        if (ann.start_at) {
            const from = new Date(ann.start_at);
            if (now < from) return false;
        }
        if (ann.end_at) {
            const to = new Date(ann.end_at);
            if (now > to) return false;
        }
        return true;
    }, [ann.start_at, ann.end_at]);

    const dismissed = propsIn?.isPreview
        ? false
        : dismissedKey
          ? localStorage.getItem(dismissedKey) === '1'
          : false;
    const adminDismissedEmer = propsIn?.isPreview
        ? false
        : adminDismissKeys.emer
          ? localStorage.getItem(adminDismissKeys.emer) === '1'
          : false;
    const adminDismissedMaint = propsIn?.isPreview
        ? false
        : adminDismissKeys.maint
          ? localStorage.getItem(adminDismissKeys.maint) === '1'
          : false;
    const adminDismissedAnn = propsIn?.isPreview
        ? false
        : adminDismissKeys.ann
          ? localStorage.getItem(adminDismissKeys.ann) === '1'
          : false;

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (dismissedKey) localStorage.setItem(dismissedKey, '1');
        }, 300);
    };

    const handlePreviewClose = () => {
        window.dispatchEvent(new CustomEvent('rk-announcement-preview-close'));
    };

    // Enhanced badge with better styling
    const badge = (
        label: string,
        variant: 'info' | 'warn' | 'urgent' | 'maintenance' | 'emergency',
    ) => {
        const styles = {
            info: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-400/30 text-blue-100 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]',
            warn: 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-400/30 text-amber-100 shadow-[0_0_20px_-5px_rgba(251,191,36,0.5)]',
            urgent: 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-400/30 text-red-100 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]',
            maintenance:
                'bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-amber-400/30 text-amber-100 shadow-[0_0_20px_-5px_rgba(251,191,36,0.5)]',
            emergency:
                'bg-gradient-to-br from-red-500/20 to-rose-600/10 border-red-400/30 text-red-100 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]',
        };

        return (
            <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-300 hover:scale-105 ${styles[variant]} `}
            >
                <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current"></span>
                </span>
                {label}
            </span>
        );
    };

    // Enhanced icon containers with better animations
    const iconContainer = (
        children: React.ReactNode,
        variant: 'info' | 'warn' | 'urgent' | 'maintenance' | 'emergency',
    ) => {
        const styles = {
            info: 'bg-gradient-to-br from-blue-500/15 to-blue-600/5 border-blue-400/25 text-blue-200 shadow-[0_0_30px_-10px_rgba(59,130,246,0.6)]',
            warn: 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-400/25 text-amber-200 shadow-[0_0_30px_-10px_rgba(251,191,36,0.6)]',
            urgent: 'bg-gradient-to-br from-red-500/15 to-red-600/5 border-red-400/25 text-red-200 shadow-[0_0_30px_-10px_rgba(239,68,68,0.6)]',
            maintenance:
                'bg-gradient-to-br from-amber-500/15 to-orange-600/5 border-amber-400/25 text-amber-200 shadow-[0_0_30px_-10px_rgba(251,191,36,0.6)]',
            emergency:
                'bg-gradient-to-br from-red-500/15 to-rose-600/5 border-red-400/25 text-red-200 shadow-[0_0_30px_-10px_rgba(239,68,68,0.6)]',
        };

        return (
            <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:rotate-6 ${styles[variant]} `}
            >
                <div className="text-2xl">{children}</div>
            </div>
        );
    };

    // CARD MODE - Full-screen modal with enhanced design
    const card = (
        variant: 'info' | 'warn' | 'urgent' | 'maintenance' | 'emergency',
        icon: React.ReactNode,
        heading: string,
        subLabel: string,
        message: string,
        badgeLabel: string,
        cta?: React.ReactNode,
    ) => {
        const containerStyles = {
            info: 'shadow-[0_0_120px_-20px_rgba(59,130,246,0.4)]',
            warn: 'shadow-[0_0_120px_-20px_rgba(251,191,36,0.4)]',
            urgent: 'shadow-[0_0_120px_-20px_rgba(239,68,68,0.4)]',
            maintenance: 'shadow-[0_0_120px_-20px_rgba(251,191,36,0.4)]',
            emergency: 'shadow-[0_0_120px_-20px_rgba(239,68,68,0.5)]',
        };

        const borderGlow = {
            info: 'border-blue-500/40',
            warn: 'border-amber-500/40',
            urgent: 'border-red-500/40',
            maintenance: 'border-amber-500/40',
            emergency: 'border-red-500/40',
        };

        return (
            <div
                className={`fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} `}
                onClick={propsIn?.isPreview ? handlePreviewClose : undefined}
            >
                <div
                    className={`w-full max-w-2xl transform overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-neutral-900/95 via-neutral-950/90 to-black/95 ring-1 ring-white/5 backdrop-blur-2xl transition-all duration-500 ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'} ${borderGlow[variant]} ${containerStyles[variant]} `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
                    </div>

                    {/* Header */}
                    <div className="relative border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-8 py-6">
                        <div className="flex items-start gap-5">
                            {iconContainer(icon, variant)}
                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex items-center gap-3">
                                    {badge(badgeLabel, variant)}
                                </div>
                                <h2 className="mb-1 text-2xl font-bold tracking-tight text-white">
                                    {heading}
                                </h2>
                                <p className="text-sm font-medium text-white/50">
                                    {subLabel}
                                </p>
                            </div>
                            {propsIn?.isPreview && (
                                <button
                                    type="button"
                                    onClick={handlePreviewClose}
                                    className="group -mt-1 -mr-1 rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/50 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                                    aria-label="Close"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative px-8 py-8">
                        <p className="text-base leading-relaxed text-white/85 sm:text-lg">
                            {message}
                        </p>
                        {cta && (
                            <div className="mt-8 flex items-center justify-end gap-3">
                                {cta}
                            </div>
                        )}
                    </div>

                    {/* Bottom glow effect */}
                    <div
                        className={`absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${variant === 'info' ? 'text-blue-500' : ''} ${variant === 'warn' ? 'text-amber-500' : ''} ${variant === 'urgent' ? 'text-red-500' : ''} ${variant === 'maintenance' ? 'text-amber-500' : ''} ${variant === 'emergency' ? 'text-red-500' : ''} `}
                    ></div>
                </div>
            </div>
        );
    };

    // BAR MODE - Enhanced horizontal banner
    const panel = (
        variant: 'info' | 'warn' | 'urgent' | 'maintenance' | 'emergency',
        badgeLabel: string,
        message: string,
        cta?: React.ReactNode,
    ) => {
        const barStyles = {
            info: 'border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-blue-950/40 shadow-[0_0_40px_-15px_rgba(59,130,246,0.6)]',
            warn: 'border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 shadow-[0_0_40px_-15px_rgba(251,191,36,0.6)]',
            urgent: 'border-red-500/30 bg-gradient-to-r from-red-950/40 via-red-900/20 to-red-950/40 shadow-[0_0_40px_-15px_rgba(239,68,68,0.6)]',
            maintenance:
                'border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-orange-900/20 to-amber-950/40 shadow-[0_0_40px_-15px_rgba(251,191,36,0.6)]',
            emergency:
                'border-red-500/30 bg-gradient-to-r from-red-950/40 via-rose-900/20 to-red-950/40 shadow-[0_0_40px_-15px_rgba(239,68,68,0.7)]',
        };

        return (
            <div
                className={`relative z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-xl transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} `}
            >
                {/* Animated top border glow */}
                <div
                    className={`absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent ${variant === 'info' ? 'text-blue-500' : ''} ${variant === 'warn' ? 'text-amber-500' : ''} ${variant === 'urgent' ? 'text-red-500' : ''} ${variant === 'maintenance' ? 'text-amber-500' : ''} ${variant === 'emergency' ? 'text-red-500' : ''} `}
                >
                    <div className="absolute inset-0 animate-pulse opacity-75"></div>
                </div>

                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8">
                    <div
                        className={`flex items-center gap-4 rounded-2xl border-2 px-6 py-4 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${barStyles[variant]} `}
                    >
                        {badge(badgeLabel, variant)}
                        <span className="flex-1 text-sm leading-relaxed font-medium text-white/90 sm:text-base md:text-lg">
                            {message}
                        </span>
                        {cta && <div className="shrink-0">{cta}</div>}
                    </div>
                </div>
            </div>
        );
    };

    // Enhanced CTA button
    const ctaButton = (
        label: string,
        href?: string,
        onClick?: () => void,
        variant: 'primary' | 'secondary' = 'primary',
    ) => {
        const styles =
            variant === 'primary'
                ? 'bg-gradient-to-r from-white/15 to-white/10 border-white/20 text-white hover:from-white/20 hover:to-white/15 hover:border-white/30 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]'
                : 'border-white/15 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/25';

        const commonClasses = `
			inline-flex items-center gap-2 rounded-xl border px-5 py-2.5
			text-sm font-semibold transition-all duration-300
			hover:scale-105 hover:shadow-lg
			${styles}
		`;

        if (href) {
            return (
                <a
                    href={propsIn?.isPreview ? '#' : href}
                    onClick={
                        propsIn?.isPreview ? (e) => e.preventDefault() : onClick
                    }
                    className={commonClasses}
                >
                    {label}
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </a>
            );
        }

        return (
            <button type="button" onClick={onClick} className={commonClasses}>
                {label}
            </button>
        );
    };

    const renderBanner = () => {
        const useCard =
            propsIn?.mode === 'card' ||
            propsIn?.isPreview === true ||
            emergency.enabled === true ||
            maintenance.enabled === true;

        if (emergency.enabled && emergency.message) {
            // Allow admins to bypass emergency notices locally
            if (isAdmin && adminDismissedEmer) {
                return null;
            }
            if (useCard) {
                return card(
                    'emergency',
                    <>⚠️</>,
                    'Emergency Notice',
                    'Immediate attention required',
                    emergency.message,
                    'Emergency',
                    !propsIn?.isPreview && isAdmin && adminDismissKeys.emer
                        ? ctaButton(
                              'Dismiss for me',
                              undefined,
                              () => {
                                  try {
                                      localStorage.setItem(
                                          adminDismissKeys.emer!,
                                          '1',
                                      );
                                  } catch {
                                      // Ignore localStorage errors (e.g., in private browsing mode)
                                  }
                                  setIsVisible(false);
                              },
                              'secondary',
                          )
                        : undefined,
                );
            }
            return panel(
                'emergency',
                'Emergency',
                emergency.message,
                !propsIn?.isPreview && isAdmin && adminDismissKeys.emer
                    ? ctaButton(
                          'Dismiss for me',
                          undefined,
                          () => {
                              try {
                                  localStorage.setItem(
                                      adminDismissKeys.emer!,
                                      '1',
                                  );
                              } catch {
                                  // Ignore localStorage errors (e.g., in private browsing mode)
                              }
                              setIsVisible(false);
                          },
                          'secondary',
                      )
                    : undefined,
            );
        }

        if (maintenance.enabled && maintenance.message) {
            if (isAdmin && adminDismissedMaint) {
                return null;
            }
            if (useCard) {
                return card(
                    'maintenance',
                    <>🔧</>,
                    'Scheduled Maintenance',
                    'Service impact notification',
                    maintenance.message,
                    'Maintenance',
                    maintenance.cta_url
                        ? ctaButton(
                              maintenance.cta_label ?? 'Learn more',
                              maintenance.cta_url,
                          )
                        : !propsIn?.isPreview &&
                            isAdmin &&
                            adminDismissKeys.maint
                          ? ctaButton(
                                'Dismiss for me',
                                undefined,
                                () => {
                                    try {
                                        localStorage.setItem(
                                            adminDismissKeys.maint!,
                                            '1',
                                        );
                                    } catch {
                                        // Ignore localStorage errors (e.g., in private browsing mode)
                                    }
                                    setIsVisible(false);
                                },
                                'secondary',
                            )
                          : undefined,
                );
            }
            return panel(
                'maintenance',
                'Maintenance',
                maintenance.message,
                maintenance.cta_url
                    ? ctaButton(
                          maintenance.cta_label ?? 'Learn more',
                          maintenance.cta_url,
                          undefined,
                          'secondary',
                      )
                    : !propsIn?.isPreview && isAdmin && adminDismissKeys.maint
                      ? ctaButton(
                            'Dismiss for me',
                            undefined,
                            () => {
                                try {
                                    localStorage.setItem(
                                        adminDismissKeys.maint!,
                                        '1',
                                    );
                                } catch {
                                    // Ignore localStorage errors (e.g., in private browsing mode)
                                }
                                setIsVisible(false);
                            },
                            'secondary',
                        )
                      : undefined,
            );
        }

        if (
            ann.enabled &&
            withinSchedule &&
            ann.message &&
            (!dismissed || !ann.dismissible)
        ) {
            const level = ann.level as 'info' | 'warn' | 'urgent';
            const icons = { info: '📢', warn: '⚡', urgent: '🚨' };
            const headings = {
                info: 'Site Announcement',
                warn: 'Important Notice',
                urgent: 'Urgent Alert',
            };
            const subLabels = {
                info: 'Stay informed',
                warn: 'Please review',
                urgent: 'Immediate attention required',
            };

            // Admin bypass for announcements (even if not dismissible)
            if (isAdmin && adminDismissedAnn) {
                return null;
            }

            if (useCard) {
                return card(
                    level,
                    icons[level],
                    headings[level],
                    subLabels[level],
                    ann.message,
                    level === 'info' ? 'Announcement' : level,
                    ann.dismissible && !propsIn?.isPreview && dismissedKey
                        ? ctaButton(
                              'Dismiss',
                              undefined,
                              handleDismiss,
                              'secondary',
                          )
                        : !propsIn?.isPreview && isAdmin && adminDismissKeys.ann
                          ? ctaButton(
                                'Dismiss for me',
                                undefined,
                                () => {
                                    try {
                                        localStorage.setItem(
                                            adminDismissKeys.ann!,
                                            '1',
                                        );
                                    } catch {
                                        // Ignore localStorage errors (e.g., in private browsing mode)
                                    }
                                    setIsVisible(false);
                                },
                                'secondary',
                            )
                          : undefined,
                );
            }

            return panel(
                level,
                level === 'info' ? 'Announcement' : level,
                ann.message,
                ann.dismissible && dismissedKey && !propsIn?.isPreview
                    ? ctaButton(
                          'Dismiss',
                          undefined,
                          handleDismiss,
                          'secondary',
                      )
                    : !propsIn?.isPreview && isAdmin && adminDismissKeys.ann
                      ? ctaButton(
                            'Dismiss for me',
                            undefined,
                            () => {
                                try {
                                    localStorage.setItem(
                                        adminDismissKeys.ann!,
                                        '1',
                                    );
                                } catch {}
                                setIsVisible(false);
                            },
                            'secondary',
                        )
                      : undefined,
            );
        }

        return null;
    };

    return renderBanner();
}
