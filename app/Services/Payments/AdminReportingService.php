<?php

namespace App\Services\Payments;

use App\Enums\Payments\PaymentStatus;
use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Enums\Payments\PaymentType;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\Payments\Payment;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\Tip;
use App\Models\PostPurchase;
use App\Models\Wishlists\WishlistPurchase;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class AdminReportingService
{
    /**
     * Provide a high level summary of payment activity.
     *
     * @return array{
     *     total_volume: int,
     *     total_net: int,
     *     captured_count: int,
     *     refunded_count: int,
     *     failed_count: int,
     *     one_time_volume: int,
     *     recurring_volume: int
     * }
     */
    public function paymentsSummary(?Carbon $from = null, ?Carbon $to = null): array
    {
        [$from, $to] = $this->dateRange($from, $to);

        $query = Payment::query()
            ->when($from, fn (Builder $builder) => $builder->where('created_at', '>=', $from))
            ->when($to, fn (Builder $builder) => $builder->where('created_at', '<=', $to));

        $payments = clone $query;

        return Cache::tags(['dashboard', 'financial'])->remember(
            $this->cacheKey('paymentsSummary', $from, $to),
            now()->addMinutes(15),
            function () use ($payments): array {
                return [
                    'total_volume' => (int) $payments->sum('amount'),
                    'total_net' => (int) $payments->sum('net_amount'),
                    'captured_count' => $payments->where('status', PaymentStatus::Captured)->count(),
                    'refunded_count' => $payments->where('status', PaymentStatus::Refunded)->count(),
                    'failed_count' => $payments->where('status', PaymentStatus::Failed)->count(),
                    'one_time_volume' => (int) $payments->where('type', PaymentType::OneTime)->sum('amount'),
                    'recurring_volume' => (int) $payments->where('type', PaymentType::Recurring)->sum('amount'),
                ];
            }
        );
    }

    /**
     * Revenue grouped by month for trend charts.
     *
     * @return Collection<int, array{period: string, gross: int, net: int, currency: string}>
     */
    public function monthlyRevenue(int $months = 6): Collection
    {
        $months = max(1, min($months, 24));
        $start = Carbon::now()->startOfMonth()->subMonths($months - 1);

        return Cache::tags(['dashboard', 'financial'])->remember(
            $this->cacheKey('monthlyRevenue', $start, null, ['months' => $months]),
            now()->addMinutes(15),
            function () use ($start) {
                $driver = Payment::query()->getConnection()->getDriverName();
                $periodExpression = $driver === 'sqlite'
                    ? "strftime('%Y-%m', created_at) as period"
                    : 'DATE_FORMAT(created_at, "%Y-%m") as period';

                return Payment::query()
                    ->selectRaw($periodExpression)
                    ->selectRaw('SUM(amount) as gross')
                    ->selectRaw('SUM(net_amount) as net')
                    ->selectRaw('MAX(currency) as currency')
                    ->where('created_at', '>=', $start)
                    ->whereIn('status', [
                        PaymentStatus::Captured,
                        PaymentStatus::Settled,
                        PaymentStatus::Refunded,
                    ])
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
            }
        );
    }

    /**
     * Aggregate helper for outstanding captured payments that have not been marked as refunded.
     */
    public function outstandingCapturedVolume(?Carbon $asOf = null): int
    {
        $asOf = $asOf ?? Carbon::now();

        return Cache::remember(
            $this->cacheKey('outstandingCapturedVolume', null, $asOf),
            now()->addMinutes(5),
            fn () => (int) Payment::query()
                ->whereIn('status', [PaymentStatus::Captured, PaymentStatus::Settled])
                ->where(function (Builder $query): void {
                    $query->whereNull('refunded_at')
                        ->orWhere('refunded_at', '>', Carbon::now());
                })
                ->sum('net_amount')
        );
    }

    /**
     * Returns a breakdown of one-time monetisation channels.
     *
     * @return array{tips: int, wishlist: int, post_unlocks: int}
     */
    public function oneTimeChannelBreakdown(?Carbon $from = null, ?Carbon $to = null): array
    {
        [$from, $to] = $this->dateRange($from, $to);

        return Cache::tags(['dashboard', 'financial'])->remember(
            $this->cacheKey('oneTimeChannelBreakdown', $from, $to),
            now()->addMinutes(15),
            function () use ($from, $to): array {
                return [
                    'tips' => (int) Tip::query()
                        ->when($from, fn (Builder $builder) => $builder->where('created_at', '>=', $from))
                        ->when($to, fn (Builder $builder) => $builder->where('created_at', '<=', $to))
                        ->sum('amount'),
                    'wishlist' => (int) WishlistPurchase::query()
                        ->when($from, fn (Builder $builder) => $builder->where('created_at', '>=', $from))
                        ->when($to, fn (Builder $builder) => $builder->where('created_at', '<=', $to))
                        ->sum('amount'),
                    'post_unlocks' => (int) PostPurchase::query()
                        ->when($from, fn (Builder $builder) => $builder->where('created_at', '>=', $from))
                        ->when($to, fn (Builder $builder) => $builder->where('created_at', '<=', $to))
                        ->sum('amount'),
                ];
            }
        );
    }

    /**
     * Retrieve active subscriber counts aggregated by creator.
     *
     * @return Collection<int, array{creator_id: int, active_subscribers: int, monthly_recurring_revenue: int}>
     */
    public function topCreatorsByRecurringRevenue(int $limit = 10): Collection
    {
        $limit = max(1, min($limit, 100));

        $query = PaymentSubscription::query()
            ->selectRaw('creator_id')
            ->selectRaw('COUNT(*) as active_subscribers')
            ->selectRaw('SUM(amount) as monthly_recurring_revenue')
            ->whereIn('status', [
                PaymentSubscriptionStatus::Active,
                PaymentSubscriptionStatus::Trialing,
            ])
            ->groupBy('creator_id')
            ->orderByDesc('monthly_recurring_revenue')
            ->limit($limit);

        return Cache::remember(
            $this->cacheKey('topCreatorsByRecurringRevenue', null, null, ['limit' => $limit]),
            now()->addMinutes(10),
            fn () => $query->get()
        );
    }

    /**
     * Convenience helper for constructing cache keys with optional context parameters.
     *
     * @param  array<string, mixed>  $context
     */
    protected function cacheKey(string $base, ?Carbon $from, ?Carbon $to, array $context = []): string
    {
        $parts = [
            'payments',
            'admin',
            $base,
            optional($from)?->timestamp ?? 'null',
            optional($to)?->timestamp ?? 'null',
        ];

        if (! empty($context)) {
            $parts[] = md5(json_encode($context, JSON_THROW_ON_ERROR));
        }

        return implode(':', $parts);
    }

    /**
     * Normalise the provided date range by defaulting to the last 30 days.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function dateRange(?Carbon $from, ?Carbon $to): array
    {
        $to = $to ?? Carbon::now();
        $from = $from ?? $to->clone()->subDays(30);

        return [$from, $to];
    }

    /**
     * Get membership sales summary with counts and trends.
     *
     * @return array{
     *     today: array{sold: int, active: int, cancelled: int},
     *     this_week: array{sold: int, active: int, cancelled: int, trend: string},
     *     this_month: array{sold: int, active: int, cancelled: int, trend: string},
     *     total_active: int
     * }
     */
    public function membershipSalesSummary(?Carbon $from = null, ?Carbon $to = null): array
    {
        [$from, $to] = $this->dateRange($from, $to);

        return Cache::tags(['dashboard', 'financial'])->remember(
            $this->cacheKey('membershipSalesSummary', $from, $to),
            now()->addMinutes(15),
            function (): array {
                $todayStart = Carbon::today();
                $todayEnd = Carbon::today()->endOfDay();
                $weekStart = Carbon::now()->startOfWeek();
                $weekEnd = Carbon::now()->endOfWeek();
                $monthStart = Carbon::now()->startOfMonth();
                $monthEnd = Carbon::now()->endOfMonth();

                // Today's sales
                $todaySold = UserMembership::query()
                    ->whereBetween('created_at', [$todayStart, $todayEnd])
                    ->count();

                // This week's sales
                $weekSold = UserMembership::query()
                    ->whereBetween('created_at', [$weekStart, $weekEnd])
                    ->count();

                // Last week for comparison
                $lastWeekStart = $weekStart->copy()->subWeek();
                $lastWeekEnd = $weekEnd->copy()->subWeek();
                $lastWeekSold = UserMembership::query()
                    ->whereBetween('created_at', [$lastWeekStart, $lastWeekEnd])
                    ->count();

                // This month's sales
                $monthSold = UserMembership::query()
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();

                // Last month for comparison
                $lastMonthStart = $monthStart->copy()->subMonth();
                $lastMonthEnd = $monthEnd->copy()->subMonth();
                $lastMonthSold = UserMembership::query()
                    ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
                    ->count();

                // Active memberships
                $totalActive = UserMembership::query()->active()->count();

                // Cancelled this period
                $todayCancelled = UserMembership::query()
                    ->whereNotNull('cancelled_at')
                    ->whereBetween('cancelled_at', [$todayStart, $todayEnd])
                    ->count();

                $weekCancelled = UserMembership::query()
                    ->whereNotNull('cancelled_at')
                    ->whereBetween('cancelled_at', [$weekStart, $weekEnd])
                    ->count();

                $monthCancelled = UserMembership::query()
                    ->whereNotNull('cancelled_at')
                    ->whereBetween('cancelled_at', [$monthStart, $monthEnd])
                    ->count();

                // Calculate trends
                $weekTrend = $this->calculateTrend($weekSold, $lastWeekSold);
                $monthTrend = $this->calculateTrend($monthSold, $lastMonthSold);

                return [
                    'today' => [
                        'sold' => $todaySold,
                        'active' => UserMembership::query()
                            ->whereBetween('created_at', [$todayStart, $todayEnd])
                            ->active()
                            ->count(),
                        'cancelled' => $todayCancelled,
                    ],
                    'this_week' => [
                        'sold' => $weekSold,
                        'active' => UserMembership::query()
                            ->whereBetween('created_at', [$weekStart, $weekEnd])
                            ->active()
                            ->count(),
                        'cancelled' => $weekCancelled,
                        'trend' => $weekTrend,
                    ],
                    'this_month' => [
                        'sold' => $monthSold,
                        'active' => UserMembership::query()
                            ->whereBetween('created_at', [$monthStart, $monthEnd])
                            ->active()
                            ->count(),
                        'cancelled' => $monthCancelled,
                        'trend' => $monthTrend,
                    ],
                    'total_active' => $totalActive,
                ];
            }
        );
    }

    /**
     * Get membership revenue breakdown.
     *
     * @return array{
     *     total: array{amount: int, formatted: string, currency: string},
     *     net: array{amount: int, formatted: string, currency: string},
     *     by_plan: array<int, array{plan_id: int, plan_name: string, count: int, revenue: array{amount: int, formatted: string}}>
     * }
     */
    public function membershipRevenue(?Carbon $from = null, ?Carbon $to = null): array
    {
        [$from, $to] = $this->dateRange($from, $to);

        return Cache::tags(['dashboard', 'financial'])->remember(
            $this->cacheKey('membershipRevenue', $from, $to),
            now()->addMinutes(15),
            function () use ($from, $to): array {
                $payments = Payment::query()
                    ->where('payable_type', MembershipPlan::class)
                    ->whereIn('status', [
                        PaymentStatus::Captured,
                        PaymentStatus::Settled,
                    ])
                    ->when($from, fn (Builder $builder) => $builder->where('created_at', '>=', $from))
                    ->when($to, fn (Builder $builder) => $builder->where('created_at', '<=', $to));

                $totalAmount = (int) $payments->sum('amount');
                $totalNet = (int) $payments->sum('net_amount');

                // Get currency (assume USD for now, or get from first payment)
                $firstPayment = $payments->first();
                $currency = $firstPayment?->currency ?? 'USD';

                $money = new Money($totalAmount, $currency);
                $netMoney = new Money($totalNet, $currency);

                // Breakdown by plan
                $byPlan = $payments->get()
                    ->groupBy('payable_id')
                    ->map(function ($planPayments, $planId) use ($currency) {
                        $plan = MembershipPlan::find($planId);
                        $revenue = (int) $planPayments->sum('amount');
                        $revenueMoney = new Money($revenue, $currency);

                        return [
                            'plan_id' => (int) $planId,
                            'plan_name' => $plan?->name ?? 'Unknown Plan',
                            'count' => $planPayments->count(),
                            'revenue' => [
                                'amount' => $revenue,
                                'formatted' => $revenueMoney->format(),
                            ],
                        ];
                    })
                    ->values()
                    ->sortByDesc(fn ($plan) => $plan['revenue']['amount'])
                    ->take(10)
                    ->values()
                    ->all();

                return [
                    'total' => [
                        'amount' => $totalAmount,
                        'formatted' => $money->format(),
                        'currency' => $currency,
                    ],
                    'net' => [
                        'amount' => $totalNet,
                        'formatted' => $netMoney->format(),
                        'currency' => $currency,
                    ],
                    'by_plan' => $byPlan,
                ];
            }
        );
    }

    /**
     * Get comprehensive financial overview combining all revenue sources.
     *
     * @return array{
     *     today: array{revenue: array, memberships_sold: int, transactions: int},
     *     this_week: array{revenue: array, memberships_sold: int, trend: string},
     *     this_month: array{revenue: array, memberships_sold: int, trend: string},
     *     subscriptions: array{active_count: int, mrr: array},
     *     breakdown: array{memberships: array, tips: array, post_unlocks: array, wishlist: array}
     * }
     */
    public function financialOverview(?Carbon $from = null, ?Carbon $to = null): array
    {
        $todayStart = Carbon::today();
        $todayEnd = Carbon::today()->endOfDay();
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        // Today's revenue
        $todaySummary = $this->paymentsSummary($todayStart, $todayEnd);
        $todayMemberships = $this->membershipSalesSummary($todayStart, $todayEnd);

        // This week's revenue
        $weekSummary = $this->paymentsSummary($weekStart, $weekEnd);
        $weekMemberships = $this->membershipSalesSummary($weekStart, $weekEnd);

        // This month's revenue
        $monthSummary = $this->paymentsSummary($monthStart, $monthEnd);
        $monthMemberships = $this->membershipSalesSummary($monthStart, $monthEnd);

        // Get currency from a recent payment
        $samplePayment = Payment::query()
            ->whereIn('status', [PaymentStatus::Captured, PaymentStatus::Settled])
            ->latest()
            ->first();
        $currency = $samplePayment?->currency ?? 'USD';

        // Format revenue
        $formatRevenue = function (int $amount, string $currency) {
            $money = new Money($amount, $currency);

            return [
                'amount' => $amount,
                'formatted' => $money->format(),
                'currency' => $currency,
            ];
        };

        // Get breakdown for this month
        $breakdown = $this->oneTimeChannelBreakdown($monthStart, $monthEnd);
        $membershipRevenue = $this->membershipRevenue($monthStart, $monthEnd);

        // Get subscription stats
        $activeSubscriptions = PaymentSubscription::query()
            ->whereIn('status', [
                PaymentSubscriptionStatus::Active,
                PaymentSubscriptionStatus::Trialing,
            ])
            ->count();

        $mrr = PaymentSubscription::query()
            ->whereIn('status', [
                PaymentSubscriptionStatus::Active,
                PaymentSubscriptionStatus::Trialing,
            ])
            ->sum('amount');

        return [
            'today' => [
                'revenue' => $formatRevenue($todaySummary['total_volume'], $currency),
                'net_revenue' => $formatRevenue($todaySummary['total_net'], $currency),
                'memberships_sold' => $todayMemberships['today']['sold'],
                'transactions' => $todaySummary['captured_count'],
            ],
            'this_week' => [
                'revenue' => $formatRevenue($weekSummary['total_volume'], $currency),
                'net_revenue' => $formatRevenue($weekSummary['total_net'], $currency),
                'memberships_sold' => $weekMemberships['this_week']['sold'],
                'transactions' => $weekSummary['captured_count'],
                'trend' => $weekMemberships['this_week']['trend'],
            ],
            'this_month' => [
                'revenue' => $formatRevenue($monthSummary['total_volume'], $currency),
                'net_revenue' => $formatRevenue($monthSummary['total_net'], $currency),
                'memberships_sold' => $monthMemberships['this_month']['sold'],
                'transactions' => $monthSummary['captured_count'],
                'trend' => $monthMemberships['this_month']['trend'],
            ],
            'subscriptions' => [
                'active_count' => $activeSubscriptions,
                'mrr' => $formatRevenue((int) $mrr, $currency),
            ],
            'breakdown' => [
                'memberships' => [
                    'amount' => $membershipRevenue['total']['amount'],
                    'formatted' => $membershipRevenue['total']['formatted'],
                ],
                'tips' => [
                    'amount' => $breakdown['tips'],
                    'formatted' => (new Money($breakdown['tips'], $currency))->format(),
                ],
                'post_unlocks' => [
                    'amount' => $breakdown['post_unlocks'],
                    'formatted' => (new Money($breakdown['post_unlocks'], $currency))->format(),
                ],
                'wishlist' => [
                    'amount' => $breakdown['wishlist'],
                    'formatted' => (new Money($breakdown['wishlist'], $currency))->format(),
                ],
            ],
        ];
    }

    /**
     * Calculate trend percentage string.
     */
    protected function calculateTrend(int $current, int $previous): string
    {
        if ($previous === 0) {
            return $current > 0 ? '+100% vs previous period' : 'No change';
        }

        $change = $current - $previous;
        $percent = round(($change / $previous) * 100);

        if ($percent > 0) {
            return "+{$percent}% vs previous period";
        }

        if ($percent < 0) {
            return "{$percent}% vs previous period";
        }

        return 'No change';
    }
}
