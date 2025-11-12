<?php

namespace App\Models;

use App\Events\UserBlocked;
use App\Events\UserUnblocked;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBlock extends Model
{
    /** @use HasFactory<\Database\Factories\UserBlockFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::created(function (UserBlock $block): void {
            event(new UserBlocked($block));
        });

        static::deleted(function (UserBlock $block): void {
            event(new UserUnblocked($block));
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'blocker_id',
        'blocked_id',
        'reason',
        'notes',
        'expires_at',
        'meta',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    /**
     * Scope blocks between two users regardless of direction.
     *
     * @param  Builder<UserBlock>  $query
     * @return Builder<UserBlock>
     */
    public function scopeBetweenUsers(Builder $query, User|int $first, User|int $second): Builder
    {
        $firstId = $first instanceof User ? $first->getKey() : $first;
        $secondId = $second instanceof User ? $second->getKey() : $second;

        return $query->where(function (Builder $builder) use ($firstId, $secondId): void {
            $builder->where(function (Builder $direction) use ($firstId, $secondId): void {
                $direction->where('blocker_id', $firstId)
                    ->where('blocked_id', $secondId);
            })->orWhere(function (Builder $direction) use ($firstId, $secondId): void {
                $direction->where('blocker_id', $secondId)
                    ->where('blocked_id', $firstId);
            });
        });
    }

    /**
     * The user who initiated the block.
     *
     * @return BelongsTo<User, UserBlock>
     */
    public function blocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocker_id');
    }

    /**
     * The user being blocked.
     *
     * @return BelongsTo<User, UserBlock>
     */
    public function blocked(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_id');
    }
}
