<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Services\Analytics\PostAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PostAnalyticsController extends Controller
{
    public function __construct(private readonly PostAnalyticsService $analytics) {}

    public function show(Request $request, Post $post): Response
    {
        $this->authorize('viewAnalytics', $post);

        $post->loadMissing('author');
        $post->loadCount(['bookmarks as bookmarks_count']);

        if ($request->user()) {
            $request->user()->attachBookmarkStatus($post);
        }

        [$rangeValue, $days] = $this->resolveRange($request->string('range')->toString());

        $end = Carbon::today();
        $start = $end->copy()->subDays($days - 1);

        $summary = $this->analytics->buildSummary($post, $start, $end);
        $analytics = $this->analytics;

        return Inertia::render('Posts/Analytics', [
            'post' => PostResource::make($post)->toArray($request),
            'heading' => [
                'title' => $this->postTitle($post),
                'excerpt' => $this->postExcerpt($post),
            ],
            'range' => [
                'value' => $rangeValue,
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'options' => $this->rangeOptions($rangeValue),
            ],
            'metrics' => [
                'totals' => $summary['totals'],
                'today' => $summary['today'],
                'live' => $summary['live'],
            ],
            'timeline' => $summary['timeline'],
            'countries' => Inertia::defer(fn () => $analytics->countryBreakdown($post, $start, $end)),
            'recentViews' => Inertia::defer(fn () => $analytics->recentViews($post)),
            'can' => [
                'viewAnalytics' => true,
            ],
        ]);
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function rangeOptions(string $active): array
    {
        $options = [
            ['value' => '7d', 'label' => 'Last 7 days'],
            ['value' => '14d', 'label' => 'Last 14 days'],
            ['value' => '30d', 'label' => 'Last 30 days'],
        ];

        return array_map(
            static fn (array $option) => array_merge($option, [
                'active' => $option['value'] === $active,
            ]),
            $options
        );
    }

    /**
     * @return array{0: string, 1: int}
     */
    private function resolveRange(?string $range): array
    {
        return match ($range) {
            '7d' => ['7d', 7],
            '30d' => ['30d', 30],
            default => ['14d', 14],
        };
    }

    private function postTitle(Post $post): string
    {
        $title = $post->extra_attributes['title'] ?? null;

        if (is_string($title) && $title !== '') {
            return $title;
        }

        if (is_string($post->body) && $post->body !== '') {
            $plain = strip_tags($post->body);

            if ($plain !== '') {
                return Str::limit($plain, 80);
            }
        }

        return 'Post #'.$post->getKey();
    }

    private function postExcerpt(Post $post): ?string
    {
        if (! is_string($post->body) || $post->body === '') {
            return null;
        }

        $plain = trim(strip_tags($post->body));

        return $plain === '' ? null : Str::limit($plain, 160);
    }
}
