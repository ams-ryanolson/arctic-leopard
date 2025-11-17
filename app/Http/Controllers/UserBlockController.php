<?php

namespace App\Http\Controllers;

use App\Http\Requests\Users\BlockUserRequest;
use App\Http\Requests\Users\UnblockUserRequest;
use App\Models\User;
use App\Services\UserBlockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserBlockController extends Controller
{
    public function index(Request $request): Response
    {
        abort_if(! config('block.enabled'), 404);

        /** @var User $user */
        $user = $request->user();

        $this->authorize('manageBlocklist', $user);

        $user->load([
            'blockedUsers' => fn ($query) => $query
                ->select(['users.id', 'users.username', 'users.display_name', 'users.avatar_path'])
                ->withCount('followers as followers_count'),
        ]);

        return Inertia::render('settings/blocked-users', [
            'blocked' => $user->blockedUsers->map(fn (User $blocked): array => [
                'id' => $blocked->getKey(),
                'username' => $blocked->username,
                'display_name' => $blocked->display_name,
                'avatar_url' => $blocked->avatar_url,
                'followers_count' => $blocked->followers_count ?? 0,
                'blocked_at' => optional($blocked->pivot?->created_at)->toIso8601String(),
            ]),
        ]);
    }

    public function store(
        BlockUserRequest $request,
        User $user,
        UserBlockService $blockService,
    ): JsonResponse|RedirectResponse {
        abort_if(! config('block.enabled'), 404);

        $blockService->block($request->user(), $user, $request->validated());

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'blocked',
            ]);
        }

        return back()->with('flash', [
            'type' => 'success',
            'message' => __('You blocked :username.', ['username' => $user->username]),
        ]);
    }

    public function destroy(
        UnblockUserRequest $request,
        User $user,
        UserBlockService $blockService,
    ): JsonResponse|RedirectResponse {
        abort_if(! config('block.enabled'), 404);

        $blockService->unblock($request->user(), $user);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'unblocked',
            ]);
        }

        return back()->with('flash', [
            'type' => 'info',
            'message' => __('You unblocked :username.', ['username' => $user->username]),
        ]);
    }
}
