import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { CheckCheck } from 'lucide-react';
import { useState } from 'react';
import MessageActions from './message-actions';
import MessageAttachment from './message-attachment';
import MessageReactions from './message-reactions';
import { formatMessageTime, isOnlyEmojis } from './message-utils';
import TipMessage from './tip-message';
import TipRequestMessage from './tip-request-message';
import type { Message, TipMessageMetadata } from './types';

type MessageItemProps = {
    message: Message;
    isOwnMessage: boolean;
    showAuthor: boolean;
    showAvatar?: boolean;
    referencedMessage?: Message;
    expandedReactionsMessageId: number | null;
    tipRequestActionMessageId: number | null;
    onToggleReactions: (messageId: number) => void;
    onReply: (message: Message) => void;
    onReactionChange: (
        messageId: number,
        summary: Array<{
            emoji: string;
            variant?: string | null;
            count: number;
            reacted: boolean;
        }>,
    ) => void;
    onTipRequestAccept: (messageId: number) => void;
    onTipRequestDecline: (messageId: number) => void;
};

export default function MessageItem({
    message,
    isOwnMessage,
    showAuthor,
    showAvatar = true,
    referencedMessage,
    expandedReactionsMessageId,
    tipRequestActionMessageId,
    onToggleReactions,
    onReply,
    onReactionChange,
    onTipRequestAccept,
    onTipRequestDecline,
}: MessageItemProps) {
    const messageType = message.type ?? 'text';
    const tipMetadata = (message.metadata ?? {}) as TipMessageMetadata;
    const createdAt = message.created_at ?? message.updated_at ?? '';

    const authorName =
        message.author?.display_name ?? message.author?.username ?? 'Unknown';
    const authorAvatar = message.author?.avatar_url;
    const authorInitials = authorName.slice(0, 2).toUpperCase();
    const [isHovered, setIsHovered] = useState(false);

    if (messageType === 'tip') {
        return (
            <div
                className={cn(
                    'group relative flex gap-3 px-1 py-1 transition-colors hover:bg-white/2.5',
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row',
                )}
            >
                {showAvatar ? (
                    <div
                        className={cn(
                            'flex shrink-0 flex-col items-end justify-start pt-1',
                            isOwnMessage && 'items-start',
                        )}
                    >
                        <Avatar className="size-8 border-2 border-white/10 shadow-lg ring-2 ring-black/20">
                            {authorAvatar ? (
                                <AvatarImage
                                    src={authorAvatar}
                                    alt={authorName}
                                />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-xs font-semibold text-amber-200">
                                    {authorInitials}
                                </AvatarFallback>
                            )}
                        </Avatar>
                    </div>
                ) : (
                    <div className="w-8 shrink-0" />
                )}
                <div
                    className={cn(
                        'flex min-w-0 flex-1 flex-col gap-1.5',
                        isOwnMessage ? 'items-end' : 'items-start',
                    )}
                >
                    {showAuthor && (
                        <div className="flex items-center gap-2 px-1">
                            <span className="text-xs font-semibold text-white/70">
                                {authorName}
                            </span>
                        </div>
                    )}
                    <TipMessage
                        isOwnMessage={isOwnMessage}
                        metadata={tipMetadata}
                        createdAt={createdAt}
                    />
                </div>
            </div>
        );
    }

    if (messageType === 'tip_request') {
        const status = tipMetadata.status ?? 'pending';
        const isPending = status === 'pending';
        const canRespond = isPending && !isOwnMessage;

        return (
            <div
                className={cn(
                    'group relative flex gap-3 px-1 py-1 transition-colors hover:bg-white/2.5',
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row',
                )}
            >
                {showAvatar ? (
                    <div
                        className={cn(
                            'flex shrink-0 flex-col items-end justify-start pt-1',
                            isOwnMessage && 'items-start',
                        )}
                    >
                        <Avatar className="size-8 border-2 border-white/10 shadow-lg ring-2 ring-black/20">
                            {authorAvatar ? (
                                <AvatarImage
                                    src={authorAvatar}
                                    alt={authorName}
                                />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-xs font-semibold text-amber-200">
                                    {authorInitials}
                                </AvatarFallback>
                            )}
                        </Avatar>
                    </div>
                ) : (
                    <div className="w-8 shrink-0" />
                )}
                <div
                    className={cn(
                        'flex min-w-0 flex-1 flex-col gap-1.5',
                        isOwnMessage ? 'items-end' : 'items-start',
                    )}
                >
                    {showAuthor && (
                        <div className="flex items-center gap-2 px-1">
                            <span className="text-xs font-semibold text-white/70">
                                {authorName}
                            </span>
                        </div>
                    )}
                    <TipRequestMessage
                        isOwnMessage={isOwnMessage}
                        metadata={tipMetadata}
                        createdAt={createdAt}
                        messageId={message.id}
                        canRespond={canRespond}
                        isProcessing={tipRequestActionMessageId === message.id}
                        onAccept={onTipRequestAccept}
                        onDecline={onTipRequestDecline}
                    />
                </div>
            </div>
        );
    }

    const messageBody = message.body ?? '';
    const isEmojiOnly = isOnlyEmojis(messageBody) && messageBody.trim() !== '';
    const hasReply =
        message.reply_to_id !== undefined && message.reply_to_id !== null;
    const hasAttachments =
        message.attachments && message.attachments.length > 0;
    const shouldShowEmojiStyle = isEmojiOnly && !hasReply && !hasAttachments;
    const reactionCount =
        message.reaction_summary?.reduce(
            (total, summary) => total + summary.count,
            0,
        ) ?? 0;

    return (
        <div
            className={cn(
                'group relative flex gap-3 px-2 py-1.5 transition-all duration-150 hover:bg-white/3',
                isOwnMessage ? 'flex-row-reverse' : 'flex-row',
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Avatar */}
            {showAvatar ? (
                <div
                    className={cn(
                        'flex shrink-0 flex-col items-end justify-start pt-1',
                        isOwnMessage && 'items-start',
                    )}
                >
                    <Avatar className="size-8 border-2 border-white/10 shadow-lg ring-2 ring-black/20">
                        {authorAvatar ? (
                            <AvatarImage src={authorAvatar} alt={authorName} />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-xs font-semibold text-amber-200">
                                {authorInitials}
                            </AvatarFallback>
                        )}
                    </Avatar>
                </div>
            ) : (
                <div className="w-8 shrink-0" />
            )}

            {/* Message Content */}
            <div
                className={cn(
                    'flex min-w-0 flex-1 flex-col gap-1.5',
                    isOwnMessage ? 'items-end' : 'items-start',
                )}
            >
                {/* Author Name (only in group chats) */}
                {showAuthor && (
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-xs font-semibold text-white/70">
                            {authorName}
                        </span>
                    </div>
                )}

                {/* Message Bubble */}
                <div
                    className={cn(
                        'relative max-w-[85%] rounded-2xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 lg:max-w-[65%]',
                        shouldShowEmojiStyle ? 'px-6 py-5' : '',
                        isOwnMessage
                            ? 'border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/25 text-emerald-50 shadow-emerald-500/10'
                            : 'border border-white/20 bg-white/10 text-white shadow-white/5 backdrop-blur-sm',
                        'hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]',
                    )}
                >
                    {message.deleted_at ? (
                        <span className="text-xs text-white/50 italic">
                            Message removed
                        </span>
                    ) : (
                        <>
                            {/* Reply Reference */}
                            {referencedMessage && (
                                <div
                                    className={cn(
                                        'mb-2.5 rounded-xl border px-3 py-2 text-xs',
                                        isOwnMessage
                                            ? 'border-emerald-400/20 bg-emerald-500/10'
                                            : 'border-white/15 bg-white/5',
                                    )}
                                >
                                    <p className="mb-1 font-medium text-white/60">
                                        {referencedMessage.author
                                            ?.display_name ??
                                            referencedMessage.author
                                                ?.username ??
                                            'Unknown'}
                                    </p>
                                    <p className="line-clamp-2 text-white/80">
                                        {(referencedMessage.body ?? '').slice(
                                            0,
                                            120,
                                        )}
                                        {(referencedMessage.body ?? '').length >
                                        120
                                            ? '…'
                                            : ''}
                                    </p>
                                </div>
                            )}

                            {/* Message Body */}
                            {message.body && (
                                <p
                                    className={cn(
                                        'break-words whitespace-pre-wrap',
                                        shouldShowEmojiStyle
                                            ? 'text-center text-5xl leading-none'
                                            : 'text-[15px] leading-[1.5] text-white/95',
                                    )}
                                >
                                    {message.body}
                                </p>
                            )}

                            {/* Attachments */}
                            {message.attachments &&
                                message.attachments.length > 0 && (
                                    <div
                                        className={cn(
                                            'grid gap-2',
                                            message.attachments.length > 1
                                                ? 'mt-3 grid-cols-2'
                                                : 'mt-3',
                                        )}
                                    >
                                        {message.attachments.map(
                                            (attachment) => (
                                                <MessageAttachment
                                                    key={attachment.id}
                                                    attachment={attachment}
                                                />
                                            ),
                                        )}
                                    </div>
                                )}

                            {/* Timestamp and Read Receipt (always at bottom right for sent, bottom left for received) */}
                            {!shouldShowEmojiStyle && (
                                <div
                                    className={cn(
                                        'mt-1.5 flex items-center gap-1',
                                        isOwnMessage
                                            ? 'justify-end'
                                            : 'justify-start',
                                    )}
                                >
                                    <span className="text-[11px] text-white/50">
                                        {formatMessageTime(createdAt)}
                                    </span>
                                    {isOwnMessage && (
                                        <CheckCheck
                                            className="h-3 w-3 text-white/50"
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </div>
                            )}
                            {/* For emoji-only messages, show timestamp below */}
                            {shouldShowEmojiStyle && (
                                <div
                                    className={cn(
                                        'mt-2 flex items-center gap-1',
                                        isOwnMessage
                                            ? 'justify-end'
                                            : 'justify-start',
                                    )}
                                >
                                    <span className="text-[11px] text-white/50">
                                        {formatMessageTime(createdAt)}
                                    </span>
                                    {isOwnMessage && (
                                        <CheckCheck
                                            className="h-3 w-3 text-white/50"
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Message Actions (hover-only) */}
                {!message.deleted_at && (
                    <div
                        className={cn(
                            'flex items-center px-1',
                            isOwnMessage ? 'justify-end' : 'justify-start',
                        )}
                    >
                        <MessageActions
                            isOwnMessage={isOwnMessage}
                            reactionCount={reactionCount}
                            isReactionsExpanded={
                                expandedReactionsMessageId === message.id
                            }
                            isHovered={isHovered}
                            onToggleReactions={() =>
                                onToggleReactions(message.id)
                            }
                            onReply={() => onReply(message)}
                        />
                    </div>
                )}

                {/* Expanded Reactions */}
                {!message.deleted_at &&
                    expandedReactionsMessageId === message.id && (
                        <div className="mt-1 px-1">
                            <MessageReactions
                                messageId={message.id}
                                reactions={message.reaction_summary ?? []}
                                onChange={(summary) =>
                                    onReactionChange(message.id, summary)
                                }
                            />
                        </div>
                    )}
            </div>
        </div>
    );
}
