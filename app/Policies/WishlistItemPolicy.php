<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Wishlists\WishlistItem;

class WishlistItemPolicy
{
    /**
     * Determine whether the user can view any models.
     * Anyone can view public wishlists.
     */
    public function viewAny(?User $user = null): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     * Public items visible to all, private data to creator only.
     */
    public function view(?User $user, WishlistItem $wishlistItem): bool
    {
        // Anyone can view active wishlist items
        return $wishlistItem->status->value === 'active' && $wishlistItem->is_active;
    }

    /**
     * Determine whether the user can create models.
     * Any authenticated user can create (for themselves).
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     * Only creator can update.
     */
    public function update(User $user, WishlistItem $wishlistItem): bool
    {
        return $user->getKey() === $wishlistItem->creator_id;
    }

    /**
     * Determine whether the user can delete the model.
     * Only creator can delete.
     */
    public function delete(User $user, WishlistItem $wishlistItem): bool
    {
        return $user->getKey() === $wishlistItem->creator_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, WishlistItem $wishlistItem): bool
    {
        return $user->getKey() === $wishlistItem->creator_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, WishlistItem $wishlistItem): bool
    {
        return $user->getKey() === $wishlistItem->creator_id;
    }

    /**
     * Determine whether the user can view contributors.
     * Only creator can view contributors.
     */
    public function viewContributors(User $user, WishlistItem $wishlistItem): bool
    {
        return $user->getKey() === $wishlistItem->creator_id;
    }
}
