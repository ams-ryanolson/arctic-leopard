import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Clock, Heart, Eye } from 'lucide-react';
import { useState } from 'react';

interface Article {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    header_image_url: string | null;
    category: string | null;
    read_time_minutes: number;
    likes_count: number;
    views_count: number;
    published_at: string | null;
}

interface SignalsPlaybooksIndexProps {
    articles: Article[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Signals',
        href: '/signals',
    },
    {
        title: 'Playbooks',
        href: '/signals/playbooks',
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

export default function SignalsPlaybooksIndex({ articles }: SignalsPlaybooksIndexProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    
    const categories = Array.from(new Set(articles.map((article) => article.category).filter(Boolean))) as string[];
    
    const filteredArticles = selectedCategory
        ? articles.filter((article) => article.category === selectedCategory)
        : articles;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Signals · Playbooks" />

            <div className="space-y-8 text-white">
                {/* Header Section */}
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/5 p-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/30 to-purple-500/20 border border-blue-400/40 shadow-[0_8px_25px_-15px_rgba(59,130,246,0.4)]">
                            <BookOpen className="h-6 w-6 text-blue-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Playbooks</h1>
                            <p className="mt-2 text-sm text-white/70">
                                Your insider guide to Signals and creator success. Learn from proven strategies, best practices, and expert insights.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Category Filters */}
                {categories.length > 0 && (
                    <section className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                                selectedCategory === null
                                    ? 'bg-gradient-to-r from-blue-400/30 to-purple-500/20 border-blue-400/40 text-white shadow-[0_4px_15px_-5px_rgba(59,130,246,0.3)]'
                                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            All Articles
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all capitalize ${
                                    selectedCategory === category
                                        ? 'bg-gradient-to-r from-blue-400/30 to-purple-500/20 border-blue-400/40 text-white shadow-[0_4px_15px_-5px_rgba(59,130,246,0.3)]'
                                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {category.replace('_', ' ')}
                            </button>
                        ))}
                    </section>
                )}

                {/* Articles Grid */}
                <section className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredArticles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/signals/playbooks/${article.slug}`}
                            className="group rounded-3xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 hover:bg-white/10 transition-all"
                        >
                            {article.header_image_url && (
                                <div className="relative h-48 w-full overflow-hidden">
                                    <img
                                        src={article.header_image_url}
                                        alt={article.title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    {article.category && (
                                        <div className="absolute top-4 left-4">
                                            <span className={`rounded-lg border px-3 py-1 text-xs font-semibold ${categoryColors[article.category] || 'bg-white/20 text-white border-white/30'}`}>
                                                {article.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                                        {article.title}
                                    </h3>
                                    {article.excerpt && (
                                        <p className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-3">
                                            {article.excerpt}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-white/60">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{article.read_time_minutes} min read</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Heart className="h-3.5 w-3.5" />
                                        <span>{article.likes_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>{article.views_count}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </section>

                {filteredArticles.length === 0 && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-white/40 mb-4" />
                        <p className="text-lg font-semibold text-white/70">No articles found</p>
                        <p className="mt-2 text-sm text-white/50">Try selecting a different category.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

