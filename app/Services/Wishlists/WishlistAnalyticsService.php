<?php

namespace App\Services\Wishlists;

use App\Models\Wishlists\WishlistItem;
use Illuminate\Support\Collection;

class WishlistAnalyticsService
{
    /**
     * Get analytics for a specific wishlist item.
     *
     * @return array<string, mixed>
     */
    public function getItemAnalytics(WishlistItem $item): array
    {
        $purchases = $item->completedPurchases()->with('buyer')->get();

        $totalContributions = $purchases->sum('amount');
        $contributorCount = $purchases->unique('buyer_id')->count();
        $averageContribution = $contributorCount > 0 ? $totalContributions / $contributorCount : 0;
        $largestContribution = $purchases->max('amount') ?? 0;

        return [
            'item_id' => $item->getKey(),
            'title' => $item->title,
            'status' => $item->status->value,
            'total_contributions' => $totalContributions,
            'contributor_count' => $contributorCount,
            'purchase_count' => $purchases->count(),
            'average_contribution' => (int) round($averageContribution),
            'largest_contribution' => $largestContribution,
            'progress_percentage' => $item->progressPercentage(),
            'is_crowdfunded' => $item->is_crowdfunded,
            'goal_amount' => $item->goal_amount,
            'current_funding' => $item->current_funding,
            'quantity' => $item->quantity,
            'remaining_quantity' => $item->remainingQuantity(),
            'created_at' => $item->created_at?->toIso8601String(),
            'expires_at' => $item->expires_at?->toIso8601String(),
        ];
    }

    /**
     * Get analytics for all wishlist items by a creator.
     *
     * @return array<string, mixed>
     */
    public function getCreatorAnalytics(int $creatorId): array
    {
        $items = WishlistItem::query()
            ->where('creator_id', $creatorId)
            ->with(['purchases' => fn ($query) => $query->where('status', 'completed')])
            ->get();

        $totalItems = $items->count();
        $activeItems = $items->where('status', \App\Enums\WishlistItemStatus::Active)->count();
        $fulfilledItems = $items->where('status', \App\Enums\WishlistItemStatus::Fulfilled)->count();

        $allPurchases = $items->flatMap->purchases;
        $totalContributions = $allPurchases->sum('amount');
        $totalContributors = $allPurchases->unique('buyer_id')->count();

        return [
            'total_items' => $totalItems,
            'active_items' => $activeItems,
            'fulfilled_items' => $fulfilledItems,
            'total_contributions' => $totalContributions,
            'total_contributors' => $totalContributors,
            'average_contribution' => $allPurchases->count() > 0
                ? (int) round($totalContributions / $allPurchases->count())
                : 0,
            'items' => $items->map(fn (WishlistItem $item) => $this->getItemAnalytics($item)),
        ];
    }

    /**
     * Get top contributors for a wishlist item (creator only).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getTopContributors(WishlistItem $item, int $limit = 10): Collection
    {
        return $item->completedPurchases()
            ->with('buyer')
            ->selectRaw('buyer_id, SUM(amount) as total_contributed, COUNT(*) as contribution_count')
            ->groupBy('buyer_id')
            ->orderByDesc('total_contributed')
            ->limit($limit)
            ->get()
            ->map(function ($purchase) {
                $buyer = $purchase->buyer;

                return [
                    'buyer_id' => $purchase->buyer_id,
                    'buyer_name' => $buyer->display_name ?? $buyer->username,
                    'buyer_avatar' => $buyer->avatar_url,
                    'total_contributed' => (int) $purchase->total_contributed,
                    'contribution_count' => (int) $purchase->contribution_count,
                ];
            });
    }

    /**
     * Get conversion rate for a wishlist item.
     * This would require view tracking - for now, return a placeholder.
     */
    public function getConversionRate(WishlistItem $item): float
    {
        // TODO: Implement view tracking
        // For now, return 0 as placeholder
        $views = 0; // Would come from view tracking
        $purchases = $item->completedPurchases()->count();

        if ($views === 0) {
            return 0.0;
        }

        return ($purchases / $views) * 100;
    }
}
