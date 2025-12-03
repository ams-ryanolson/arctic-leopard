import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from '@/components/users/user-card';
import { UserListItem } from '@/components/users/user-list-item';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Grid3x3,
    List,
    Search,
    UserCheck2,
    UserPlus,
    Users,
    X,
} from 'lucide-react';

interface User {
    id: number;
    username: string;
    display_name: string;
    pronouns?: string;
    bio?: string;
    avatar_url?: string;
    cover_url?: string;
    is_following: boolean;
}

interface FollowersPageProps {
    user: {
        id: number;
        username: string;
        display_name: string;
        avatar_url?: string;
    };
    activeTab: 'followers' | 'following' | 'mutual';
    counts: {
        followers: number;
        following: number;
        mutual: number;
    };
    followers: User[];
    following: User[];
    mutual: User[];
}

type ViewMode = 'card' | 'list';

export default function Followers({
    user,
    activeTab,
    counts,
    followers,
    following,
    mutual,
}: FollowersPageProps) {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = auth?.user !== null && auth?.user !== undefined;
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [searchQuery, setSearchQuery] = useState('');

    const [followStates, setFollowStates] = useState<
        Record<
            number,
            {
                isFollowing: boolean;
                isPending: boolean;
                isProcessing: boolean;
            }
        >
    >(() => {
        const state: Record<
            number,
            {
                isFollowing: boolean;
                isPending: boolean;
                isProcessing: boolean;
            }
        > = {};

        [...followers, ...following, ...mutual].forEach((u) => {
            state[u.id] = {
                isFollowing: u.is_following ?? false,
                isPending: false,
                isProcessing: false,
            };
        });

        return state;
    });

    const handleTabChange = useCallback(
        (value: string) => {
            router.visit(`/f/${user.username}/${value}`, {
                preserveState: false,
                preserveScroll: false,
            });
        },
        [user.username],
    );

    const getFollowState = useCallback(
        (userId: number) => {
            return (
                followStates[userId] ?? {
                    isFollowing: false,
                    isPending: false,
                    isProcessing: false,
                }
            );
        },
        [followStates],
    );

    const handleFollowChange = useCallback(
        (userId: number, isFollowing: boolean, isPending: boolean) => {
            setFollowStates((prev) => ({
                ...prev,
                [userId]: {
                    isFollowing,
                    isPending,
                    isProcessing: false,
                },
            }));
        },
        [],
    );

    const getCurrentUsers = () => {
        switch (activeTab) {
            case 'followers':
                return followers;
            case 'following':
                return following;
            case 'mutual':
                return mutual;
            default:
                return [];
        }
    };

    const currentUsers = getCurrentUsers();

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return currentUsers;
        }

        const query = searchQuery.toLowerCase().trim();
        return currentUsers.filter((u) => {
            const displayName = (u.display_name || '').toLowerCase();
            const username = (u.username || '').toLowerCase();
            const bio = (u.bio || '').toLowerCase();

            return (
                displayName.includes(query) ||
                username.includes(query) ||
                bio.includes(query)
            );
        });
    }, [currentUsers, searchQuery]);

    const renderUsers = () => {
        if (filteredUsers.length === 0) {
            const getEmptyState = () => {
                if (searchQuery.trim()) {
                    return {
                        icon: Search,
                        title: 'No results found',
                        description: `We couldn't find any users matching "${searchQuery}".`,
                    };
                }

                if (activeTab === 'followers') {
                    return {
                        icon: Users,
                        title: 'No followers yet',
                        description:
                            "When people follow this profile, they'll show up here.",
                    };
                }

                if (activeTab === 'following') {
                    return {
                        icon: UserPlus,
                        title: 'Not following anyone',
                        description:
                            'Accounts this person follows will appear here.',
                    };
                }

                return {
                    icon: UserCheck2,
                    title: 'No mutual followers',
                    description:
                        "When you both follow the same accounts, they'll appear here.",
                };
            };

            const emptyState = getEmptyState();
            const Icon = emptyState.icon;

            return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white/5">
                        <Icon className="size-7 text-white/30" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-white/90">
                        {emptyState.title}
                    </h3>
                    <p className="max-w-sm text-sm leading-relaxed text-white/50">
                        {emptyState.description}
                    </p>
                </div>
            );
        }

        if (viewMode === 'card') {
            return (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredUsers.map((userItem) => {
                        const state = getFollowState(userItem.id);

                        return (
                            <UserCard
                                key={userItem.id}
                                user={{
                                    id: userItem.id,
                                    username: userItem.username,
                                    display_name: userItem.display_name,
                                    pronouns: userItem.pronouns,
                                    bio: userItem.bio,
                                    avatar_url: userItem.avatar_url,
                                    cover_url: userItem.cover_url,
                                }}
                                showFollowButton={true}
                                initialFollowing={state.isFollowing}
                                initialPending={state.isPending}
                                onFollowChange={(isFollowing, isPending) => {
                                    handleFollowChange(
                                        userItem.id,
                                        isFollowing,
                                        isPending,
                                    );
                                }}
                            />
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="space-y-0 divide-y divide-white/5">
                {filteredUsers.map((userItem) => {
                    const state = getFollowState(userItem.id);

                    return (
                        <UserListItem
                            key={userItem.id}
                            user={{
                                id: userItem.id,
                                username: userItem.username,
                                display_name: userItem.display_name,
                                pronouns: userItem.pronouns,
                                bio: userItem.bio,
                                avatar_url: userItem.avatar_url,
                            }}
                            showFollowButton={true}
                            initialFollowing={state.isFollowing}
                            initialPending={state.isPending}
                            onFollowChange={(isFollowing, isPending) => {
                                handleFollowChange(
                                    userItem.id,
                                    isFollowing,
                                    isPending,
                                );
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="mx-auto max-w-5xl">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl">
                    <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-4">
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="size-9 shrink-0 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                            >
                                <Link href={`/p/${user.username}`}>
                                    <ArrowLeft className="size-5" />
                                </Link>
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-xl font-bold text-white">
                                    {user.display_name}
                                </h1>
                                <p className="text-sm text-white/50">
                                    @{user.username}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList
                            className={`flex h-auto w-full gap-0 border-0 bg-transparent p-0 ${isAuthenticated ? '' : ''}`}
                        >
                            <TabsTrigger
                                value="followers"
                                className="group relative flex flex-1 flex-col items-center gap-1 border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/80 data-[state=active]:border-white data-[state=active]:text-white sm:flex-row sm:justify-center sm:gap-2"
                            >
                                <span className="text-sm sm:text-base">
                                    Followers
                                </span>
                                <span className="text-xs text-white/40 group-data-[state=active]:text-white/70 sm:text-sm">
                                    {counts.followers.toLocaleString()}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="following"
                                className="group relative flex flex-1 flex-col items-center gap-1 border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/80 data-[state=active]:border-white data-[state=active]:text-white sm:flex-row sm:justify-center sm:gap-2"
                            >
                                <span className="text-sm sm:text-base">
                                    Following
                                </span>
                                <span className="text-xs text-white/40 group-data-[state=active]:text-white/70 sm:text-sm">
                                    {counts.following.toLocaleString()}
                                </span>
                            </TabsTrigger>
                            {isAuthenticated && (
                                <TabsTrigger
                                    value="mutual"
                                    className="group relative flex flex-1 flex-col items-center gap-1 border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/80 data-[state=active]:border-white data-[state=active]:text-white sm:flex-row sm:justify-center sm:gap-2"
                                >
                                    <span className="text-sm sm:text-base">
                                        Mutual
                                    </span>
                                    <span className="text-xs text-white/40 group-data-[state=active]:text-white/70 sm:text-sm">
                                        {counts.mutual.toLocaleString()}
                                    </span>
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Content */}
                <div className="px-4 py-4 sm:px-6">
                    {/* Search and View Controls */}
                    <div className="mb-4 flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
                            <Input
                                type="search"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 rounded-full border-white/10 bg-white/5 pr-9 pl-9 text-sm text-white placeholder:text-white/40 focus-visible:border-white/20 focus-visible:ring-0"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-1/2 right-1 size-8 -translate-y-1/2 rounded-full text-white/40 hover:bg-white/10 hover:text-white/70"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('card')}
                                className={`size-8 rounded-full transition-colors ${
                                    viewMode === 'card'
                                        ? 'bg-white text-black hover:bg-white hover:text-black'
                                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Grid3x3 className="size-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('list')}
                                className={`size-8 rounded-full transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-white text-black hover:bg-white hover:text-black'
                                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <List className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {/* User Lists */}
                    <Tabs value={activeTab}>
                        <TabsContent value="followers" className="mt-0">
                            {renderUsers()}
                        </TabsContent>

                        <TabsContent value="following" className="mt-0">
                            {renderUsers()}
                        </TabsContent>

                        <TabsContent value="mutual" className="mt-0">
                            {renderUsers()}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
