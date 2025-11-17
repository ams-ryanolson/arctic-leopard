<?php

namespace App\Enums\Concerns;

trait HasValues
{
    /**
     * Retrieve all enum values.
     *
     * @return list<string|int>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $case) => $case->value,
            self::cases()
        );
    }
}
