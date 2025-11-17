<?php

namespace App\Http\Controllers;

use App\Http\Resources\Wishlists\WishlistItemResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    /**
     * Display public wishlist at /w/{username}.
     */
    public function show(Request $request, string $username): Response
    {
        $normalizedUsername = Str::lower($username);

        $user = User::query()
            ->where(function ($query) use ($username, $normalizedUsername): void {
                $query->where('username_lower', $normalizedUsername)
                    ->orWhere('username', $username)
                    ->orWhereRaw('LOWER(username) = ?', [$normalizedUsername]);
            })
            ->firstOrFail();

        $authUser = $request->user();

        // Check if viewer is blocked
        if ($authUser !== null && $authUser->hasBlockRelationshipWith($user)) {
            return Inertia::render('Profile/Blocked', [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'display_name' => $user->display_name,
                    'avatar_url' => $user->avatar_url,
                ],
                'blocked' => [
                    'viewer_has_blocked' => $authUser->isBlocking($user),
                    'profile_has_blocked_viewer' => $authUser->isBlockedBy($user),
                ],
                'message' => __('This profile is not available at this time.'),
            ]);
        }

        $items = $user->wishlistItems()
            ->active()
            ->whereNotNull('approved_at')
            ->with(['creator', 'purchases.buyer'])
            ->orderByDesc('created_at')
            ->get();

        // Calculate stats
        $totalRaised = $items->sum(function ($item) {
            if ($item->is_crowdfunded) {
                return $item->current_funding;
            }
            // For fixed items, sum completed purchases
            $completedPurchases = $item->relationLoaded('purchases')
                ? $item->purchases->where('status', 'completed')
                : $item->purchases()->where('status', 'completed')->get();

            return $completedPurchases->sum('amount');
        });

        $allPurchases = $items->flatMap(function ($item) {
            return $item->relationLoaded('purchases')
                ? $item->purchases->where('status', 'completed')
                : $item->purchases()->where('status', 'completed')->get();
        });

        $totalContributors = $allPurchases->pluck('buyer_id')->unique()->count();

        $fulfilledItems = $items->filter(function ($item) {
            if ($item->is_crowdfunded) {
                return $item->current_funding >= ($item->goal_amount ?? 0);
            }

            return $item->remaining_quantity !== null && $item->remaining_quantity <= 0;
        })->count();

        return Inertia::render('Profile/Wishlist', [
            'profile' => [
                'display_name' => $user->display_name ?? $user->username,
                'handle' => '@'.$user->username,
                'cover_image' => $user->cover_url,
                'avatar_url' => $user->avatar_url,
            ],
            'items' => WishlistItemResource::collection($items)
                ->toResponse($request)
                ->getData(true),
            'stats' => [
                'total_items' => $items->count(),
                'total_raised' => $totalRaised,
                'total_contributors' => $totalContributors,
                'fulfilled_items' => $fulfilledItems,
            ],
        ]);
    }
}
