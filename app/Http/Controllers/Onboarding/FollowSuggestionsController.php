<?php

namespace App\Http\Controllers\Onboarding;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FollowSuggestionsController
{
    /**
     * Display the follow suggestions onboarding step.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('onboarding.start');
        }

        $userModel = new User;
        $followTable = config('follow.followables_table', 'followables');
        $followUserKey = config('follow.user_foreign_key', 'user_id');

        $suggestedUsers = User::query()
            ->excludeBlockedFor($user)
            ->whereNot('id', $user->id)
            ->whereNotIn('id', function ($query) use ($user, $userModel, $followTable, $followUserKey) {
                $query->select('followable_id')
                    ->from($followTable)
                    ->where('followable_type', $userModel->getMorphClass())
                    ->where($followUserKey, $user->id);
            })
            ->whereNotNull('display_name')
            ->inRandomOrder()
            ->limit(12)
            ->get([
                'id',
                'username',
                'display_name',
                'pronouns',
                'bio',
                'avatar_path',
                'cover_path',
            ])
            ->map(function (User $suggestedUser) {
                return [
                    'id' => $suggestedUser->id,
                    'username' => $suggestedUser->username,
                    'display_name' => $suggestedUser->display_name,
                    'pronouns' => $suggestedUser->pronouns,
                    'bio' => $suggestedUser->bio,
                    'avatar_url' => $suggestedUser->avatar_url,
                    'cover_url' => $suggestedUser->cover_url,
                ];
            });

        return Inertia::render('Onboarding/FollowSuggestions', [
            'suggestedUsers' => $suggestedUsers,
        ]);
    }
}
