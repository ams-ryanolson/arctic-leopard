<?php

namespace App\Jobs;

use App\Models\Post;
use App\Models\PostMetricDaily;
use App\Models\PostPurchase;
use App\Support\Analytics\PostViewSummaryRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class PostMetricsAggregatorJob implements ShouldQueue
{
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 2;

    public function __construct(public ?Carbon $date = null)
    {
    }

    public function handle(): void
    {
        $date = ($this->date ?? Carbon::now())->startOfDay();
        $endOfDay = $date->copy()->endOfDay();
        $dateString = $date->toDateString();

        Post::query()
            ->select([
                'id',
                'likes_count',
                'comments_count',
                'reposts_count',
                'poll_votes_count',
                'views_count',
            ])
            ->chunk(250, function (Collection $posts) use ($date, $endOfDay, $dateString): void {
                if ($posts->isEmpty()) {
                    return;
                }

                $postIds = $posts->pluck('id')->all();
                $viewSummaries = app(PostViewSummaryRepository::class)->summarize($postIds, $date, $endOfDay);

                $purchaseCounts = PostPurchase::query()
                    ->whereIn('post_id', $postIds)
                    ->whereDate('created_at', $dateString)
                    ->selectRaw('post_id, COUNT(*) as aggregate')
                    ->groupBy('post_id')
                    ->pluck('aggregate', 'post_id');

                foreach ($posts as $post) {
                    $summary = $viewSummaries->get($post->getKey(), [
                        'views' => 0,
                        'unique_viewers' => 0,
                        'unique_authenticated_viewers' => 0,
                        'unique_guest_viewers' => 0,
                        'countries' => [],
                    ]);

                    PostMetricDaily::query()->updateOrCreate(
                        [
                            'post_id' => $post->getKey(),
                            'date' => $dateString,
                        ],
                        [
                            'likes' => $post->likes_count,
                            'comments' => $post->comments_count,
                            'reposts' => $post->reposts_count,
                            'poll_votes' => $post->poll_votes_count,
                            'views' => (int) ($summary['views'] ?? 0),
                            'unique_viewers' => (int) ($summary['unique_viewers'] ?? 0),
                            'unique_authenticated_viewers' => (int) ($summary['unique_authenticated_viewers'] ?? 0),
                            'unique_guest_viewers' => (int) ($summary['unique_guest_viewers'] ?? 0),
                            'country_breakdown' => empty($summary['countries'] ?? [])
                                ? null
                                : $summary['countries'],
                            'purchases' => (int) $purchaseCounts->get($post->getKey(), 0),
                        ]
                    );
                }
            });
    }
}
