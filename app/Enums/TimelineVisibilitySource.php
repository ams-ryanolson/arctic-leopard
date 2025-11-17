<?php

namespace App\Enums;

enum TimelineVisibilitySource: string
{
    case SelfAuthored = 'self';
    case Following = 'following';
    case Subscription = 'subscription';
    case PaywallPurchase = 'paywall';
    case System = 'system';
    case Boost = 'boost';

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
