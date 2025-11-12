<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;

class ConversationPolicy
{
    /**
     * Determine whether the user can view any conversations.
     */
    public function viewAny(User $user): bool
    {
        return $user->profile_completed_at !== null;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        $participant = $this->participant($user, $conversation);

        return $participant !== null && $participant->left_at === null;
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
    public function update(User $user, Conversation $conversation): bool
    {
        $participant = $this->participant($user, $conversation);

        if ($participant === null || $participant->left_at !== null) {
            return false;
        }

        return in_array($participant->role, ['owner', 'moderator'], true);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Conversation $conversation): bool
    {
        return $this->update($user, $conversation);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Conversation $conversation): bool
    {
        return $this->update($user, $conversation);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Conversation $conversation): bool
    {
        return false;
    }

    public function addParticipants(User $user, Conversation $conversation): bool
    {
        if ($conversation->isDirect()) {
            return false;
        }

        return $this->update($user, $conversation);
    }

    public function removeParticipants(User $user, Conversation $conversation): bool
    {
        if ($conversation->isDirect()) {
            return false;
        }

        return $this->update($user, $conversation);
    }

    public function leave(User $user, Conversation $conversation): bool
    {
        $participant = $this->participant($user, $conversation);

        return $participant !== null && $participant->left_at === null;
    }

    protected function participant(User $user, Conversation $conversation): ?ConversationParticipant
    {
        $relation = $conversation->participants()
            ->where('user_id', $user->getKey())
            ->first();

        return $relation instanceof ConversationParticipant ? $relation : null;
    }
}
