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
import type { RefObject } from 'react';

type MobileMessagingViewProps = {
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
    onBack: () => void;
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
};

export default function MobileMessagingView({
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
    onBack,
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
}: MobileMessagingViewProps) {
    // Show settings view if enabled
    if (showSettings) {
        return <MessagesSettings onBack={onBack} showBackButton={true} />;
    }

    // Route-based rendering: show conversation view if we have an active conversation
    // Otherwise show list view
    if (currentConversation && selectedConversationId) {
        return (
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-neutral-950 text-white">
                {/* Fixed header */}
                <div className="shrink-0 border-b border-white/5 bg-neutral-950/80 backdrop-blur-xl">
                    <ConversationHeader
                        conversation={currentConversation}
                        presenceMembers={presenceMembers}
                        onBack={onBack}
                        showBackButton={true}
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
                        expandedReactionsMessageId={expandedReactionsMessageId}
                        tipRequestActionMessageId={tipRequestActionMessageId}
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
                <div className="shrink-0 border-t border-white/5 bg-neutral-950/80 backdrop-blur-xl">
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
        );
    }

    // Show list view when no conversation is active
    return (
        <ConversationList
            threads={threads}
            selectedConversationId={selectedConversationId}
            onSelectConversation={onSelectConversation}
            onRefresh={onRefresh}
        />
    );
}
