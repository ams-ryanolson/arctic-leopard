<?php

namespace App\Enums;

enum PostAudience: string
{
    case Public = 'public';
    case Followers = 'followers';
    case Subscribers = 'subscribers';
    case PayToView = 'pay_to_view';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $case): string => $case->value,
            self::cases()
        );
    }
}
