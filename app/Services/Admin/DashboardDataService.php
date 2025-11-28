<?php

namespace App\Services\Admin;

use App\Models\Comment;
use App\Models\ContentModerationQueue;
use App\Models\Event;
use App\Models\Post;
use App\Models\Story;
use App\Models\User;
use App\Models\UserAppeal;
use App\Services\Payments\AdminReportingService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\Models\Activity;

class DashboardDataService
{
    public function __construct(
        private readonly AdminReportingService $reportingService
    ) {}

    /**
     * Get overview statistics with trends.
     *
     * @return array<int, array{label: string, value: int, trend: string}>
     */
    public function getOverviewStats(): array
    {
        return Cache::tags(['dashboard', 'stats'])->remember(
            'dashboard:overview:stats',
            now()->addMinutes(10),
            function (): array {
                // Content pending moderation
                $pendingModeration = ContentModerationQueue::query()->pending()->count();
                $pendingModerationWeekAgo = ContentModerationQueue::query()
                    ->where('created_at', '>=', Carbon::now()->subWeek())
                    ->pending()
                    ->count();
                $moderationTrend = $this->formatTrendCount($pendingModeration, $pendingModerationWeekAgo, 'this week');

                // Pending appeals
                $pendingAppeals = UserAppeal::query()->pending()->count();
                $pendingAppealsWeekAgo = UserAppeal::query()
                    ->where('created_at', '>=', Carbon::now()->subWeek())
                    ->pending()
                    ->count();
                $appealsTrend = $this->formatTrendCount($pendingAppeals, $pendingAppealsWeekAgo, 'this week');

                // Events pending approval
                $pendingEvents = Event::query()
                    ->where('status', 'pending')
                    ->count();

                // Scheduled/upcoming events
                $scheduledEvents = Event::query()
                    ->where('status', 'published')
                    ->where('starts_at', '>=', Carbon::now())
                    ->count();
                $eventsAwaitingApproval = $pendingEvents;

                return [
                    [
                        'label' => 'Content pending moderation',
                        'value' => $pendingModeration,
                        'trend' => $moderationTrend,
                    ],
                    [
                        'label' => 'Pending appeals',
                        'value' => $pendingAppeals,
                        'trend' => $appealsTrend,
                    ],
                    [
                        'label' => 'Events pending approval',
                        'value' => $pendingEvents,
                        'trend' => $eventsAwaitingApproval > 0 ? "{$eventsAwaitingApproval} awaiting approval" : 'All clear',
                    ],
                    [
                        'label' => 'Scheduled events',
                        'value' => $scheduledEvents,
                        'trend' => $eventsAwaitingApproval > 0 ? "{$eventsAwaitingApproval} awaiting approval" : 'All scheduled',
                    ],
                ];
            }
        );
    }

    /**
     * Get recent activity log entries formatted for dashboard.
     *
     * @return Collection<int, array{id: int, title: string, timestamp: string, summary: string}>
     */
    public function getRecentActivity(int $limit = 5): Collection
    {
        return Cache::tags(['dashboard', 'activity'])->remember(
            "dashboard:recent:activity:{$limit}",
            now()->addMinutes(5),
            function () use ($limit): Collection {
                $activities = Activity::query()
                    ->with(['causer:id,name,username'])
                    ->whereIn('log_name', [
                        'user_suspended',
                        'user_unsuspended',
                        'user_banned',
                        'user_unbanned',
                        'user_warned',
                        'free_membership_granted',
                        'appeal_submitted',
                        'appeal_reviewed',
                        'content_queued_for_moderation',
                        'content_approved',
                        'content_rejected',
                        'content_dismissed',
                        'purchase_membership',
                        'payment_captured',
                        'payment_refunded',
                    ])
                    ->orderByDesc('created_at')
                    ->limit($limit)
                    ->get();

                return $activities->map(fn (Activity $activity) => $this->formatActivityForDashboard($activity));
            }
        );
    }

    /**
     * Format activity log entry for dashboard display.
     */
    protected function formatActivityForDashboard(Activity $activity): array
    {
        $description = $activity->description ?? '';
        $causer = $activity->causer;
        $causerName = $causer?->name ?? $causer?->username ?? 'System';
        $timestamp = $activity->created_at->diffForHumans();

        // Generate title and summary based on activity type
        $title = $this->generateActivityTitle($activity->log_name, $description, $causerName);
        $summary = $this->generateActivitySummary($activity->log_name, $description, $causerName);

        return [
            'id' => $activity->id,
            'title' => $title,
            'timestamp' => $timestamp,
            'summary' => $summary,
        ];
    }

    /**
     * Generate activity title from log name and description.
     */
    protected function generateActivityTitle(string $logName, string $description, string $causerName): string
    {
        return match ($logName) {
            'user_suspended' => 'User suspended',
            'user_unsuspended' => 'User unsuspended',
            'user_banned' => 'User banned',
            'user_unbanned' => 'User unbanned',
            'user_warned' => 'User warned',
            'free_membership_granted' => 'Free membership granted',
            'appeal_submitted' => 'Appeal submitted',
            'appeal_reviewed' => 'Appeal reviewed',
            'content_queued_for_moderation' => 'Content queued for moderation',
            'content_approved' => 'Content approved',
            'content_rejected' => 'Content rejected',
            'content_dismissed' => 'Content dismissed',
            'purchase_membership' => 'Membership purchased',
            'payment_captured' => 'Payment captured',
            'payment_refunded' => 'Payment refunded',
            default => ucwords(str_replace(['_', '.'], ' ', $logName)),
        };
    }

    /**
     * Generate activity summary from log name and description.
     */
    protected function generateActivitySummary(string $logName, string $description, string $causerName): string
    {
        // Use description if it's meaningful, otherwise generate one
        if (! empty($description) && $description !== 'User') {
            return $description;
        }

        return match ($logName) {
            'user_suspended' => "User suspended by {$causerName}.",
            'user_unsuspended' => "User suspension removed by {$causerName}.",
            'user_banned' => "User banned by {$causerName}.",
            'user_unbanned' => "User ban removed by {$causerName}.",
            'user_warned' => "User warned by {$causerName}.",
            'free_membership_granted' => "Free membership granted by {$causerName}.",
            'appeal_submitted' => 'New appeal submitted for review.',
            'appeal_reviewed' => "Appeal reviewed by {$causerName}.",
            'content_queued_for_moderation' => 'New content added to moderation queue.',
            'content_approved' => "Content approved by {$causerName}.",
            'content_rejected' => "Content rejected by {$causerName}.",
            'content_dismissed' => "Content dismissed from queue by {$causerName}.",
            'purchase_membership' => 'New membership purchase completed.',
            'payment_captured' => 'Payment successfully captured.',
            'payment_refunded' => 'Payment refunded.',
            default => $description ?: 'Activity logged.',
        };
    }

    /**
     * Get quick links for dashboard.
     *
     * @return array<int, array{label: string, description: string, url: string, disabled?: bool}>
     */
    public function getQuickLinks(): array
    {
        $pendingModeration = ContentModerationQueue::query()->pending()->count();
        $pendingAppeals = UserAppeal::query()->pending()->count();

        $links = [
            [
                'label' => 'Review moderation queue',
                'description' => $pendingModeration > 0
                    ? "{$pendingModeration} items awaiting review."
                    : 'All content reviewed.',
                'url' => route('admin.moderation.index'),
                'disabled' => false,
            ],
            [
                'label' => 'Review appeals',
                'description' => $pendingAppeals > 0
                    ? "{$pendingAppeals} appeals awaiting review."
                    : 'No pending appeals.',
                'url' => route('admin.appeals.index'),
                'disabled' => false,
            ],
        ];

        // Add events link if route exists
        try {
            $eventsUrl = route('admin.events.index');
            $links[] = [
                'label' => 'Review events queue',
                'description' => 'Approve, publish, or cancel upcoming scenes.',
                'url' => $eventsUrl,
                'disabled' => false,
            ];
        } catch (\Exception $e) {
            // Route doesn't exist, skip it
        }

        return $links;
    }

    /**
     * Get financial metrics formatted for dashboard.
     *
     * @return array<string, mixed>
     */
    public function getFinancialMetrics(): array
    {
        $overview = $this->reportingService->financialOverview();

        // Add monthly revenue data for charts
        $monthlyRevenue = $this->reportingService->monthlyRevenue(6);

        $overview['monthly_revenue_chart'] = $monthlyRevenue->map(function ($item) {
            // Laravel raw queries return objects with properties
            $period = is_object($item) ? $item->period : ($item['period'] ?? '');
            $gross = is_object($item) ? (int) $item->gross : (int) ($item['gross'] ?? 0);
            $net = is_object($item) ? (int) $item->net : (int) ($item['net'] ?? 0);
            $currency = is_object($item) ? $item->currency : ($item['currency'] ?? 'USD');

            return [
                'period' => $period,
                'gross' => $gross / 100, // Convert cents to dollars
                'net' => $net / 100, // Convert cents to dollars
                'currency' => $currency,
            ];
        })->values()->all();

        return $overview;
    }

    /**
     * Get global platform statistics.
     *
     * @return array{total_users: int, total_posts: int, total_comments: int, total_stories: int}
     */
    public function getGlobalStats(): array
    {
        return Cache::tags(['dashboard', 'stats'])->remember(
            'dashboard:global:stats',
            now()->addMinutes(10),
            function (): array {
                return [
                    'total_users' => User::query()->count(),
                    'total_posts' => Post::query()->count(),
                    'total_comments' => Comment::query()->count(),
                    'total_stories' => Story::query()->count(),
                ];
            }
        );
    }

    /**
     * Format trend count string.
     */
    protected function formatTrendCount(int $current, int $previous, string $period): string
    {
        if ($previous === 0) {
            return $current > 0 ? "+{$current} {$period}" : 'No change';
        }

        $change = $current - $previous;

        if ($change > 0) {
            return "+{$change} {$period}";
        }

        if ($change < 0) {
            return "{$change} {$period}";
        }

        return 'No change';
    }
}
