<?php

namespace App\Support\Mocks\Signals;

class MonetizationMock
{
    /**
     * @return array{
     *     tipTrains: array<int, array<string, mixed>>,
     *     tipActivity: array<string, mixed>,
     *     revenueHeatmap: array<string, mixed>,
     *     topSupporters: array<int, array<string, mixed>>,
     *     productBreakdown: array<int, array<string, mixed>>,
     *     campaignForm: array<string, mixed>
     * }
     */
    public static function data(): array
    {
        return [
            'tipTrains' => [
                [
                    'id' => 'train-guardians',
                    'name' => 'Edge Guardians Tip Train',
                    'status' => 'peaking',
                    'goal' => '$12,000',
                    'progress' => 0.93,
                    'match' => '2x match active',
                    'contributors' => 482,
                    'lift' => '+38%',
                ],
                [
                    'id' => 'train-silver',
                    'name' => 'Silver Collar Revival',
                    'status' => 'live',
                    'goal' => '$20,000',
                    'progress' => 0.72,
                    'match' => 'First 200 supporters get 1:1 thank you',
                    'contributors' => 296,
                    'lift' => '+22%',
                ],
                [
                    'id' => 'train-wax',
                    'name' => 'Wax Alchemy VIP Doors',
                    'status' => 'scheduled',
                    'goal' => '$8,000',
                    'progress' => 0.18,
                    'match' => 'Unlocks Friday studio session',
                    'contributors' => 74,
                    'lift' => 'Projected +14%',
                ],
            ],
            'tipActivity' => [
                'summary' => [
                    'dailyTotal' => '$7,820',
                    'averageTip' => '$48',
                    'largestTip' => '$320 from Atlas Vega',
                ],
                'recent' => [
                    [
                        'supporter' => 'Atlas Vega',
                        'amount' => '$180',
                        'message' => 'Edge Guardians forever.',
                        'occurredAt' => now()->subMinutes(10)->toIso8601String(),
                    ],
                    [
                        'supporter' => 'Nova Quinn',
                        'amount' => '$95',
                        'message' => 'Funding the custom rope 🎀',
                        'occurredAt' => now()->subMinutes(22)->toIso8601String(),
                    ],
                    [
                        'supporter' => 'Rene Kade',
                        'amount' => '$240',
                        'message' => 'Camera rig upgrade incoming.',
                        'occurredAt' => now()->subMinutes(41)->toIso8601String(),
                    ],
                ],
            ],
            'revenueHeatmap' => [
                'days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                'hours' => ['09a', '12p', '3p', '6p', '9p', '12a'],
                'values' => [
                    [12, 18, 26, 34, 41, 17],
                    [14, 22, 31, 45, 54, 21],
                    [16, 24, 29, 52, 63, 28],
                    [15, 21, 28, 49, 59, 25],
                    [19, 28, 36, 57, 68, 31],
                    [25, 34, 48, 63, 72, 39],
                    [28, 37, 52, 68, 81, 44],
                ],
            ],
            'topSupporters' => [
                [
                    'name' => 'Atlas Vega',
                    'avatar' => 'https://api.dicebear.com/7.x/thumbs/svg?seed=Atlas',
                    'lifetimeValue' => 1820,
                    'lastContribution' => now()->subMinutes(12)->toIso8601String(),
                ],
                [
                    'name' => 'Nova Quinn',
                    'avatar' => 'https://api.dicebear.com/7.x/thumbs/svg?seed=Nova',
                    'lifetimeValue' => 1675,
                    'lastContribution' => now()->subMinutes(47)->toIso8601String(),
                ],
                [
                    'name' => 'Rene Kade',
                    'avatar' => 'https://api.dicebear.com/7.x/thumbs/svg?seed=Rene',
                    'lifetimeValue' => 1540,
                    'lastContribution' => now()->subHours(2)->toIso8601String(),
                ],
            ],
            'productBreakdown' => [
                [
                    'product' => 'Founders Circle',
                    'share' => 0.38,
                    'mrr' => 16280,
                ],
                [
                    'product' => 'Edge Guardians Elite',
                    'share' => 0.26,
                    'mrr' => 11140,
                ],
                [
                    'product' => 'Tip Trains',
                    'share' => 0.19,
                    'mrr' => 8120,
                ],
                [
                    'product' => 'Pay-per-Scene',
                    'share' => 0.17,
                    'mrr' => 7480,
                ],
            ],
            'campaignForm' => [
                'defaults' => [
                    'name' => 'Aftercare Gratitude Drive',
                    'goal' => 6000,
                    'startAt' => now()->addDay()->toIso8601String(),
                    'duration' => '48 hours',
                    'match' => 'Auto-match up to $2,000',
                    'benefits' => [
                        'Custom aftercare audio for top supporters',
                        'Live gratitude stream on Sunday night',
                    ],
                ],
            ],
        ];
    }
}
