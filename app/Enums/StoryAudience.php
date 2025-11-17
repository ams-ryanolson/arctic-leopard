<?php

namespace App\Enums;

enum StoryAudience: string
{
    case Public = 'public';
    case Followers = 'followers';
    case Subscribers = 'subscribers';

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
