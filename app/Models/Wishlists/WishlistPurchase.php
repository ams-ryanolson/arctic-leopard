<?php

namespace App\Models\Wishlists;

use App\Enums\Payments\WishlistPurchaseStatus;
use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WishlistPurchase extends Model
{
    use GeneratesUuid;
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => WishlistPurchaseStatus::class,
            'covers_fee' => 'boolean',
            'metadata' => 'array',
            'fulfilled_at' => 'datetime',
        ];
    }

    protected static function newFactory()
    {
        return \Database\Factories\Wishlists\WishlistPurchaseFactory::new();
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(WishlistItem::class, 'wishlist_item_id');
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
