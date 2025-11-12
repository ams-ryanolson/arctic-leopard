<?php

namespace App\Support\Mocks\Signals;

class AudienceMock
{
    /**
     * @return array{
     *     growth: array<string, mixed>,
     *     engagementScatter: array<int, array<string, mixed>>,
     *     circleLoad: array<int, array<string, mixed>>,
     *     moderationLoad: array<int, array<string, mixed>>
     * }
     */
    public static function data(): array
    {
        return [
            'growth' => [
                'labels' => ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                'series' => [
                    [
                        'name' => 'Follower Growth',
                        'values' => [420, 480, 560, 610, 680],
                    ],
                    [
                        'name' => 'Active Members',
                        'values' => [180, 205, 240, 268, 295],
                    ],
                ],
            ],
            'engagementScatter' => [
                [
                    'circle' => 'Edge Guardians',
                    'x' => 62,
                    'y' => 88,
                    'size' => 32,
                ],
                [
                    'circle' => 'Breath Control Lab',
                    'x' => 54,
                    'y' => 72,
                    'size' => 26,
                ],
                [
                    'circle' => 'Wax Alchemy Society',
                    'x' => 71,
                    'y' => 64,
                    'size' => 22,
                ],
                [
                    'circle' => 'Impact Theory',
                    'x' => 48,
                    'y' => 58,
                    'size' => 18,
                ],
            ],
            'circleLoad' => [
                [
                    'name' => 'Edge Guardians',
                    'members' => 1280,
                    'moderators' => 8,
                    'capacity' => 0.84,
                ],
                [
                    'name' => 'Wax Alchemy Society',
                    'members' => 740,
                    'moderators' => 5,
                    'capacity' => 0.68,
                ],
                [
                    'name' => 'Breath Control Lab',
                    'members' => 520,
                    'moderators' => 4,
                    'capacity' => 0.91,
                ],
                [
                    'name' => 'Impact Theory',
                    'members' => 610,
                    'moderators' => 3,
                    'capacity' => 0.56,
                ],
            ],
            'moderationLoad' => [
                [
                    'name' => 'Open Incidents',
                    'value' => 12,
                    'threshold' => 10,
                ],
                [
                    'name' => 'Average Resolution Time',
                    'value' => 4.2,
                    'unit' => 'hours',
                    'threshold' => 6,
                ],
                [
                    'name' => 'Escalations',
                    'value' => 3,
                    'threshold' => 4,
                ],
            ],
        ];
    }
}





