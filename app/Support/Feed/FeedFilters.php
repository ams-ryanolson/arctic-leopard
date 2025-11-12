<?php

namespace App\Support\Feed;

use App\Enums\PostAudience;
use App\Enums\PostType;

class FeedFilters
{
    /**
     * @return array{
     *     types: array<int, array{value: string, label: string}>,
     *     audiences: array<int, array{value: string, label: string}>,
     *     time_ranges: array<int, array{value: string, label: string}>,
     *     sort: array<int, array{value: string, label: string}>,
     *     media: array<int, array{value: string, label: string}>
     * }
     */
    public static function defaults(): array
    {
        return [
            'types' => collect(PostType::cases())
                ->map(static fn (PostType $type) => [
                    'value' => $type->value,
                    'label' => $type->name,
                ])
                ->values()
                ->all(),
            'audiences' => collect(PostAudience::cases())
                ->map(static fn (PostAudience $audience) => [
                    'value' => $audience->value,
                    'label' => $audience->name,
                ])
                ->values()
                ->all(),
            'time_ranges' => [
                ['value' => '24h', 'label' => 'Last 24 hours'],
                ['value' => '7d', 'label' => 'Last 7 days'],
                ['value' => '30d', 'label' => 'Last 30 days'],
            ],
            'sort' => [
                ['value' => 'latest', 'label' => 'Latest'],
                ['value' => 'top', 'label' => 'Top'],
            ],
            'media' => [
                ['value' => 'has_media', 'label' => 'Only posts with media'],
                ['value' => 'live', 'label' => 'Live or scheduled scenes'],
            ],
        ];
    }
}

