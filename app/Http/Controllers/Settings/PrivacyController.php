<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PrivacyUpdateRequest;
use App\Models\User;
use App\Services\UserFollowService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrivacyController extends Controller
{
    /**
     * Show the user's privacy settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/privacy', [
            'requiresFollowApproval' => $user->requires_follow_approval,
        ]);
    }

    /**
     * Update the user's privacy settings.
     */
    public function update(PrivacyUpdateRequest $request): RedirectResponse
    {
        $attributes = $request->validated();
        $originalRequiresApproval = (bool) $request->user()->getOriginal('requires_follow_approval');

        if (array_key_exists('requires_follow_approval', $attributes)) {
            $attributes['requires_follow_approval'] = $request->boolean('requires_follow_approval');
        }

        $request->user()->fill($attributes);
        $request->user()->save();

        if ($originalRequiresApproval && ! $request->user()->requires_follow_approval) {
            $this->approvePendingFollowers($request->user());
        }

        return to_route('settings.privacy.edit');
    }

    private function approvePendingFollowers(User $user): void
    {
        $pendingFollowers = $user->pendingFollowers()->get();
        $followService = app(UserFollowService::class);

        foreach ($pendingFollowers as $pendingFollower) {
            if ($user->hasBlockRelationshipWith($pendingFollower)) {
                continue;
            }

            try {
                $followService->accept($user, $pendingFollower);
            } catch (AuthorizationException) {
                continue;
            }
        }
    }
}
