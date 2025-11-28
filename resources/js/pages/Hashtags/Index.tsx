import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Hash, TrendingUp } from 'lucide-react';
import { useCallback } from 'react';

type Hashtag = {
    id: number;
    name: string;
    slug: string;
    usage_count: number;
    recent_usage_count: number;
};

interface HashtagsIndexProps {
    hashtags: Hashtag[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export default function HashtagsIndex({
    hashtags,
    meta,
}: HashtagsIndexProps) {
    const handlePageChange = useCallback(
        (page: number) => {
            router.visit(`/hashtags?page=${page}`, {
                preserveScroll: true,
            });
        },
        [],
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Hashtags', href: '/hashtags' },
            ]}
        >
            <Head title="Hashtags · Real Kink Men" />

            <div className="space-y-8 text-white">
                <div className="space-y-4">
                    <h1 className="text-3xl font-semibold sm:text-4xl">
                        Trending Hashtags
                    </h1>
                    <p className="text-white/60">
                        Discover popular hashtags and explore posts
                    </p>
                </div>

                {hashtags.length > 0 ? (
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {hashtags.map((hashtag) => (
                                <Card
                                    key={hashtag.id}
                                    className="group border-white/10 bg-white/5 text-white transition hover:border-white/20 hover:bg-white/10"
                                >
                                    <Link href={`/hashtags/${hashtag.slug}`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                                                    <Hash className="size-6 text-white/60" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-lg font-semibold text-white">
                                                            #{hashtag.name}
                                                        </p>
                                                        {hashtag.recent_usage_count > 0 && (
                                                            <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/20 text-xs text-emerald-300">
                                                                <TrendingUp className="mr-1 size-3" />
                                                                Trending
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 space-y-1 text-sm text-white/60">
                                                        {hashtag.recent_usage_count > 0 && (
                                                            <p>
                                                                {hashtag.recent_usage_count}{' '}
                                                                posts in last 24h
                                                            </p>
                                                        )}
                                                        <p>
                                                            {hashtag.usage_count} total posts
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Link>
                                </Card>
                            ))}
                        </div>

                        {meta.last_page > 1 && (
                            <Pagination
                                currentPage={meta.current_page}
                                totalPages={meta.last_page}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Hash className="mb-4 size-12 text-white/40" />
                        <p className="text-lg text-white/60">
                            No hashtags found
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

