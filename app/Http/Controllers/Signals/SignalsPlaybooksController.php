<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Models\PlaybookArticle;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsPlaybooksController extends Controller
{
    /**
     * Display the playbooks directory page.
     */
    public function index(Request $request): Response
    {
        $articles = PlaybookArticle::query()
            ->where('is_published', true)
            ->orderBy('order')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($article) => [
                'id' => $article->id,
                'slug' => $article->slug,
                'title' => $article->title,
                'excerpt' => $article->excerpt,
                'header_image_url' => $article->header_image_url,
                'category' => $article->category,
                'read_time_minutes' => $article->read_time_minutes,
                'likes_count' => $article->likes_count,
                'views_count' => $article->views_count,
                'published_at' => $article->published_at?->toIso8601String(),
            ]);

        return Inertia::render('Signals/Playbooks/Index', [
            'articles' => $articles,
        ]);
    }

    /**
     * Display a single playbook article.
     */
    public function show(Request $request, string $slug): Response
    {
        $article = PlaybookArticle::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        // Increment view count
        $article->increment('views_count');

        $userLiked = $request->user()
            ? $article->isLikedBy($request->user())
            : false;

        // Get related articles (same category, excluding current)
        $relatedArticles = PlaybookArticle::query()
            ->where('is_published', true)
            ->where('id', '!=', $article->id)
            ->where('category', $article->category)
            ->orderBy('views_count', 'desc')
            ->orderBy('likes_count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($related) => [
                'id' => $related->id,
                'slug' => $related->slug,
                'title' => $related->title,
                'read_time_minutes' => $related->read_time_minutes,
                'views_count' => $related->views_count,
            ]);

        // Get popular articles (top by views/likes, excluding current)
        $popularArticles = PlaybookArticle::query()
            ->where('is_published', true)
            ->where('id', '!=', $article->id)
            ->orderBy('views_count', 'desc')
            ->orderBy('likes_count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($popular) => [
                'id' => $popular->id,
                'slug' => $popular->slug,
                'title' => $popular->title,
                'category' => $popular->category,
                'read_time_minutes' => $popular->read_time_minutes,
                'views_count' => $popular->views_count,
            ]);

        // Get all categories with counts
        $categories = PlaybookArticle::query()
            ->where('is_published', true)
            ->whereNotNull('category')
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->get()
            ->map(fn ($cat) => [
                'name' => $cat->category,
                'count' => $cat->count,
            ]);

        return Inertia::render('Signals/Playbooks/Show', [
            'article' => [
                'id' => $article->id,
                'slug' => $article->slug,
                'title' => $article->title,
                'content' => $article->content,
                'header_image_url' => $article->header_image_url,
                'category' => $article->category,
                'read_time_minutes' => $article->read_time_minutes,
                'likes_count' => $article->likes_count,
                'views_count' => $article->views_count,
                'published_at' => $article->published_at?->toIso8601String(),
                'user_liked' => $userLiked,
            ],
            'relatedArticles' => $relatedArticles,
            'popularArticles' => $popularArticles,
            'categories' => $categories,
        ]);
    }
}
