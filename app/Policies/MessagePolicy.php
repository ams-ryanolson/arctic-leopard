<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->profile_completed_at !== null;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Message $message): bool
    {
        return $message->conversation
            ->participants()
            ->where('user_id', $user->getKey())
            ->whereNull('left_at')
            ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->profile_completed_at !== null;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Message $message): bool
    {
        return $this->owns($user, $message) || $this->moderatesConversation($user, $message);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Message $message): bool
    {
        return $this->update($user, $message);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Message $message): bool
    {
        return $this->update($user, $message);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Message $message): bool
    {
        return false;
    }

    public function undo(User $user, Message $message): bool
    {
        if (! $this->owns($user, $message)) {
            return false;
        }

        return $message->isUndoable();
    }

    protected function owns(User $user, Message $message): bool
    {
        return $message->user_id !== null && (int) $message->user_id === (int) $user->getKey();
    }

    protected function moderatesConversation(User $user, Message $message): bool
    {
        return $message->conversation
            ->participants()
            ->where('user_id', $user->getKey())
            ->whereNull('left_at')
            ->whereIn('role', ['owner', 'moderator'])
            ->exists();
    }
}
