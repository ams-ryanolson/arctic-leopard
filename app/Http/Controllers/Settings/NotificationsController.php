<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\NotificationsUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    /**
     * Show the user's notification preferences page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $preferences = $user->notificationPreferences;

        // Create default preferences if they don't exist
        if (! $preferences) {
            $preferences = $user->notificationPreferences()->create([
                'follows' => true,
                'follow_requests' => true,
                'follow_approvals' => true,
                'post_likes' => true,
                'post_bookmarks' => true,
                'messages' => true,
                'comments' => true,
                'replies' => true,
            ]);
        }

        return Inertia::render('settings/notifications', [
            'preferences' => [
                'follows' => $preferences->follows,
                'follow_requests' => $preferences->follow_requests,
                'follow_approvals' => $preferences->follow_approvals,
                'post_likes' => $preferences->post_likes,
                'post_bookmarks' => $preferences->post_bookmarks,
                'messages' => $preferences->messages,
                'comments' => $preferences->comments,
                'replies' => $preferences->replies,
            ],
        ]);
    }

    /**
     * Update the user's notification preferences.
     */
    public function update(NotificationsUpdateRequest $request): RedirectResponse
    {
        $preferences = $request->user()->notificationPreferences;

        if (! $preferences) {
            $preferences = $request->user()->notificationPreferences()->create([]);
        }

        $preferences->update($request->validated());

        return to_route('settings.notifications.edit');
    }
}
