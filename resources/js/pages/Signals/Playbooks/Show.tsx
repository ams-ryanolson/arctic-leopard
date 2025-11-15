import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Clock, Heart, Calendar, Eye, TrendingUp, Tag } from 'lucide-react';
import { useState } from 'react';

interface Article {
    id: number;
    slug: string;
    title: string;
    content: string;
    header_image_url: string | null;
    category: string | null;
    read_time_minutes: number;
    likes_count: number;
    views_count: number;
    published_at: string | null;
    user_liked: boolean;
}

interface RelatedArticle {
    id: number;
    slug: string;
    title: string;
    read_time_minutes: number;
    views_count: number;
}

interface PopularArticle {
    id: number;
    slug: string;
    title: string;
    category: string | null;
    read_time_minutes: number;
    views_count: number;
}

interface Category {
    name: string;
    count: number;
}

interface SignalsPlaybooksShowProps {
    article: Article;
    relatedArticles: RelatedArticle[];
    popularArticles: PopularArticle[];
    categories: Category[];
}

const breadcrumbs: (article: Article) => BreadcrumbItem[] = (article) => [
    {
        title: 'Signals',
        href: '/signals',
    },
    {
        title: 'Playbooks',
        href: '/signals/playbooks',
    },
    {
        title: article.title,
        href: `/signals/playbooks/${article.slug}`,
    },
];

const categoryColors: Record<string, string> = {
    pricing: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    tips: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    kyc: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    automations: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    subscriptions: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    monetization: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    content: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    profile: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    analytics: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    security: 'bg-red-500/20 text-red-300 border-red-500/40',
};

export default function SignalsPlaybooksShow({ 
    article: initialArticle, 
    relatedArticles, 
    popularArticles,
    categories,
}: SignalsPlaybooksShowProps) {
    const [article, setArticle] = useState(initialArticle);
    const [isLiking, setIsLiking] = useState(false);

    const handleLike = async () => {
        if (isLiking) {
            return;
        }

        setIsLiking(true);
        const wasLiked = article.user_liked;
        const previousLikesCount = article.likes_count;

        // Optimistic update
        setArticle({
            ...article,
            user_liked: !wasLiked,
            likes_count: wasLiked ? article.likes_count - 1 : article.likes_count + 1,
        });

        try {
            const url = `/api/playbook-articles/${article.id}/like`;
            const response = await fetch(url, {
                method: wasLiked ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to update like');
            }

            const data = await response.json();
            setArticle({
                ...article,
                user_liked: data.user_liked,
                likes_count: data.likes_count,
            });
        } catch (error) {
            // Revert on error
            setArticle({
                ...article,
                user_liked: wasLiked,
                likes_count: previousLikesCount,
            });
        } finally {
            setIsLiking(false);
        }
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) {
            return '';
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(article)}>
            <Head title={`${article.title} · Signals Playbooks`} />

            <div className="space-y-8 text-white">
                {/* Back Button */}
                <Link
                    href="/signals/playbooks"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-all"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Playbooks
                </Link>

                {/* Header Image */}
                {article.header_image_url && (
                    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-white/10">
                        <img
                            src={article.header_image_url}
                            alt={article.title}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {article.category && (
                            <div className="absolute top-6 left-6">
                                <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${categoryColors[article.category] || 'bg-white/20 text-white border-white/30'}`}>
                                    {article.category.replace('_', ' ')}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Article Header */}
                <section className="space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white leading-tight">{article.title}</h1>
                        <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{article.read_time_minutes} min read</span>
                            </div>
                            {article.published_at && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(article.published_at)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <span>{article.views_count} views</span>
                            </div>
                        </div>
                    </div>

                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={`inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-all ${
                            article.user_liked
                                ? 'bg-gradient-to-r from-rose-400/30 to-pink-500/20 border-rose-400/40 text-rose-300 shadow-[0_4px_15px_-5px_rgba(244,63,94,0.3)] hover:from-rose-500/40 hover:to-pink-600/30'
                                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
                        } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Heart className={`h-4 w-4 ${article.user_liked ? 'fill-current' : ''}`} />
                        <span>{article.likes_count}</span>
                    </button>
                </section>

                {/* Main Content with Sidebar */}
                <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                    {/* Article Content */}
                    <div className="space-y-8">
                        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
                            <div
                                className="prose prose-invert prose-lg max-w-none text-white/90 leading-relaxed [&>p]:mb-6 [&>p:last-child]:mb-0 [&>p]:text-white/90 [&>h1]:text-white [&>h2]:text-white [&>h3]:text-white [&>h4]:text-white [&>a]:text-blue-400 [&>a]:hover:text-blue-300 [&>strong]:text-white [&>code]:text-amber-400"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                        </section>

                        {/* Back to Playbooks */}
                        <section>
                            <Link
                                href="/signals/playbooks"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition-all"
                            >
                                <BookOpen className="h-4 w-4" />
                                Explore More Playbooks
                            </Link>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Article Stats */}
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Article Stats</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between text-white/70">
                                    <span>Read Time</span>
                                    <span className="font-semibold text-white">{article.read_time_minutes} min</span>
                                </div>
                                <div className="flex items-center justify-between text-white/70">
                                    <span>Views</span>
                                    <span className="font-semibold text-white">{article.views_count.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-white/70">
                                    <span>Likes</span>
                                    <span className="font-semibold text-white">{article.likes_count.toLocaleString()}</span>
                                </div>
                                {article.published_at && (
                                    <div className="flex items-center justify-between text-white/70">
                                        <span>Published</span>
                                        <span className="font-semibold text-white text-xs">{formatDate(article.published_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Related Articles */}
                        {relatedArticles.length > 0 && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Tag className="h-5 w-5 text-blue-400" />
                                    Related Articles
                                </h3>
                                <div className="space-y-3">
                                    {relatedArticles.map((related) => (
                                        <Link
                                            key={related.id}
                                            href={`/signals/playbooks/${related.slug}`}
                                            className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 hover:bg-white/10 transition-all group"
                                        >
                                            <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-2">
                                                {related.title}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-white/60">
                                                <span>{related.read_time_minutes} min</span>
                                                <span>·</span>
                                                <span>{related.views_count} views</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Popular Articles */}
                        {popularArticles.length > 0 && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                    Popular Articles
                                </h3>
                                <div className="space-y-3">
                                    {popularArticles.map((popular) => (
                                        <Link
                                            key={popular.id}
                                            href={`/signals/playbooks/${popular.slug}`}
                                            className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 hover:bg-white/10 transition-all group"
                                        >
                                            {popular.category && (
                                                <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold mb-2 ${categoryColors[popular.category] || 'bg-white/20 text-white border-white/30'}`}>
                                                    {popular.category.replace('_', ' ')}
                                                </span>
                                            )}
                                            <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-2">
                                                {popular.title}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-white/60">
                                                <span>{popular.read_time_minutes} min</span>
                                                <span>·</span>
                                                <span>{popular.views_count} views</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Categories */}
                        {categories.length > 0 && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
                                <div className="space-y-2">
                                    {categories.map((category) => (
                                        <Link
                                            key={category.name}
                                            href={`/signals/playbooks?category=${category.name}`}
                                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:border-white/20 hover:bg-white/10 transition-all group"
                                        >
                                            <span className="text-sm font-medium text-white/70 group-hover:text-white capitalize">
                                                {category.name.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded">
                                                {category.count}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

