import ConversationHeader from '@/components/messaging/conversation-header';
import ConversationList from '@/components/messaging/conversation-list';
import MessageComposer from '@/components/messaging/message-composer';
import MessageList from '@/components/messaging/message-list';
import type {
    ActiveConversation,
    Message,
    PresenceMember,
    ReactionSummary,
    Thread,
} from '@/components/messaging/types';
import TypingIndicator from '@/components/messaging/typing-indicator';
import type { RefObject } from 'react';

type DesktopMessagingViewProps = {
    threads: Thread[];
    selectedConversationId: number | null;
    currentConversation: ActiveConversation | null;
    messages: Message[];
    presenceMembers: PresenceMember[];
    typingUsers: string[];
    replyTo: Message | null;
    expandedReactionsMessageId: number | null;
    tipRequestActionMessageId: number | null;
    hasMoreMessages: boolean;
    isLoadingOlder: boolean;
    keyboardHeight: number;
    scrollContainerRef: RefObject<HTMLDivElement | null>;
    viewer: {
        id: number;
        display_name?: string | null;
        avatar_url?: string | null;
        username?: string | null;
    };
    onSelectConversation: (threadId: number) => void;
    onRefresh: () => void;
    onLoadOlder: () => void;
    onToggleReactions: (messageId: number) => void;
    onReply: (message: Message) => void;
    onCancelReply: () => void;
    onReactionChange: (messageId: number, summary: ReactionSummary[]) => void;
    onTipRequestAccept: (messageId: number) => void;
    onTipRequestDecline: (messageId: number) => void;
    onMessageSent: (message: Record<string, unknown>) => void;
    onTyping: () => void;
    onScroll: () => void;
    setReplyTo: (message: Message | null) => void;
    setExpandedReactionsMessageId: (id: number | null) => void;
};

export default function DesktopMessagingView({
    threads,
    selectedConversationId,
    currentConversation,
    messages,
    presenceMembers,
    typingUsers,
    replyTo,
    expandedReactionsMessageId,
    tipRequestActionMessageId,
    hasMoreMessages,
    isLoadingOlder,
    keyboardHeight,
    scrollContainerRef,
    viewer,
    onSelectConversation,
    onRefresh,
    onLoadOlder,
    onToggleReactions,
    onReply,
    onCancelReply,
    onReactionChange,
    onTipRequestAccept,
    onTipRequestDecline,
    onMessageSent,
    onTyping,
    onScroll,
    setReplyTo,
    setExpandedReactionsMessageId,
}: DesktopMessagingViewProps) {
    return (
        <>
            <ConversationList
                threads={threads}
                selectedConversationId={selectedConversationId}
                onSelectConversation={onSelectConversation}
                onRefresh={onRefresh}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-white">
                {currentConversation ? (
                    <>
                        <ConversationHeader
                            conversation={currentConversation}
                            presenceMembers={presenceMembers}
                            showBackButton={false}
                        />

                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <MessageList
                                messages={messages}
                                viewerId={viewer.id}
                                conversation={currentConversation}
                                hasMoreMessages={hasMoreMessages}
                                isLoadingOlder={isLoadingOlder}
                                expandedReactionsMessageId={
                                    expandedReactionsMessageId
                                }
                                tipRequestActionMessageId={
                                    tipRequestActionMessageId
                                }
                                onLoadOlder={onLoadOlder}
                                onToggleReactions={onToggleReactions}
                                onReply={onReply}
                                onReactionChange={onReactionChange}
                                onTipRequestAccept={onTipRequestAccept}
                                onTipRequestDecline={onTipRequestDecline}
                                scrollContainerRef={scrollContainerRef}
                                onScroll={onScroll}
                            />

                            <TypingIndicator users={typingUsers} />

                            <div className="border-t border-white/10 px-4 py-3 sm:px-6 sm:py-4">
                                <MessageComposer
                                    conversationId={currentConversation.id}
                                    onMessageSent={onMessageSent}
                                    replyTo={
                                        replyTo
                                            ? {
                                                  id: replyTo.id,
                                                  body: replyTo.body,
                                                  author: replyTo.author,
                                              }
                                            : null
                                    }
                                    onCancelReply={onCancelReply}
                                    onTyping={onTyping}
                                    keyboardHeight={keyboardHeight}
                                    viewer={viewer}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-white/40">
                        <p className="text-sm font-medium">
                            Select a thread to begin messaging.
                        </p>
                        <p className="text-xs text-white/50">
                            Your conversations will appear on the left once you
                            start chatting.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

