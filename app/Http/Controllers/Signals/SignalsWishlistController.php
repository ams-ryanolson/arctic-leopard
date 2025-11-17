<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Http\Requests\Signals\StoreWishlistItemRequest;
use App\Http\Requests\Signals\UpdateWishlistItemRequest;
use App\Http\Resources\Wishlists\WishlistItemResource;
use App\Models\Wishlists\WishlistItem;
use App\Services\Payments\WishlistService;
use App\Services\Wishlists\WishlistAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SignalsWishlistController extends Controller
{
    public function __construct(
        private readonly WishlistService $wishlistService,
        private readonly WishlistAnalyticsService $analyticsService,
    ) {}

    /**
     * List creator's wishlist items (active, fulfilled, pending approval).
     */
    public function index(Request $request): JsonResponse|InertiaResponse
    {
        $user = $request->user();
        $status = $request->string('status', 'active')->toString();

        $query = WishlistItem::query()
            ->where('creator_id', $user->getKey())
            ->with(['creator', 'purchases' => fn ($q) => $q->where('status', 'completed')->with('buyer')]);

        match ($status) {
            'active' => $query->active(),
            'fulfilled' => $query->fulfilled(),
            'pending' => $query->pendingApproval(),
            'funded' => $query->funded(),
            default => $query->active(),
        };

        $items = $query->orderByDesc('created_at')->get();

        if ($request->wantsJson()) {
            return WishlistItemResource::collection($items)->toResponse($request);
        }

        return Inertia::render('Signals/Wishlist', [
            'items' => WishlistItemResource::collection($items)
                ->toResponse($request)
                ->getData(true),
            'analytics' => $this->analyticsService->getCreatorAnalytics($user->getKey()),
            'status' => $status,
        ]);
    }

    /**
     * Create new wishlist item.
     */
    public function store(StoreWishlistItemRequest $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $item = $this->wishlistService->createItem($user, $validated);
        $item->load(['creator', 'purchases']);

        if ($request->wantsJson()) {
            return (new WishlistItemResource($item))
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_CREATED);
        }

        return redirect()
            ->route('signals.wishlist.index')
            ->with('success', 'Wishlist item created successfully.');
    }

    /**
     * Update existing item.
     */
    public function update(UpdateWishlistItemRequest $request, WishlistItem $wishlistItem): JsonResponse|RedirectResponse
    {
        $this->authorize('update', $wishlistItem);

        $validated = $request->validated();
        $item = $this->wishlistService->updateItem($wishlistItem, $validated);
        $item->load(['creator', 'purchases']);

        if ($request->wantsJson()) {
            return (new WishlistItemResource($item))->toResponse($request);
        }

        return redirect()
            ->route('signals.wishlist.index')
            ->with('success', 'Wishlist item updated successfully.');
    }

    /**
     * Soft delete item.
     */
    public function destroy(Request $request, WishlistItem $wishlistItem): JsonResponse|RedirectResponse
    {
        $this->authorize('delete', $wishlistItem);

        $this->wishlistService->deleteItem($wishlistItem);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Wishlist item deleted successfully.']);
        }

        return redirect()
            ->route('signals.wishlist.index')
            ->with('success', 'Wishlist item deleted successfully.');
    }

    /**
     * Restore fulfilled item.
     */
    public function renew(Request $request, WishlistItem $wishlistItem): JsonResponse|RedirectResponse
    {
        $this->authorize('restore', $wishlistItem);

        $item = $this->wishlistService->renewItem($wishlistItem);
        $item->load(['creator', 'purchases']);

        if ($request->wantsJson()) {
            return (new WishlistItemResource($item))->toResponse($request);
        }

        return redirect()
            ->route('signals.wishlist.index')
            ->with('success', 'Wishlist item renewed successfully.');
    }

    /**
     * Get contributor list (private to creator).
     */
    public function contributors(Request $request, WishlistItem $wishlistItem): JsonResponse
    {
        $this->authorize('viewContributors', $wishlistItem);

        $limit = min($request->integer('limit', 10), 100);
        $contributors = $this->analyticsService->getTopContributors($wishlistItem, $limit);

        return response()->json([
            'data' => $contributors,
        ]);
    }

    /**
     * Get analytics data.
     */
    public function analytics(Request $request, WishlistItem $wishlistItem): JsonResponse
    {
        $this->authorize('viewContributors', $wishlistItem);

        $analytics = $this->analyticsService->getItemAnalytics($wishlistItem);

        return response()->json([
            'data' => $analytics,
        ]);
    }
}
