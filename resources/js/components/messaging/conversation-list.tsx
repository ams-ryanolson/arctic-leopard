import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { formatRelativeTime } from './message-utils';
import type { Thread, TipMessageMetadata } from './types';

type ConversationListProps = {
    threads: Thread[];
    selectedConversationId: number | null;
    onSelectConversation: (threadId: number) => void;
    onRefresh?: () => void;
    isLoading?: boolean;
};

export default function ConversationList({
    threads,
    selectedConversationId,
    onSelectConversation,
    onRefresh,
    isLoading = false,
}: ConversationListProps) {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const startYRef = useRef<number | null>(null);
    const isRefreshingRef = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!scrollContainerRef.current || isRefreshingRef.current) {
            return;
        }

        const container = scrollContainerRef.current;
        if (container.scrollTop > 0) {
            return;
        }

        startYRef.current = e.touches[0].clientY;
    }, []);

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (
                startYRef.current === null ||
                !scrollContainerRef.current ||
                isRefreshingRef.current
            ) {
                return;
            }

            const container = scrollContainerRef.current;
            if (container.scrollTop > 0) {
                startYRef.current = null;
                setIsPulling(false);
                setPullDistance(0);
                return;
            }

            const currentY = e.touches[0].clientY;
            const distance = Math.max(0, currentY - startYRef.current);
            const maxPull = 80;

            if (distance > 0) {
                setIsPulling(true);
                setPullDistance(Math.min(distance, maxPull));
            }
        },
        [],
    );

    const handleTouchEnd = useCallback(() => {
        if (startYRef.current === null || isRefreshingRef.current) {
            return;
        }

        if (pullDistance > 50 && onRefresh) {
            isRefreshingRef.current = true;
            onRefresh();
            setTimeout(() => {
                isRefreshingRef.current = false;
                setIsPulling(false);
                setPullDistance(0);
            }, 1000);
        } else {
            setIsPulling(false);
            setPullDistance(0);
        }

        startYRef.current = null;
    }, [pullDistance, onRefresh]);

    useEffect(() => {
        if (!isPulling) {
            setPullDistance(0);
        }
    }, [isPulling]);

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-white/5 text-white lg:h-auto lg:w-[320px] lg:flex-none lg:rounded-3xl lg:border lg:bg-white/5">
            <div className="border-b border-white/10 px-4 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold tracking-wide text-white">
                        Inbox
                    </p>
                </div>
                <button
                    type="button"
                    disabled
                    className="mt-4 flex w-full items-center justify-between rounded-full border border-white/12 bg-black/25 px-4 py-2 text-left text-xs text-white/60 transition hover:border-white/20 hover:bg-black/35 focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-80"
                    aria-label="Thread search coming soon"
                >
                    <span className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-white/70" />
                        <span className="text-[0.65rem] tracking-[0.2em] text-white/65 uppercase">
                            Search threads
                        </span>
                    </span>
                    <span className="text-[0.6rem] tracking-[0.2em] text-white/35 uppercase">
                        Coming soon
                    </span>
                </button>
            </div>
            <div
                ref={scrollContainerRef}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: isPulling
                        ? `translateY(${pullDistance}px)`
                        : undefined,
                    transition: isPulling ? 'none' : 'transform 0.3s ease-out',
                }}
            >
                {isPulling && pullDistance > 10 && (
                    <div className="flex items-center justify-center py-4">
                        <div
                            className={cn(
                                'flex items-center gap-2 text-xs text-white/60',
                                pullDistance > 50 && 'text-white/80',
                            )}
                        >
                            {pullDistance > 50 ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/80"></div>
                                    <span>Release to refresh</span>
                                </>
                            ) : (
                                <span>Pull to refresh</span>
                            )}
                        </div>
                    </div>
                )}
                {isLoading ? (
                    <ul className="flex flex-col gap-2 px-4 py-3 sm:gap-3 sm:py-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <li key={index} className="min-w-0">
                                <div className="w-full animate-pulse rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                    <div className="flex items-start gap-3">
                                        <div className="size-11 rounded-full bg-white/10"></div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="h-4 w-3/4 rounded bg-white/10"></div>
                                            <div className="h-3 w-1/2 rounded bg-white/5"></div>
                                            <div className="h-3 w-full rounded bg-white/5"></div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : threads.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-white/40">
                        <Users className="h-10 w-10" />
                        <p className="text-sm font-medium">
                            No conversations yet
                        </p>
                        <p className="text-xs text-white/50">
                            Start a new message to connect with the community.
                        </p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2 px-4 py-3 sm:gap-3 sm:py-4">
                        {threads.map((thread) => {
                            const isActive =
                                thread.id === selectedConversationId;
                            const snippetMetadata = (thread.last_message
                                ?.metadata ?? {}) as TipMessageMetadata;
                            const lastType =
                                thread.last_message?.type ?? 'text';
                            const snippet =
                                thread.last_message?.deleted_at !== null
                                    ? 'Message removed'
                                    : lastType === 'tip'
                                      ? `Tip · ${new Intl.NumberFormat(
                                            undefined,
                                            {
                                                style: 'currency',
                                                currency:
                                                    snippetMetadata.currency ??
                                                    'USD',
                                            },
                                        ).format(snippetMetadata.amount ?? 0)}`
                                      : lastType === 'tip_request'
                                        ? 'Tip request'
                                        : (thread.last_message?.body ??
                                          (thread.last_message?.attachments
                                              ?.length
                                              ? 'Shared media'
                                              : 'No messages yet'));
                            const counterparts = thread.participants.filter(
                                (participant) => !participant.is_viewer,
                            );
                            const primaryParticipant = counterparts[0];
                            const participantSummary = thread.is_group
                                ? `${thread.participants.length} participants`
                                : counterparts
                                      .map(
                                          (participant) =>
                                              participant.display_name ??
                                              participant.username,
                                      )
                                      .filter(Boolean)
                                      .join(' • ');
                            const threadButtonClasses = cn(
                                'w-full rounded-xl border border-transparent px-3 py-2.5 text-left transition focus:outline-none sm:rounded-2xl sm:px-4 sm:py-3',
                                isActive
                                    ? 'border-amber-400/40 bg-white/10 shadow-[0_25px_60px_-40px_rgba(250,204,21,0.65)]'
                                    : 'hover:border-white/10 hover:bg-white/5',
                            );
                            const initialsSource =
                                primaryParticipant?.display_name ??
                                primaryParticipant?.username ??
                                thread.title ??
                                'RK';
                            const initials = initialsSource
                                .slice(0, 2)
                                .toUpperCase();

                            return (
                                <li key={thread.id} className="min-w-0">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onSelectConversation(thread.id)
                                        }
                                        className={threadButtonClasses}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar className="size-11 border border-white/15 bg-white/10 text-sm font-semibold text-white">
                                                {primaryParticipant?.avatar_url ? (
                                                    <AvatarImage
                                                        src={
                                                            primaryParticipant.avatar_url
                                                        }
                                                        alt={
                                                            primaryParticipant.display_name ??
                                                            primaryParticipant.username ??
                                                            thread.title
                                                        }
                                                    />
                                                ) : (
                                                    <AvatarFallback>
                                                        {initials}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-white">
                                                            {thread.title}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs text-white/60">
                                                            {participantSummary ||
                                                                'Conversation'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                                        {thread.unread_count >
                                                            0 && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.6rem] tracking-[0.3em] text-amber-200 uppercase"
                                                            >
                                                                {
                                                                    thread.unread_count
                                                                }{' '}
                                                                new
                                                            </Badge>
                                                        )}
                                                        <span className="text-[0.6rem] tracking-[0.3em] text-white/40 uppercase">
                                                            {formatRelativeTime(
                                                                thread.last_message_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="mt-2 line-clamp-2 text-xs text-white/55">
                                                    {snippet}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
