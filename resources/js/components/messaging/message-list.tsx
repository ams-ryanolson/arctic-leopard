import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import DateSeparator from './date-separator';
import MessageItem from './message-item';
import { isSameDay } from './message-utils';
import type { ActiveConversation, Message } from './types';

type MessageListProps = {
    messages: Message[];
    viewerId: number;
    conversation: ActiveConversation | null;
    hasMoreMessages: boolean;
    isLoadingOlder: boolean;
    expandedReactionsMessageId: number | null;
    tipRequestActionMessageId: number | null;
    onLoadOlder: () => void;
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
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
};

export default function MessageList({
    messages,
    viewerId,
    conversation,
    hasMoreMessages,
    isLoadingOlder,
    expandedReactionsMessageId,
    tipRequestActionMessageId,
    onLoadOlder,
    onToggleReactions,
    onReply,
    onReactionChange,
    onTipRequestAccept,
    onTipRequestDecline,
    scrollContainerRef,
    onScroll,
}: MessageListProps) {
    return (
        <div
            className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
            style={{ willChange: 'transform' }}
            ref={scrollContainerRef}
            onScroll={onScroll}
        >
            {hasMoreMessages && (
                <div className="mb-4 flex justify-center">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="border border-white/10 bg-black/30 text-xs tracking-[0.3em] text-white/60 uppercase hover:border-white/30 hover:bg-black/40"
                        onClick={onLoadOlder}
                        disabled={isLoadingOlder}
                    >
                        {isLoadingOlder ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading
                            </>
                        ) : (
                            'Load previous messages'
                        )}
                    </Button>
                </div>
            )}

            {messages.length === 0 ? (
                <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center text-white/40">
                    <div className="rounded-full bg-white/5 p-6">
                        <svg
                            className="h-12 w-12 text-white/20"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-semibold text-white/70">
                            No messages yet
                        </p>
                        <p className="text-sm text-white/50">
                            Be the first to send a message and start the
                            conversation.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex min-h-0 flex-col gap-0.5">
                    {messages.map((message, index) => {
                        const isOwnMessage =
                            message.author?.id === viewerId ||
                            message.author === null;
                        const showAuthor =
                            conversation?.is_group && !isOwnMessage;
                        const referencedMessage =
                            message.reply_to_id !== undefined &&
                            message.reply_to_id !== null
                                ? messages.find(
                                      (candidate) =>
                                          candidate.id === message.reply_to_id,
                                  )
                                : undefined;

                        // Group consecutive messages from same sender (show avatar only on first message or when author changes)
                        const prevMessage =
                            index > 0 ? messages[index - 1] : null;
                        const isFirstInGroup =
                            !prevMessage ||
                            prevMessage.author?.id !== message.author?.id ||
                            (prevMessage.created_at &&
                                message.created_at &&
                                new Date(message.created_at).getTime() -
                                    new Date(prevMessage.created_at).getTime() >
                                    5 * 60 * 1000); // 5 minutes gap

                        // Check if we need to show a date separator
                        const shouldShowDateSeparator =
                            !prevMessage ||
                            !isSameDay(
                                prevMessage.created_at,
                                message.created_at,
                            );

                        return (
                            <div key={message.id}>
                                {shouldShowDateSeparator && (
                                    <DateSeparator
                                        key={`date-${message.id}`}
                                        date={
                                            message.created_at ??
                                            message.updated_at ??
                                            ''
                                        }
                                    />
                                )}
                                <MessageItem
                                    message={message}
                                    isOwnMessage={isOwnMessage}
                                    showAuthor={showAuthor}
                                    showAvatar={isFirstInGroup}
                                    referencedMessage={referencedMessage}
                                    expandedReactionsMessageId={
                                        expandedReactionsMessageId
                                    }
                                    tipRequestActionMessageId={
                                        tipRequestActionMessageId
                                    }
                                    onToggleReactions={onToggleReactions}
                                    onReply={onReply}
                                    onReactionChange={onReactionChange}
                                    onTipRequestAccept={onTipRequestAccept}
                                    onTipRequestDecline={onTipRequestDecline}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
