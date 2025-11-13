<?php

namespace App\Policies;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function viewAny(?User $user): bool
    {
        // Allow public viewing of events
        if ($user === null) {
            return true;
        }

        // Admins can always view events (including in admin context)
        if ($user->hasRole(['Admin', 'Super Admin']) || $user->can('manage events')) {
            return true;
        }

        // Regular users can view public events
        return true;
    }

    public function view(?User $user, Event $event): bool
    {
        if ($event->status === EventStatus::Published) {
            return true;
        }

        if ($user === null) {
            return false;
        }

        if ($user->can('manage events')) {
            return true;
        }

        $userId = $user->getKey();

        if ((int) $event->manager_id === (int) $userId) {
            return true;
        }

        if ((int) $event->created_by_id === (int) $userId) {
            return true;
        }

        if ((int) $event->submitted_by_id === (int) $userId) {
            return true;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('manage events');
    }

    public function submit(User $user): bool
    {
        return $user->profile_completed_at !== null;
    }

    public function update(User $user, Event $event): bool
    {
        if ($user->can('manage events')) {
            return true;
        }

        return (int) $event->manager_id === (int) $user->getKey();
    }

    public function delete(User $user, Event $event): bool
    {
        return $user->can('manage events');
    }

    public function restore(User $user, Event $event): bool
    {
        return $user->can('manage events');
    }

    public function forceDelete(User $user, Event $event): bool
    {
        return $user->can('manage events');
    }

    public function approve(User $user, Event $event): bool
    {
        return $user->can('manage events');
    }

    public function publish(User $user, Event $event): bool
    {
        return $user->can('manage events');
    }

    public function manageRsvps(User $user, Event $event): bool
    {
        if ($user->can('manage events')) {
            return true;
        }

        return (int) $event->manager_id === (int) $user->getKey();
    }

    public function cancel(User $user, Event $event): bool
    {
        if ($user->can('manage events')) {
            return true;
        }

        return (int) $event->manager_id === (int) $user->getKey();
    }
}
