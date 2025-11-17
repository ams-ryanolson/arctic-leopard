<?php

namespace App\Services\Payments;

use App\Enums\Payments\PaymentStatus;
use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Enums\Payments\PaymentType;
use App\Models\Payments\Payment;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\Tip;
use App\Models\PostPurchase;
use App\Models\Wishlists\WishlistPurchase;
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

        return Cache::remember(
            $this->cacheKey('paymentsSummary', $from, $to),
            now()->addMinutes(5),
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

        return Cache::remember(
            $this->cacheKey('monthlyRevenue', $start, null, ['months' => $months]),
            now()->addMinutes(10),
            fn () => Payment::query()
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period')
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
                ->get()
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

        return Cache::remember(
            $this->cacheKey('oneTimeChannelBreakdown', $from, $to),
            now()->addMinutes(10),
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
}
