<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Resources\CircleResource;
use App\Models\User;
use App\Services\UserFollowService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $circleMemberships = CircleResource::collection(
            $request->user()
                ->circles()
                ->with([
                    'interest',
                    'facets' => fn ($query) => $query->orderBy('sort_order'),
                ])
                ->orderBy('name')
                ->get()
        )->resolve($request);

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'circleMemberships' => $circleMemberships,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $attributes = $request->validated();
        $originalRequiresApproval = (bool) $request->user()->getOriginal('requires_follow_approval');

        if (array_key_exists('requires_follow_approval', $attributes)) {
            $attributes['requires_follow_approval'] = $request->boolean('requires_follow_approval');
        }

        $request->user()->fill($attributes);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        if ($originalRequiresApproval && ! $request->user()->requires_follow_approval) {
            $this->approvePendingFollowers($request->user());
        }

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
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
