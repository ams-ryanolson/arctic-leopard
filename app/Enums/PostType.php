<?php

namespace App\Enums;

enum PostType: string
{
    case Text = 'text';
    case Media = 'media';
    case Poll = 'poll';
    case System = 'system';

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
