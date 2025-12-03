import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/react';
import { Radio, Eye, Heart, DollarSign, Gift, Users, Settings, Share2, Flag, MessageCircle, ChevronDown } from 'lucide-react';
import { type SharedData } from '@/types';
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

export default function Show({ stream, canModerate, isHost }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const [likes, setLikes] = useState(1234);
    const [tips, setTips] = useState(0);
    const [showChatMobile, setShowChatMobile] = useState(true);

    const handleLike = () => {
        setLikes(prev => prev + 1);
    };

    // Mock chat messages with animations
    const chatMessages = [
        { id: 1, username: 'User123', message: 'Hey everyone!', color: 'from-blue-400 to-purple-500' },
        { id: 2, username: 'Fan456', message: 'This stream is amazing 🔥', color: 'from-green-400 to-blue-500' },
        { id: 3, username: 'BigSpender', message: '💎 sent a tip!', color: 'from-amber-400 to-orange-500', isTip: true },
        { id: 4, username: 'Viewer789', message: 'Can\'t wait for the next part!', color: 'from-pink-400 to-rose-500' },
        { id: 5, username: 'StreamFan', message: 'Love this content!', color: 'from-cyan-400 to-blue-500' },
        { id: 6, username: 'Supporter', message: 'Keep it up!', color: 'from-violet-400 to-purple-500' },
    ];

    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
            {/* Main Content Area - No Scroll */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Video Area - Full screen on mobile, flex-1 on desktop */}
                <div className="flex-1 relative bg-gradient-to-br from-rose-500/20 to-violet-600/20 flex flex-col">
                    {/* Video Player Area */}
                    <div className="flex-1 relative">
                        {/* Video Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Radio className="size-32 text-white/20" />
                        </div>

                        {/* Top Overlay - Stream Info */}
                        <div className="absolute top-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-b from-black/70 via-black/40 to-transparent z-20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-3">
                                    {/* Host Avatar */}
                                    <div className="relative">
                                        {stream.user.avatar_url ? (
                                            <img
                                                src={stream.user.avatar_url}
                                                alt={stream.user.display_name || stream.user.username}
                                                className="size-10 md:size-12 rounded-full border-2 border-white/40 shadow-lg"
                                            />
                                        ) : (
                                            <div className="size-10 md:size-12 rounded-full bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 flex items-center justify-center border-2 border-white/40 shadow-lg">
                                                <span className="text-base md:text-lg font-semibold text-white">
                                                    {(stream.user.display_name || stream.user.username)
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        {stream.status === 'live' && (
                                            <div className="absolute -bottom-1 -right-1 size-3 md:size-4 rounded-full bg-red-500 border-2 border-black shadow-lg">
                                                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <p className="text-white font-semibold text-xs md:text-sm drop-shadow-lg">
                                                {stream.user.display_name || stream.user.username}
                                            </p>
                                            {stream.status === 'live' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-semibold text-white shadow-lg">
                                                    <span className="relative flex size-1 md:size-1.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                                        <span className="relative inline-flex size-1 md:size-1.5 rounded-full bg-white"></span>
                                                    </span>
                                                    LIVE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-white/80 text-[10px] md:text-xs drop-shadow-md hidden md:block">{stream.title}</p>
                                    </div>
                                </div>

                                {/* Viewer Count */}
                                <div className="flex items-center gap-1.5 md:gap-2 text-white/95 bg-black/50 rounded-full px-2.5 md:px-3 py-1 md:py-1.5 backdrop-blur-md shadow-lg border border-white/10">
                                    <Eye className="size-3 md:size-4" />
                                    <span className="text-xs md:text-sm font-semibold">
                                        {stream.viewer_count.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Chat Overlay - TikTok Style (Bottom 1/3 of screen with fade) */}
                        <div className="md:hidden absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
                            {/* Gradient Fade at Top */}
                            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none"></div>
                            
                            {/* Chat Messages Area - Scrollable */}
                            <div className="h-[33vh] max-h-[280px] overflow-y-auto px-3 pb-2 pt-4 space-y-2 pointer-events-auto">
                                {chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                                    >
                                        <div className={`size-5 rounded-full bg-gradient-to-br ${msg.color} flex-shrink-0 shadow-md`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs drop-shadow-lg">
                                                <span className="font-semibold">{msg.username}</span>
                                                <span className="text-white/90">: {msg.message}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chat Input at Bottom */}
                            {auth?.user && (
                                <div className="px-3 pb-3 pt-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent pointer-events-auto">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Say something..."
                                            className="flex-1 px-4 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
                                        />
                                        <Button
                                            size="icon"
                                            className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 size-10 flex-shrink-0 shadow-lg"
                                        >
                                            <MessageCircle className="size-5 text-white" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side Buttons (Mobile) - Like, Tip, Gift, Share */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 p-2 md:hidden z-40">
                            {/* Like Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 size-12 flex flex-col gap-0.5 shadow-lg border border-white/10"
                                onClick={handleLike}
                            >
                                <Heart className="size-5 text-white fill-current" />
                                <span className="text-[10px] text-white font-semibold leading-none">
                                    {likes > 1000 ? `${(likes / 1000).toFixed(1)}K` : likes}
                                </span>
                            </Button>

                            {/* Tip Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 size-12 shadow-lg"
                            >
                                <DollarSign className="size-5 text-white" />
                            </Button>

                            {/* Gift Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 size-12 shadow-lg border border-white/10"
                            >
                                <Gift className="size-5 text-white" />
                            </Button>

                            {/* Share */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 size-12 shadow-lg border border-white/10"
                            >
                                <Share2 className="size-5 text-white" />
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Action Bar (Desktop) - Stats & Tips Below Video */}
                    <div className="hidden md:block border-t border-white/10 bg-gradient-to-t from-black/90 via-black/70 to-black/50 backdrop-blur-sm">
                        <div className="p-6">
                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-6 mb-6">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-white mb-1">{likes.toLocaleString()}</p>
                                    <p className="text-xs text-white/70 uppercase tracking-wider font-medium">Likes</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-white mb-1">${tips.toLocaleString()}</p>
                                    <p className="text-xs text-white/70 uppercase tracking-wider font-medium">Tips</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-white mb-1">{stream.viewer_count.toLocaleString()}</p>
                                    <p className="text-xs text-white/70 uppercase tracking-wider font-medium">Viewers</p>
                                </div>
                            </div>

                            {/* Action Buttons & Quick Tips */}
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    {/* Like */}
                                    <Button
                                        variant="ghost"
                                        className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 gap-2 px-4 py-2 border border-white/10 shadow-lg transition-all"
                                        onClick={handleLike}
                                    >
                                        <Heart className="size-5 text-white fill-current" />
                                        <span className="text-white font-semibold">
                                            {likes > 1000 ? `${(likes / 1000).toFixed(1)}K` : likes}
                                        </span>
                                    </Button>

                                    {/* Tip */}
                                    <Button className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 gap-2 px-5 py-2 shadow-lg transition-all hover:scale-105">
                                        <DollarSign className="size-5 text-white" />
                                        <span className="text-white font-semibold">Tip</span>
                                    </Button>

                                    {/* Gift */}
                                    <Button
                                        variant="ghost"
                                        className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 gap-2 px-4 py-2 border border-white/10 shadow-lg transition-all"
                                    >
                                        <Gift className="size-5 text-white" />
                                        <span className="text-white font-semibold">Gift</span>
                                    </Button>
                                </div>

                                {/* Quick Tip Buttons */}
                                <div className="flex items-center gap-2">
                                    {['$5', '$10', '$25', '$50', '$100'].map((amount) => (
                                        <Button
                                            key={amount}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/30 text-white text-xs font-medium px-3 py-1.5 transition-all hover:scale-105"
                                        >
                                            {amount}
                                        </Button>
                                    ))}
                                </div>

                                {/* Utility Buttons */}
                                <div className="flex items-center gap-2">
                                    {isHost && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10 shadow-lg"
                                        >
                                            <Settings className="size-5 text-white" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10 shadow-lg"
                                    >
                                        <Share2 className="size-5 text-white" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10 shadow-lg"
                                    >
                                        <Flag className="size-5 text-white" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar - Desktop Only (Fixed Width, Full Height) */}
                <div className="hidden md:flex w-80 lg:w-96 bg-black/95 backdrop-blur-md border-l border-white/10 flex-col shadow-2xl">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                        <h3 className="text-white font-semibold text-base">Chat</h3>
                        {isHost && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <Settings className="size-4 text-white" />
                            </Button>
                        )}
                    </div>

                    {/* Chat Messages - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {/* Mock Chat Messages */}
                        {chatMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                            >
                                <div className={`size-6 rounded-full bg-gradient-to-br ${msg.color} flex-shrink-0 shadow-md`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/95 text-sm leading-relaxed">
                                        <span className="font-semibold">{msg.username}</span>
                                        {msg.isTip ? (
                                            <span className="text-white/80">: <span className="text-amber-400">💎</span> {msg.message}</span>
                                        ) : (
                                            <span className="text-white/70">: {msg.message}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    {auth?.user && (
                        <div className="p-4 border-t border-white/10 bg-black/50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm transition-all"
                                />
                                <Button
                                    size="icon"
                                    className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 size-10 flex-shrink-0 shadow-lg transition-all hover:scale-105"
                                >
                                    <MessageCircle className="size-5 text-white" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Participants - Desktop */}
                    {stream.participants.length > 0 && (
                        <div className="p-4 border-t border-white/10 bg-black/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="size-4 text-white/60" />
                                <p className="text-xs text-white/60 uppercase tracking-wider font-medium">On Stage</p>
                            </div>
                            <div className="space-y-2">
                                {stream.participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-1.5 transition-colors"
                                    >
                                        {participant.user.avatar_url ? (
                                            <img
                                                src={participant.user.avatar_url}
                                                alt={participant.user.display_name || participant.user.username}
                                                className="size-8 rounded-full border border-white/20 shadow-md"
                                            />
                                        ) : (
                                            <div className="size-8 rounded-full bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 flex items-center justify-center border border-white/20 shadow-md">
                                                <span className="text-xs font-semibold text-white">
                                                    {(participant.user.display_name || participant.user.username)
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">
                                                {participant.user.display_name || participant.user.username}
                                            </p>
                                            <p className="text-white/60 text-xs capitalize">
                                                {participant.role.replace('_', ' ')}
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
