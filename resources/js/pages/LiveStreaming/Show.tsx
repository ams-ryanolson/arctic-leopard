import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    DollarSign,
    Eye,
    Flag,
    Gift,
    Heart,
    MessageCircle,
    Radio,
    Settings,
    Share2,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface StreamData {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    category: string;
    status: 'scheduled' | 'live' | 'ended';
    viewer_count: number;
    started_at: string | null;
    stream_key: string;
    rtmp_url: string;
    user: {
        id: number;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
    participants: Array<{
        id: number;
        user_id: number;
        role: string;
        user: {
            id: number;
            username: string;
            display_name: string | null;
            avatar_url: string | null;
        };
    }>;
}

interface ShowProps {
    stream: StreamData;
    canModerate: boolean;
    isHost: boolean;
}

export default function Show({ stream, canModerate: _canModerate, isHost }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const [likes, setLikes] = useState(1234);
    const [_tips, _setTips] = useState(0);
    const [_showChatMobile, _setShowChatMobile] = useState(true);

    const handleLike = () => {
        setLikes((prev) => prev + 1);
    };

    // Mock chat messages with animations
    const chatMessages = [
        {
            id: 1,
            username: 'User123',
            message: 'Hey everyone!',
            color: 'from-blue-400 to-purple-500',
        },
        {
            id: 2,
            username: 'Fan456',
            message: 'This stream is amazing 🔥',
            color: 'from-green-400 to-blue-500',
        },
        {
            id: 3,
            username: 'BigSpender',
            message: '💎 sent a tip!',
            color: 'from-amber-400 to-orange-500',
            isTip: true,
        },
        {
            id: 4,
            username: 'Viewer789',
            message: "Can't wait for the next part!",
            color: 'from-pink-400 to-rose-500',
        },
        {
            id: 5,
            username: 'StreamFan',
            message: 'Love this content!',
            color: 'from-cyan-400 to-blue-500',
        },
        {
            id: 6,
            username: 'Supporter',
            message: 'Keep it up!',
            color: 'from-violet-400 to-purple-500',
        },
    ];

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">
            {/* Main Content Area - No Scroll */}
            <div className="relative flex flex-1 overflow-hidden">
                {/* Video Area - Full screen on mobile, flex-1 on desktop */}
                <div className="relative flex flex-1 flex-col bg-gradient-to-br from-rose-500/20 to-violet-600/20">
                    {/* Video Player Area */}
                    <div className="relative flex-1">
                        {/* Video Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Radio className="size-32 text-white/20" />
                        </div>

                        {/* Top Overlay - Stream Info */}
                        <div className="absolute top-0 right-0 left-0 z-20 bg-gradient-to-b from-black/70 via-black/40 to-transparent p-3 md:p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-3">
                                    {/* Host Avatar */}
                                    <div className="relative">
                                        {stream.user.avatar_url ? (
                                            <img
                                                src={stream.user.avatar_url}
                                                alt={
                                                    stream.user.display_name ||
                                                    stream.user.username
                                                }
                                                className="size-10 rounded-full border-2 border-white/40 shadow-lg md:size-12"
                                            />
                                        ) : (
                                            <div className="flex size-10 items-center justify-center rounded-full border-2 border-white/40 bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 shadow-lg md:size-12">
                                                <span className="text-base font-semibold text-white md:text-lg">
                                                    {(
                                                        stream.user
                                                            .display_name ||
                                                        stream.user.username
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        {stream.status === 'live' && (
                                            <div className="absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-black bg-red-500 shadow-lg md:size-4">
                                                <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75"></span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <p className="text-xs font-semibold text-white drop-shadow-lg md:text-sm">
                                                {stream.user.display_name ||
                                                    stream.user.username}
                                            </p>
                                            {stream.status === 'live' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg md:px-2 md:text-xs">
                                                    <span className="relative flex size-1 md:size-1.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                                        <span className="relative inline-flex size-1 rounded-full bg-white md:size-1.5"></span>
                                                    </span>
                                                    LIVE
                                                </span>
                                            )}
                                        </div>
                                        <p className="hidden text-[10px] text-white/80 drop-shadow-md md:block md:text-xs">
                                            {stream.title}
                                        </p>
                                    </div>
                                </div>

                                {/* Viewer Count */}
                                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-white/95 shadow-lg backdrop-blur-md md:gap-2 md:px-3 md:py-1.5">
                                    <Eye className="size-3 md:size-4" />
                                    <span className="text-xs font-semibold md:text-sm">
                                        {stream.viewer_count.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Chat Overlay - TikTok Style (Bottom 1/3 of screen with fade) */}
                        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 md:hidden">
                            {/* Gradient Fade at Top */}
                            <div className="pointer-events-none absolute top-0 right-0 left-0 h-16 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>

                            {/* Chat Messages Area - Scrollable */}
                            <div className="pointer-events-auto h-[33vh] max-h-[280px] space-y-2 overflow-y-auto px-3 pt-4 pb-2">
                                {chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className="flex animate-in gap-2 duration-300 fade-in slide-in-from-bottom-2"
                                    >
                                        <div
                                            className={`size-5 rounded-full bg-gradient-to-br ${msg.color} flex-shrink-0 shadow-md`}
                                        ></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-white drop-shadow-lg">
                                                <span className="font-semibold">
                                                    {msg.username}
                                                </span>
                                                <span className="text-white/90">
                                                    : {msg.message}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chat Input at Bottom */}
                            {auth?.user && (
                                <div className="pointer-events-auto bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pt-2 pb-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Say something..."
                                            className="flex-1 rounded-full border border-white/20 bg-white/15 px-4 py-2.5 text-sm text-white backdrop-blur-md placeholder:text-white/50 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                                        />
                                        <Button
                                            size="icon"
                                            className="size-10 flex-shrink-0 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 shadow-lg hover:from-amber-600 hover:to-rose-600"
                                        >
                                            <MessageCircle className="size-5 text-white" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side Buttons (Mobile) - Like, Tip, Gift, Share */}
                        <div className="absolute top-1/2 right-0 z-40 flex -translate-y-1/2 flex-col gap-3 p-2 md:hidden">
                            {/* Like Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="flex size-12 flex-col gap-0.5 rounded-full border border-white/10 bg-black/50 shadow-lg backdrop-blur-md hover:bg-black/70"
                                onClick={handleLike}
                            >
                                <Heart className="size-5 fill-current text-white" />
                                <span className="text-[10px] leading-none font-semibold text-white">
                                    {likes > 1000
                                        ? `${(likes / 1000).toFixed(1)}K`
                                        : likes}
                                </span>
                            </Button>

                            {/* Tip Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-12 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 shadow-lg hover:from-amber-600 hover:to-rose-600"
                            >
                                <DollarSign className="size-5 text-white" />
                            </Button>

                            {/* Gift Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-12 rounded-full border border-white/10 bg-black/50 shadow-lg backdrop-blur-md hover:bg-black/70"
                            >
                                <Gift className="size-5 text-white" />
                            </Button>

                            {/* Share */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-12 rounded-full border border-white/10 bg-black/50 shadow-lg backdrop-blur-md hover:bg-black/70"
                            >
                                <Share2 className="size-5 text-white" />
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Action Bar (Desktop) - Stats & Tips Below Video */}
                    <div className="hidden border-t border-white/10 bg-gradient-to-t from-black/90 via-black/70 to-black/50 backdrop-blur-sm md:block">
                        <div className="p-6">
                            {/* Stats Row */}
                            <div className="mb-6 grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <p className="mb-1 text-3xl font-bold text-white">
                                        {likes.toLocaleString()}
                                    </p>
                                    <p className="text-xs font-medium tracking-wider text-white/70 uppercase">
                                        Likes
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="mb-1 text-3xl font-bold text-white">
                                        ${tips.toLocaleString()}
                                    </p>
                                    <p className="text-xs font-medium tracking-wider text-white/70 uppercase">
                                        Tips
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="mb-1 text-3xl font-bold text-white">
                                        {stream.viewer_count.toLocaleString()}
                                    </p>
                                    <p className="text-xs font-medium tracking-wider text-white/70 uppercase">
                                        Viewers
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons & Quick Tips */}
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    {/* Like */}
                                    <Button
                                        variant="ghost"
                                        className="gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 shadow-lg backdrop-blur-md transition-all hover:bg-black/70"
                                        onClick={handleLike}
                                    >
                                        <Heart className="size-5 fill-current text-white" />
                                        <span className="font-semibold text-white">
                                            {likes > 1000
                                                ? `${(likes / 1000).toFixed(1)}K`
                                                : likes}
                                        </span>
                                    </Button>

                                    {/* Tip */}
                                    <Button className="gap-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-5 py-2 shadow-lg transition-all hover:scale-105 hover:from-amber-600 hover:to-rose-600">
                                        <DollarSign className="size-5 text-white" />
                                        <span className="font-semibold text-white">
                                            Tip
                                        </span>
                                    </Button>

                                    {/* Gift */}
                                    <Button
                                        variant="ghost"
                                        className="gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 shadow-lg backdrop-blur-md transition-all hover:bg-black/70"
                                    >
                                        <Gift className="size-5 text-white" />
                                        <span className="font-semibold text-white">
                                            Gift
                                        </span>
                                    </Button>
                                </div>

                                {/* Quick Tip Buttons */}
                                <div className="flex items-center gap-2">
                                    {['$5', '$10', '$25', '$50', '$100'].map(
                                        (amount) => (
                                            <Button
                                                key={amount}
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-all hover:scale-105 hover:border-white/30 hover:bg-white/20"
                                            >
                                                {amount}
                                            </Button>
                                        ),
                                    )}
                                </div>

                                {/* Utility Buttons */}
                                <div className="flex items-center gap-2">
                                    {isHost && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full border border-white/10 bg-black/50 shadow-lg backdrop-blur-md hover:bg-black/70"
                                        >
                                            <Settings className="size-5 text-white" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full border border-white/10 bg-black/50 shadow-lg backdrop-blur-md hover:bg-black/70"
                                    >
                                        <Share2 className="size-5 text-white" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full border border-white/10 bg-black/50 shadow-lg backdrop-blur-md hover:bg-black/70"
                                    >
                                        <Flag className="size-5 text-white" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar - Desktop Only (Fixed Width, Full Height) */}
                <div className="hidden w-80 flex-col border-l border-white/10 bg-black/95 shadow-2xl backdrop-blur-md md:flex lg:w-96">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between border-b border-white/10 bg-black/50 p-4">
                        <h3 className="text-base font-semibold text-white">
                            Chat
                        </h3>
                        {isHost && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full transition-colors hover:bg-white/10"
                            >
                                <Settings className="size-4 text-white" />
                            </Button>
                        )}
                    </div>

                    {/* Chat Messages - Scrollable */}
                    <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
                        {/* Mock Chat Messages */}
                        {chatMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className="flex animate-in gap-2 duration-300 fade-in slide-in-from-bottom-2"
                            >
                                <div
                                    className={`size-6 rounded-full bg-gradient-to-br ${msg.color} flex-shrink-0 shadow-md`}
                                ></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm leading-relaxed text-white/95">
                                        <span className="font-semibold">
                                            {msg.username}
                                        </span>
                                        {msg.isTip ? (
                                            <span className="text-white/80">
                                                :{' '}
                                                <span className="text-amber-400">
                                                    💎
                                                </span>{' '}
                                                {msg.message}
                                            </span>
                                        ) : (
                                            <span className="text-white/70">
                                                : {msg.message}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    {auth?.user && (
                        <div className="border-t border-white/10 bg-black/50 p-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur-sm transition-all placeholder:text-white/50 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                                />
                                <Button
                                    size="icon"
                                    className="size-10 flex-shrink-0 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 shadow-lg transition-all hover:scale-105 hover:from-amber-600 hover:to-rose-600"
                                >
                                    <MessageCircle className="size-5 text-white" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Participants - Desktop */}
                    {stream.participants.length > 0 && (
                        <div className="border-t border-white/10 bg-black/50 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Users className="size-4 text-white/60" />
                                <p className="text-xs font-medium tracking-wider text-white/60 uppercase">
                                    On Stage
                                </p>
                            </div>
                            <div className="space-y-2">
                                {stream.participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/5"
                                    >
                                        {participant.user.avatar_url ? (
                                            <img
                                                src={
                                                    participant.user.avatar_url
                                                }
                                                alt={
                                                    participant.user
                                                        .display_name ||
                                                    participant.user.username
                                                }
                                                className="size-8 rounded-full border border-white/20 shadow-md"
                                            />
                                        ) : (
                                            <div className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 shadow-md">
                                                <span className="text-xs font-semibold text-white">
                                                    {(
                                                        participant.user
                                                            .display_name ||
                                                        participant.user
                                                            .username
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-white">
                                                {participant.user
                                                    .display_name ||
                                                    participant.user.username}
                                            </p>
                                            <p className="text-xs text-white/60 capitalize">
                                                {participant.role.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </div>
    );
}
