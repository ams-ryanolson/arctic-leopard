<?php

namespace App\Enums;

enum PollVotingMode: string
{
    case Single = 'single';
    case Multiple = 'multiple';

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
