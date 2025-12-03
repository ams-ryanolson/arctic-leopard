import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { CheckCheck } from 'lucide-react';
import { useState } from 'react';
import MessageActions from './message-actions';
import MessageAttachment from './message-attachment';
import MessageImageLightbox from './message-image-lightbox';
import MessageReactions from './message-reactions';
import { formatMessageTime, isOnlyEmojis } from './message-utils';
import TipMessage from './tip-message';
import TipRequestMessage from './tip-request-message';
import type { Attachment, Message, TipMessageMetadata } from './types';

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

    // Get all image attachments for lightbox
    const imageAttachments =
        message.attachments?.filter((att) => att.type === 'image') ?? [];
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxStartIndex, setLightboxStartIndex] = useState(0);

    const handleImageClick = (clickedIndex: number) => {
        setLightboxStartIndex(clickedIndex);
        setLightboxOpen(true);
    };

    return (
        <>
            <div
                className={cn(
                    'group relative flex gap-3 transition-colors hover:bg-white/[0.015] px-2 py-1.5',
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row',
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
            {/* Avatar - smaller and only when needed */}
            {showAvatar ? (
                <div
                    className={cn(
                        'flex shrink-0 flex-col items-end justify-start pt-0.5',
                        isOwnMessage && 'items-start',
                    )}
                >
                    <Avatar className="size-6 border border-white/10 sm:size-7">
                        {authorAvatar ? (
                            <AvatarImage src={authorAvatar} alt={authorName} />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-[10px] font-semibold text-amber-200 sm:text-xs">
                                {authorInitials}
                            </AvatarFallback>
                        )}
                    </Avatar>
                </div>
            ) : (
                <div className="w-6 shrink-0 sm:w-7" />
            )}

            {/* Message Content */}
            <div
                className={cn(
                    'flex min-w-0 flex-1 flex-col gap-0.5',
                    isOwnMessage ? 'items-end' : 'items-start',
                )}
            >
                {/* Author Name (only in group chats) */}
                {showAuthor && (
                    <div className="flex items-center gap-1 px-1">
                        <span className="text-[11px] font-medium text-white/60 sm:text-xs">
                            {authorName}
                        </span>
                    </div>
                )}

                {/* Message Bubble */}
                <div
                    className={cn(
                        'relative max-w-[85%] rounded-2xl transition-all sm:max-w-[75%] lg:max-w-[65%]',
                        shouldShowEmojiStyle ? 'px-4 py-3' : message.body ? 'px-3 py-1.5' : 'p-0',
                        // Only show background/border if there's text content
                        message.body && isOwnMessage
                            ? 'bg-emerald-500/20 text-emerald-50 shadow-[0_2px_8px_rgba(16,185,129,0.15)] border border-emerald-500/20'
                            : message.body
                              ? 'bg-white/10 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-white/10'
                              : '', // No background/border for attachment-only messages
                    )}
                >
                    {message.deleted_at ? (
                        <span className="text-xs text-white/50 italic">
                            Message removed
                        </span>
                    ) : (
                        <>
                            {/* Reply Reference - compact */}
                            {referencedMessage && (
                                <div
                                    className={cn(
                                        'mb-1.5 rounded-lg border-l-2 pl-2 text-[11px]',
                                        isOwnMessage
                                            ? 'border-l-emerald-400/40'
                                            : 'border-l-white/30',
                                    )}
                                >
                                    <p className="font-medium text-white/60">
                                        {referencedMessage.author
                                            ?.display_name ??
                                            referencedMessage.author
                                                ?.username ??
                                            'Unknown'}
                                    </p>
                                    <p className="line-clamp-1 text-white/70">
                                        {referencedMessage.body ?? ''}
                                    </p>
                                </div>
                            )}

                            {/* Message Body */}
                            {message.body && (
                                <p
                                    className={cn(
                                        'break-words whitespace-pre-wrap',
                                        shouldShowEmojiStyle
                                            ? 'text-center text-4xl leading-none'
                                            : 'text-sm leading-[1.4] text-white/95',
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
                                            message.attachments.length > 1
                                                ? 'grid grid-cols-2 gap-2'
                                                : '',
                                            message.body ? 'mt-2' : '', // Only add margin if there's text above
                                        )}
                                    >
                                        {message.attachments.map(
                                            (attachment, index) => {
                                                const imageIndex =
                                                    imageAttachments.findIndex(
                                                        (img) =>
                                                            img.id ===
                                                            attachment.id,
                                                    );
                                                return (
                                                    <MessageAttachment
                                                        key={attachment.id}
                                                        attachment={
                                                            attachment
                                                        }
                                                        onImageClick={
                                                            attachment.type ===
                                                            'image'
                                                                ? () =>
                                                                      handleImageClick(
                                                                          imageIndex,
                                                                      )
                                                                : undefined
                                                        }
                                                    />
                                                );
                                            },
                                        )}
                                    </div>
                                )}

                            {/* Timestamp and Read Receipt - inline at bottom */}
                            <div
                                className={cn(
                                    'mt-1 flex items-center gap-1',
                                    isOwnMessage ? 'justify-end' : 'justify-start',
                                )}
                            >
                                <span className="text-[10px] text-white/40">
                                    {formatMessageTime(createdAt)}
                                </span>
                                {isOwnMessage && (
                                    <CheckCheck
                                        className="h-2.5 w-2.5 text-white/40"
                                        strokeWidth={2.5}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Message Actions - inline below message bubble */}
                {!message.deleted_at && (
                    <div
                        className={cn(
                            'flex items-center gap-1 px-1',
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

                {/* Expanded Reactions - compact */}
                {!message.deleted_at &&
                    expandedReactionsMessageId === message.id && (
                        <div className="mt-0.5 px-1">
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

            {/* Image Lightbox */}
            {imageAttachments.length > 0 && (
                <MessageImageLightbox
                    attachments={imageAttachments}
                    open={lightboxOpen}
                    onOpenChange={setLightboxOpen}
                    startIndex={lightboxStartIndex}
                />
            )}
        </div>
        </>
    );
}
