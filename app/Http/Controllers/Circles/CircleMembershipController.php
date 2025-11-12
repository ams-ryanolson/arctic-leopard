<?php

namespace App\Http\Controllers\Circles;

use App\Http\Controllers\Controller;
use App\Http\Requests\Circles\JoinCircleRequest;
use App\Http\Resources\CircleResource;
use App\Models\Circle;
use App\Services\Circles\CircleMembershipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CircleMembershipController extends Controller
{
    /**
     * Join the given circle.
     */
    public function store(
        JoinCircleRequest $request,
        Circle $circle,
        CircleMembershipService $membershipService,
    ): JsonResponse|RedirectResponse {
        $this->authorize('join', $circle);

        $user = $request->user();

        $membershipService->join($circle, $user, $request->validated());

        $circle->load([
            'interest',
            'facets' => fn ($query) => $query->orderByDesc('is_default')->orderBy('sort_order'),
        ])->loadCount('members as members_count');

        $circle->load([
            'members' => fn ($members) => $members
                ->select('users.id')
                ->where('user_id', $user->getKey()),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'circle' => (new CircleResource($circle))->toArray($request),
            ]);
        }

        return back()->with('flash', [
            'type' => 'success',
            'message' => __('You joined :name.', ['name' => $circle->name]),
        ]);
    }

    /**
     * Leave the supplied circle.
     */
    public function destroy(
        Request $request,
        Circle $circle,
        CircleMembershipService $membershipService,
    ): JsonResponse|RedirectResponse {
        $this->authorize('leave', $circle);

        $membershipService->leave($circle, $request->user());

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'left',
            ]);
        }

        return back()->with('flash', [
            'type' => 'info',
            'message' => __('You left :name.', ['name' => $circle->name]),
        ]);
    }
}
