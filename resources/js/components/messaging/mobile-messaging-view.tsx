import { cn } from '@/lib/utils';

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

type MobileMessagingViewProps = {
    threads: Thread[];
    selectedConversationId: number | null;
    showConversationView: boolean;
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
    showConversationView,
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
    return (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <>
                <div
                    className={cn(
                        'absolute inset-0 flex min-h-0 flex-1 flex-col overflow-hidden transition-transform duration-300 ease-in-out',
                        showConversationView
                            ? 'translate-x-0'
                            : '-translate-x-full',
                    )}
                >
                    {selectedConversationId && currentConversation ? (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-white/10 bg-white/5 text-white lg:rounded-3xl">
                            <ConversationHeader
                                conversation={currentConversation}
                                presenceMembers={presenceMembers}
                                onBack={onBack}
                                showBackButton={true}
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

                                <div className="border-t border-white/10 px-4 py-3">
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
                        </div>
                    ) : null}
                </div>
                <div
                    className={cn(
                        'absolute inset-0 flex min-h-0 flex-1 flex-col overflow-hidden transition-transform duration-300 ease-in-out',
                        showConversationView
                            ? 'translate-x-full'
                            : 'translate-x-0',
                    )}
                >
                    <ConversationList
                        threads={threads}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={onSelectConversation}
                        onRefresh={onRefresh}
                    />
                </div>
            </>
        </div>
    );
}

