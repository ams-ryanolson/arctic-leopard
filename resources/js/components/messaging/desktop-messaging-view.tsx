import ConversationHeader from '@/components/messaging/conversation-header';
import ConversationList from '@/components/messaging/conversation-list';
import MessageComposer from '@/components/messaging/message-composer';
import MessageList from '@/components/messaging/message-list';
import MessagesSettings from '@/components/messaging/messages-settings';
import type {
    ActiveConversation,
    Message,
    PresenceMember,
    ReactionSummary,
    Thread,
} from '@/components/messaging/types';
import TypingIndicator from '@/components/messaging/typing-indicator';
import { MessageSquare } from 'lucide-react';
import type { RefObject } from 'react';

type DesktopMessagingViewProps = {
    threads: Thread[];
    selectedConversationId: number | null;
    currentConversation: ActiveConversation | null;
    messages: Message[];
    presenceMembers: PresenceMember[];
    typingUsers: Array<{ id: number; name: string }>;
    replyTo: Message | null;
    expandedReactionsMessageId: number | null;
    tipRequestActionMessageId: number | null;
    hasMoreMessages: boolean;
    isLoadingOlder: boolean;
    keyboardHeight: number;
    scrollContainerRef: RefObject<HTMLDivElement | null>;
    showSettings?: boolean;
    viewer: {
        id: number;
        display_name?: string | null;
        avatar_url?: string | null;
        username?: string | null;
    };
    onSelectConversation: (threadUlid: string) => void;
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
    onBackFromSettings?: () => void;
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
    showSettings = false,
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
    onBackFromSettings,
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

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-neutral-950 text-white">
                {showSettings ? (
                    <MessagesSettings showBackButton={false} />
                ) : currentConversation ? (
                    <div className="flex h-full min-h-0 flex-col">
                        {/* Fixed header */}
                        <div className="shrink-0 border-b border-white/5">
                            <ConversationHeader
                                conversation={currentConversation}
                                presenceMembers={presenceMembers}
                                showBackButton={false}
                            />
                        </div>

                        {/* Scrollable message area - this is the ONLY thing that scrolls */}
                        <div className="min-h-0 flex-1 overflow-hidden">
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
                        </div>

                        {/* Fixed typing indicator */}
                        <div className="shrink-0">
                            <TypingIndicator users={typingUsers} />
                        </div>

                        {/* Fixed composer at bottom */}
                        <div className="shrink-0 border-t border-white/5">
                            <MessageComposer
                                conversationId={currentConversation.ulid}
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
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                        <div className="rounded-full bg-white/5 p-8">
                            <MessageSquare
                                className="h-16 w-16 text-white/30"
                                strokeWidth={1.5}
                            />
                        </div>
                        <div className="max-w-sm space-y-2">
                            <h3 className="text-lg font-semibold text-white/80">
                                Select a conversation
                            </h3>
                            <p className="text-sm leading-relaxed text-white/50">
                                Choose a thread from the left to start
                                messaging, or create a new conversation to
                                connect with someone.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
