import { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SubscribeDialog, TipDialog } from '@/pages/Profile/dialogs';
import CoverGradient from '@/components/cover-gradient';
import { useInitials } from '@/hooks/use-initials';
import { Head, Link, router } from '@inertiajs/react';
import {
    Gift,
    TrendingUp,
    Users,
    CheckCircle2,
    Clock,
    Sparkles,
    Filter,
    ArrowUpDown,
    Search,
    ExternalLink,
    Heart,
    Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type WishlistItem = {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    amount: number | null;
    currency: string | null;
    url: string | null;
    image_url: string | null;
    quantity: number | null;
    is_crowdfunded: boolean;
    goal_amount: number | null;
    current_funding: number;
    status: string;
    progress_percentage: number;
    remaining_quantity: number | null;
    expires_at: string | null;
    is_active: boolean;
    can_be_purchased: boolean;
    purchase_count: number;
    created_at: string;
    creator: {
        id: number;
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
};

interface ProfileWishlistProps {
    profile: {
        display_name: string;
        handle: string;
        cover_image: string | null;
        avatar_url: string | null;
    };
    items: {
        data: WishlistItem[];
    };
    stats: {
        total_items: number;
        total_raised: number;
        total_contributors: number;
        fulfilled_items: number;
    };
}

function formatCurrency(cents: number | null, currency: string | null = 'USD'): string {
    if (cents === null) {
        return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency ?? 'USD',
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

type FilterType = 'all' | 'active' | 'crowdfunded' | 'fixed' | 'expiring';
type SortType = 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'progress_high' | 'progress_low';

export default function ProfileWishlist({ profile, items, stats }: ProfileWishlistProps) {
    const { display_name: displayName, handle, cover_image: coverImage, avatar_url: avatarUrl } = profile;
    const itemsList = items.data || [];

    const [filter, setFilter] = useState<FilterType>('all');
    const [sort, setSort] = useState<SortType>('newest');
    const [searchQuery, setSearchQuery] = useState('');

    const getInitials = useInitials();
    const initials = getInitials(displayName);
    const username = handle.replace('@', '');

    // Filter and sort items
    const filteredAndSortedItems = useMemo(() => {
        let filtered = itemsList;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(query) ||
                    item.description?.toLowerCase().includes(query),
            );
        }

        // Apply type filter
        switch (filter) {
            case 'crowdfunded':
                filtered = filtered.filter((item) => item.is_crowdfunded);
                break;
            case 'fixed':
                filtered = filtered.filter((item) => !item.is_crowdfunded);
                break;
            case 'expiring':
                filtered = filtered.filter(
                    (item) => item.expires_at && new Date(item.expires_at) > new Date(),
                );
                break;
            case 'active':
            default:
                // All items are active by default
                break;
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            switch (sort) {
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'amount_high':
                    return (b.amount ?? b.goal_amount ?? 0) - (a.amount ?? a.goal_amount ?? 0);
                case 'amount_low':
                    return (a.amount ?? a.goal_amount ?? 0) - (b.amount ?? b.goal_amount ?? 0);
                case 'progress_high':
                    return (b.progress_percentage ?? 0) - (a.progress_percentage ?? 0);
                case 'progress_low':
                    return (a.progress_percentage ?? 0) - (b.progress_percentage ?? 0);
                case 'newest':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        return sorted;
    }, [itemsList, filter, sort, searchQuery]);

    // Check if item is expiring soon (within 7 days)
    const isExpiringSoon = (expiresAt: string | null): boolean => {
        if (!expiresAt) return false;
        const expiry = new Date(expiresAt);
        const now = new Date();
        const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    };

    // Get days until expiry
    const getDaysUntilExpiry = (expiresAt: string | null): number | null => {
        if (!expiresAt) return null;
        const expiry = new Date(expiresAt);
        const now = new Date();
        const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days > 0 ? days : null;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Profiles', href: '/p' },
                { title: displayName, href: `/p/${username}` },
                { title: 'Wishlist', href: `/w/${username}` },
            ]}
        >
            <Head title={`${displayName} · Wishlist`} />

            <div className="space-y-8">
                {/* Hero Section */}
                <section className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_45px_85px_-45px_rgba(249,115,22,0.55)] transition-all duration-500 hover:shadow-[0_60px_100px_-50px_rgba(249,115,22,0.65)]">
                    <div className="relative h-40 w-full overflow-hidden sm:h-48">
                        {coverImage ? (
                            <div
                                className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url(${coverImage})` }}
                            />
                        ) : (
                            <CoverGradient className="h-full w-full" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                    <div className="p-6 sm:p-8">
                        <div className="-mt-14 flex flex-col gap-6 sm:flex-row sm:items-end">
                            <div className="flex items-end gap-4">
                                <div className="relative -mt-2 h-28 w-28 overflow-hidden rounded-3xl border-4 border-neutral-950 shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)] transition-transform duration-300 group-hover:scale-105">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={displayName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-2xl font-semibold text-white">
                                            {initials || 'RK'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 text-white">
                                    <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                                        Wishlist • {displayName}
                                    </h1>
                                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                                        {handle}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col gap-3 text-white sm:items-end">
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="rounded-full text-white/80 transition-all hover:bg-white/10 hover:text-white hover:scale-105"
                                    >
                                        <Link href={`/p/${username}`}>Full profile</Link>
                                    </Button>
                                </div>
                                <p className="text-xs text-white/60">
                                    Gift gear, travel, and upgrades that fuel the next scene.
                                </p>
                            </div>
                        </div>

                        <Separator className="my-6 border-white/10" />
                        <p className="max-w-3xl text-sm leading-relaxed text-white/70">
                            Every wishlist item unlocks bigger, bolder experiences. Gift equipment, production
                            upgrades, or travel boosts and get shouted out during the next drop.
                        </p>
                    </div>
                </section>

                {/* Stats Summary */}
                {stats.total_items > 0 && (
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="group relative overflow-hidden border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.35)]">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <CardContent className="relative p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                            Total Items
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {stats.total_items}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-amber-400/10 p-3">
                                        <Gift className="size-6 text-amber-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group relative overflow-hidden border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.35)]">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <CardContent className="relative p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                            Total Raised
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {formatCurrency(stats.total_raised)}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-emerald-400/10 p-3">
                                        <TrendingUp className="size-6 text-emerald-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group relative overflow-hidden border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.35)]">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-400/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <CardContent className="relative p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                            Contributors
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {stats.total_contributors}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-sky-400/10 p-3">
                                        <Users className="size-6 text-sky-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group relative overflow-hidden border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.35)]">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <CardContent className="relative p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                            Fulfilled
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {stats.fulfilled_items}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-violet-400/10 p-3">
                                        <CheckCircle2 className="size-6 text-violet-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Filters and Search */}
                {itemsList.length > 0 && (
                    <section className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                                <Input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-full border-white/20 bg-black/40 pl-10 pr-4 text-white placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-amber-500/20"
                                />
                            </div>
                        </div>
                        <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                            <SelectTrigger className="w-[180px] rounded-full border-white/20 bg-black/40 text-white">
                                <Filter className="mr-2 size-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-black/90 text-white">
                                <SelectItem value="all">All Items</SelectItem>
                                <SelectItem value="crowdfunded">Crowdfunded</SelectItem>
                                <SelectItem value="fixed">Fixed Price</SelectItem>
                                <SelectItem value="expiring">Expiring Soon</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sort} onValueChange={(value) => setSort(value as SortType)}>
                            <SelectTrigger className="w-[180px] rounded-full border-white/20 bg-black/40 text-white">
                                <ArrowUpDown className="mr-2 size-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-black/90 text-white">
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="amount_high">Price: High to Low</SelectItem>
                                <SelectItem value="amount_low">Price: Low to High</SelectItem>
                                <SelectItem value="progress_high">Progress: High to Low</SelectItem>
                                <SelectItem value="progress_low">Progress: Low to High</SelectItem>
                            </SelectContent>
                        </Select>
                    </section>
                )}

                {/* Items Grid */}
                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-white">
                        <div>
                            <h2 className="text-xl font-semibold">Wishlisted items</h2>
                            <p className="text-sm text-white/60">
                                {filteredAndSortedItems.length === itemsList.length
                                    ? 'Hand-picked gear and experiences that amplify every ritual.'
                                    : `Showing ${filteredAndSortedItems.length} of ${itemsList.length} items`}
                            </p>
                        </div>
                        <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                            {filteredAndSortedItems.length}{' '}
                            {filteredAndSortedItems.length === 1 ? 'item' : 'items'}
                        </Badge>
                    </div>

                    {filteredAndSortedItems.length === 0 ? (
                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 rounded-full bg-white/5 p-6">
                                    <Gift className="size-12 text-white/40" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-white">
                                    {searchQuery || filter !== 'all'
                                        ? 'No items match your filters'
                                        : 'No wishlist items yet'}
                                </h3>
                                <p className="max-w-md text-sm text-white/60">
                                    {searchQuery || filter !== 'all'
                                        ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                        : 'Check back soon for exciting gear, travel, and upgrades that fuel the next scene.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredAndSortedItems.map((item) => {
                                const daysUntilExpiry = getDaysUntilExpiry(item.expires_at);
                                const expiringSoon = isExpiringSoon(item.expires_at);
                                const isAlmostFunded =
                                    item.is_crowdfunded &&
                                    item.progress_percentage >= 75 &&
                                    item.progress_percentage < 100;
                                const displayPrice = item.is_crowdfunded
                                    ? item.goal_amount
                                    : item.amount;

                                return (
                                    <Card
                                        key={item.id}
                                        className="group relative flex h-full flex-col overflow-hidden border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_35px_90px_-60px_rgba(249,115,22,0.65)] hover:-translate-y-1"
                                    >
                                        {/* Priority Badges */}
                                        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                                            {isAlmostFunded && (
                                                <Badge className="rounded-full border-emerald-400/40 bg-emerald-400/10 text-[0.65rem] uppercase tracking-[0.3em] text-emerald-200 shadow-[0_16px_45px_-25px_rgba(16,185,129,0.45)]">
                                                    Almost Funded
                                                </Badge>
                                            )}
                                            {expiringSoon && daysUntilExpiry && (
                                                <Badge className="rounded-full border-amber-400/40 bg-amber-400/10 text-[0.65rem] uppercase tracking-[0.3em] text-amber-200 shadow-[0_16px_45px_-25px_rgba(249,115,22,0.45)]">
                                                    <Clock className="mr-1 size-3" />
                                                    {daysUntilExpiry}d left
                                                </Badge>
                                            )}
                                            {item.purchase_count > 0 && (
                                                <Badge className="rounded-full border-white/25 bg-white/15 text-[0.65rem] uppercase tracking-[0.3em] text-white/80">
                                                    <Sparkles className="mr-1 size-3" />
                                                    {item.purchase_count}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Image */}
                                        <div className="group/image relative h-56 w-full overflow-hidden transition-all duration-500 group-hover:scale-[1.02]">
                                            {item.image_url ? (
                                                <>
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.title}
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-110"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                                </>
                                            ) : (
                                                <>
                                                    <CoverGradient className="h-full w-full" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                                                </>
                                            )}
                                            
                                            {/* Remaining Items Badge - Top Left */}
                                            {!item.is_crowdfunded && item.remaining_quantity !== null && (
                                                <div className="absolute left-3 top-3 z-10">
                                                    <div className="rounded-xl border border-white/20 bg-black/70 backdrop-blur-sm px-3 py-1.5 shadow-lg">
                                                        <p className="text-xs font-medium text-white/90">
                                                            {item.remaining_quantity}{' '}
                                                            {item.remaining_quantity === 1 ? 'left' : 'left'}
                                                        </p>
                                                        {item.remaining_quantity <= 5 && (
                                                            <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-amber-300">
                                                                Low Stock
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Price Overlay - Prominent */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <div className="flex items-end justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-white/60">
                                                            {item.is_crowdfunded ? 'Goal' : 'Price'}
                                                        </p>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                                                {formatCurrency(displayPrice, item.currency)}
                                                            </span>
                                                            {item.is_crowdfunded && (
                                                                <span className="mb-1 text-sm font-medium text-white/70">
                                                                    goal
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {item.is_crowdfunded && item.progress_percentage > 0 && (
                                                        <div className="text-right">
                                                            <p className="text-2xl font-bold text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                                                {Math.round(item.progress_percentage)}%
                                                            </p>
                                                            <p className="text-xs text-white/60">funded</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <CardHeader className="gap-2 pb-3">
                                            <CardTitle className="pr-16 text-xl font-semibold leading-tight transition-colors group-hover:text-amber-400">
                                                {item.title}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 text-sm text-white/70">
                                                {item.description || 'Supports the next wave of immersive scenes.'}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            {/* Progress Bar for Crowdfunded */}
                                            {item.is_crowdfunded && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-white/60">
                                                        <span>Progress</span>
                                                        <span className="font-medium text-white/80">
                                                            {formatCurrency(item.current_funding, item.currency)} raised
                                                        </span>
                                                    </div>
                                                    <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 transition-all duration-1000 ease-out"
                                                            style={{
                                                                width: `${Math.min(item.progress_percentage, 100)}%`,
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="mt-auto flex flex-col gap-3 pt-0">
                                            <div className="flex w-full flex-col gap-2">
                                                {item.can_be_purchased ? (
                                                    <Button
                                                        onClick={() => router.visit(`/wishlist/${item.id}/checkout`)}
                                                        className="group/btn w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 py-6 text-base font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] transition-all duration-300 hover:scale-105 hover:shadow-[0_24px_50px_-15px_rgba(249,115,22,0.55)]"
                                                    >
                                                        <Gift className="mr-2 size-5 transition-transform group-hover/btn:scale-110" />
                                                        {item.is_crowdfunded ? 'Contribute Now' : 'Purchase Now'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        className="w-full rounded-full bg-white/10 py-6 text-base font-semibold text-white/50"
                                                    >
                                                        {item.status === 'fulfilled'
                                                            ? 'Fulfilled'
                                                            : item.status === 'funded'
                                                              ? 'Funded'
                                                              : 'Unavailable'}
                                                    </Button>
                                                )}
                                                {item.url && (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        className="w-full rounded-full border-white/20 bg-white/5 text-sm text-white transition-all hover:border-white/40 hover:bg-white/10 hover:scale-105"
                                                    >
                                                        <Link
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="mr-2 size-4" />
                                                            View Product Details
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* Add shimmer animation */}
            <style>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </AppLayout>
    );
}
