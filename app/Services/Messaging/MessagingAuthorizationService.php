<?php

namespace App\Services\Messaging;

use App\Models\AdminSetting;
use App\Models\User;
use App\Services\Payments\EntitlementService;

class MessagingAuthorizationService
{
    public function __construct(
        private readonly EntitlementService $entitlements,
    ) {}

    /**
     * Determine if a viewer can send a message to a target user.
     *
     * @param  User|null  $viewer  The user attempting to send the message (null if not authenticated)
     * @param  User  $target  The user who would receive the message
     */
    public function canMessage(?User $viewer, User $target): bool
    {
        // Cannot message if not authenticated
        if ($viewer === null) {
            return false;
        }

        // Cannot message yourself
        if ($viewer->is($target)) {
            return false;
        }

        // Cannot message if blocked relationship exists
        if ($viewer->hasBlockRelationshipWith($target)) {
            return false;
        }

        // Get target's messaging preferences (or defaults)
        $preferences = $target->getMessagingPreferences();

        // Check subscriber override: If target allows subscriber messages AND Signals feature enabled
        // AND viewer subscribes to target → allow
        if ($preferences->allow_subscriber_messages) {
            $signalsEnabled = (bool) AdminSetting::get('feature_signals_enabled', false);

            if ($signalsEnabled && $viewer->subscribesToUser($target)) {
                return true;
            }
        }

        // Check message request mode
        return match ($preferences->message_request_mode) {
            'no-one' => false,
            'everyone' => true,
            'verified' => $target->isIdVerified(),
            'following' => $viewer->isFollowing($target),
            'verified-and-following' => $target->isIdVerified() && $viewer->isFollowing($target),
            default => false,
        };
    }
}
