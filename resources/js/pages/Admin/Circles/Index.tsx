import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import adminCirclesRoutes from '@/routes/admin/circles';
import { type Paginated } from '@/types/feed';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertCircle,
    ArrowRight,
    Eye,
    EyeOff,
    FileText,
    Star,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';

type Circle = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    visibility: string;
    is_featured: boolean;
    members_count: number;
    posts_count: number;
    created_at: string | null;
    interest: {
        id: number;
        name: string;
        slug: string;
    } | null;
};

type MostActiveCircle = {
    id: number;
    name: string;
    slug: string;
    members_count: number;
    posts_count: number;
};

type PendingSuggestion = {
    id: number;
    name: string;
    description: string | null;
    created_at: string | null;
    user: {
        id: number;
        name: string;
        username: string | null;
    } | null;
};

type AdminCirclesIndexProps = {
    circles:
        | Paginated<Circle>
        | {
              data: Circle[];
              current_page: number;
              last_page: number;
              per_page: number;
              total: number;
              from?: number | null;
              to?: number | null;
          };
    stats: {
        total_circles: number;
        total_members: number;
        total_posts: number;
        pending_suggestions: number;
    };
    most_active_circles: MostActiveCircle[];
    pending_suggestions_count: number;
    pending_suggestions: PendingSuggestion[];
};

export default function AdminCirclesIndex({
    circles,
    stats,
    most_active_circles,
    pending_suggestions_count,
    pending_suggestions,
}: AdminCirclesIndexProps) {
    const paginationMeta = useMemo(() => {
        // Handle both Paginated<T> structure and direct paginator structure
        const currentPage =
            'meta' in circles && circles.meta
                ? circles.meta.current_page
                : (circles as any).current_page;
        const lastPage =
            'meta' in circles && circles.meta
                ? circles.meta.last_page
                : (circles as any).last_page;
        const perPage =
            'meta' in circles && circles.meta
                ? circles.meta.per_page
                : (circles as any).per_page;
        const total =
            'meta' in circles && circles.meta
                ? circles.meta.total
                : (circles as any).total;

        return {
            currentPage,
            perPage,
            total,
            lastPage,
            hasMorePages: currentPage < lastPage,
        };
    }, [circles]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Circles', href: adminCirclesRoutes.index().url },
            ]}
        >
            <Head title="Circles Dashboard · Admin" />

            <div className="space-y-6 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Circles Dashboard
                        </h1>
                        <p className="mt-2 text-sm text-white/65">
                            Manage all circles and review suggestions
                        </p>
                    </div>
                    {pending_suggestions_count > 0 && (
                        <Link
                            href={adminCirclesRoutes.index().url}
                            className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:border-amber-400/60 hover:bg-amber-500/30"
                        >
                            <AlertCircle className="size-4" />
                            {pending_suggestions_count} Pending Suggestion
                            {pending_suggestions_count !== 1 ? 's' : ''}
                        </Link>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-white/10 bg-black/40 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/65">
                                        Total Circles
                                    </p>
                                    <p className="mt-1 text-3xl font-semibold">
                                        {stats.total_circles}
                                    </p>
                                </div>
                                <div className="rounded-full bg-amber-400/20 p-3">
                                    <Star className="size-6 text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-black/40 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/65">
                                        Total Members
                                    </p>
                                    <p className="mt-1 text-3xl font-semibold">
                                        {stats.total_members}
                                    </p>
                                </div>
                                <div className="rounded-full bg-emerald-400/20 p-3">
                                    <Users className="size-6 text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-black/40 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/65">
                                        Total Posts
                                    </p>
                                    <p className="mt-1 text-3xl font-semibold">
                                        {stats.total_posts}
                                    </p>
                                </div>
                                <div className="rounded-full bg-violet-400/20 p-3">
                                    <FileText className="size-6 text-violet-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-black/40 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/65">
                                        Pending Suggestions
                                    </p>
                                    <p className="mt-1 text-3xl font-semibold">
                                        {stats.pending_suggestions}
                                    </p>
                                </div>
                                <div className="rounded-full bg-rose-400/20 p-3">
                                    <AlertCircle className="size-6 text-rose-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Suggestions */}
                {pending_suggestions.length > 0 && (
                    <Card className="border-amber-400/20 bg-amber-500/10 text-white">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="size-5 text-amber-400" />
                                    <CardTitle>Pending Suggestions</CardTitle>
                                </div>
                                {pending_suggestions_count >
                                    pending_suggestions.length && (
                                    <p className="text-sm text-white/55">
                                        {pending_suggestions_count -
                                            pending_suggestions.length}{' '}
                                        more
                                    </p>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {pending_suggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <h3 className="font-medium">
                                                {suggestion.name}
                                            </h3>
                                            {suggestion.description && (
                                                <p className="line-clamp-2 text-sm text-white/70">
                                                    {suggestion.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-white/55">
                                                {suggestion.user && (
                                                    <span>
                                                        Suggested by{' '}
                                                        <span className="font-medium text-white/75">
                                                            {
                                                                suggestion.user
                                                                    .name
                                                            }
                                                            {suggestion.user
                                                                .username &&
                                                                ` (@${suggestion.user.username})`}
                                                        </span>
                                                    </span>
                                                )}
                                                {suggestion.created_at && (
                                                    <span>
                                                        {formatDistanceToNow(
                                                            new Date(
                                                                suggestion.created_at,
                                                            ),
                                                            {
                                                                addSuffix: true,
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Link
                                            href={
                                                adminCirclesRoutes.suggestions.review(
                                                    suggestion.id,
                                                ).url
                                            }
                                            className="shrink-0 rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-xs font-medium text-amber-100 transition-colors hover:border-amber-400/60 hover:bg-amber-500/30"
                                        >
                                            Review
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Most Active Circles */}
                {most_active_circles.length > 0 && (
                    <Card className="border-white/10 bg-black/40 text-white">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-5 text-amber-400" />
                                <CardTitle>Most Active Circles</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {most_active_circles.map((circle) => (
                                    <Link
                                        key={circle.id}
                                        href={`/circles/${circle.slug}`}
                                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4 transition-colors hover:border-white/20 hover:bg-black/40"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {circle.name}
                                            </p>
                                            <div className="mt-1 flex items-center gap-4 text-xs text-white/55">
                                                <span className="flex items-center gap-1">
                                                    <Users className="size-3" />
                                                    {circle.members_count}{' '}
                                                    members
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="size-3" />
                                                    {circle.posts_count} posts
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight className="size-4 text-white/40" />
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* All Circles */}
                <Card className="border-white/10 bg-black/40 text-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>All Circles</CardTitle>
                            <p className="text-sm text-white/55">
                                Page {paginationMeta.currentPage} of{' '}
                                {paginationMeta.lastPage} ·{' '}
                                {paginationMeta.total} total
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {circles.data.length > 0 ? (
                            <div className="space-y-3">
                                {circles.data.map((circle) => (
                                    <div
                                        key={circle.id}
                                        className="rounded-2xl border border-white/10 bg-black/30 p-5 transition-colors hover:border-white/20 hover:bg-black/40"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-semibold">
                                                        {circle.name}
                                                    </h3>
                                                    {circle.is_featured && (
                                                        <Badge className="border-amber-400/40 bg-amber-500/20 text-amber-100">
                                                            Featured
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        className={
                                                            circle.visibility ===
                                                            'public'
                                                                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
                                                                : circle.visibility ===
                                                                    'listed'
                                                                  ? 'border-amber-400/40 bg-amber-500/20 text-amber-100'
                                                                  : 'border-rose-400/40 bg-rose-500/20 text-rose-100'
                                                        }
                                                    >
                                                        {circle.visibility ===
                                                        'public' ? (
                                                            <Eye className="mr-1 size-3" />
                                                        ) : (
                                                            <EyeOff className="mr-1 size-3" />
                                                        )}
                                                        {circle.visibility}
                                                    </Badge>
                                                </div>
                                                {circle.description && (
                                                    <p className="text-sm text-white/70">
                                                        {circle.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-white/55">
                                                    {circle.interest && (
                                                        <span className="font-medium text-white/75">
                                                            {
                                                                circle.interest
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Users className="size-3" />
                                                        {circle.members_count}{' '}
                                                        members
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="size-3" />
                                                        {circle.posts_count}{' '}
                                                        posts
                                                    </span>
                                                    {circle.created_at && (
                                                        <span>
                                                            Created{' '}
                                                            {formatDistanceToNow(
                                                                new Date(
                                                                    circle.created_at,
                                                                ),
                                                                {
                                                                    addSuffix: true,
                                                                },
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Link
                                                href={`/circles/${circle.slug}`}
                                                className="shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:border-amber-400/40 hover:bg-amber-500/20 hover:text-amber-50"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-12 text-center">
                                <p className="text-white/70">
                                    No circles found.
                                </p>
                            </div>
                        )}

                        {paginationMeta.lastPage > 1 && (
                            <div className="mt-6">
                                <Pagination
                                    meta={paginationMeta}
                                    onPageChange={(page) => {
                                        router.get(
                                            adminCirclesRoutes.index().url,
                                            { page },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        );
                                    }}
                                    className="bg-black/30"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
