<?php

namespace App\Support\Mocks\Signals;

class StatsMock
{
    /**
     * Provides the mock payload for the Signals stats dashboard.
     *
     * @return array{
     *     alerts: array<int, array<string, mixed>>,
     *     metrics: array<int, array<string, mixed>>,
     *     monetizationTimeline: array<string, array<int, array<string, mixed>>>,
     *     consentQueue: array<int, array<string, mixed>>,
     *     payoutSummary: array<string, mixed>,
     *     recommendedAutomations: array<int, array<string, mixed>>
     * }
     */
    public static function data(): array
    {
        return [
            'alerts' => [
                [
                    'id' => 'alert-1',
                    'title' => 'Tip train surge',
                    'body' => 'Edge Guardians unlocked the 4K video stretch goal in 9 minutes.',
                    'timestamp' => now()->subMinutes(5)->toIso8601String(),
                    'severity' => 'hot',
                    'type' => 'monetization',
                ],
                [
                    'id' => 'alert-2',
                    'title' => 'Consent flag raised',
                    'body' => 'Breath Control Lab requested a moderator review for last night’s session log.',
                    'timestamp' => now()->subMinutes(22)->toIso8601String(),
                    'severity' => 'urgent',
                    'type' => 'compliance',
                ],
                [
                    'id' => 'alert-3',
                    'title' => 'New circle applications',
                    'body' => 'Wax Alchemy Society received 12 new submissions from your followers.',
                    'timestamp' => now()->subHour()->toIso8601String(),
                    'severity' => 'info',
                    'type' => 'community',
                ],
                [
                    'id' => 'alert-4',
                    'title' => 'Payout review',
                    'body' => 'Pending payout to Moonlight Studios requires tax doc confirmation.',
                    'timestamp' => now()->subMinutes(47)->toIso8601String(),
                    'severity' => 'urgent',
                    'type' => 'payout',
                ],
            ],
            'metrics' => [
                [
                    'id' => 'metric-mrr',
                    'label' => 'Monthly Recurring Revenue',
                    'value' => '$42,880',
                    'delta' => '+14.2%',
                    'trend' => [38, 37, 39, 42, 45, 44, 46],
                    'intent' => 'positive',
                ],
                [
                    'id' => 'metric-sla',
                    'label' => 'Response SLA',
                    'value' => '94m',
                    'delta' => '-11%',
                    'trend' => [132, 124, 117, 109, 104, 96, 94],
                    'intent' => 'positive',
                ],
                [
                    'id' => 'metric-payout',
                    'label' => 'Next Payout',
                    'value' => '$12,430',
                    'delta' => 'in 3 days',
                    'trend' => [9, 11, 10, 13, 12, 12, 13],
                    'intent' => 'neutral',
                ],
                [
                    'id' => 'metric-engagement',
                    'label' => 'Circle Engagement',
                    'value' => '78%',
                    'delta' => '+6 pts',
                    'trend' => [61, 63, 65, 68, 70, 73, 78],
                    'intent' => 'positive',
                ],
            ],
            'monetizationTimeline' => [
                'series' => [
                    [
                        'name' => 'Tips',
                        'values' => [
                            ['label' => '09:00', 'value' => 320],
                            ['label' => '12:00', 'value' => 540],
                            ['label' => '15:00', 'value' => 880],
                            ['label' => '18:00', 'value' => 640],
                            ['label' => '21:00', 'value' => 720],
                        ],
                    ],
                    [
                        'name' => 'Subscriptions',
                        'values' => [
                            ['label' => '09:00', 'value' => 180],
                            ['label' => '12:00', 'value' => 220],
                            ['label' => '15:00', 'value' => 260],
                            ['label' => '18:00', 'value' => 290],
                            ['label' => '21:00', 'value' => 310],
                        ],
                    ],
                ],
                'annotations' => [
                    [
                        'label' => 'Tip train launch',
                        'timestamp' => now()->subHours(4)->toIso8601String(),
                        'body' => 'Conversion boosted by 28% vs. prior sprint.',
                    ],
                ],
            ],
            'consentQueue' => [
                [
                    'id' => 'consent-1',
                    'circle' => 'Breath Control Lab',
                    'submittedBy' => 'Kai Storm',
                    'submittedAt' => now()->subMinutes(22)->toIso8601String(),
                    'status' => 'awaiting-review',
                    'severity' => 'high',
                ],
                [
                    'id' => 'consent-2',
                    'circle' => 'Impact Theory',
                    'submittedBy' => 'River Stone',
                    'submittedAt' => now()->subHour()->toIso8601String(),
                    'status' => 'investigating',
                    'severity' => 'medium',
                ],
                [
                    'id' => 'consent-3',
                    'circle' => 'Wax Alchemy Society',
                    'submittedBy' => 'Nova Quinn',
                    'submittedAt' => now()->subHours(3)->toIso8601String(),
                    'status' => 'resolved',
                    'severity' => 'low',
                ],
            ],
            'payoutSummary' => [
                'nextPayoutDate' => now()->addDays(3)->toDateString(),
                'nextPayoutAmount' => 12430,
                'pendingTransfers' => [
                    [
                        'label' => 'Edge Guardians',
                        'amount' => 3800,
                        'status' => 'scheduled',
                    ],
                    [
                        'label' => 'Moonlight Studios',
                        'amount' => 5420,
                        'status' => 'requires-action',
                    ],
                    [
                        'label' => 'Wax Alchemy Society',
                        'amount' => 3210,
                        'status' => 'scheduled',
                    ],
                ],
                'accountHealth' => [
                    'status' => 'attention',
                    'messages' => [
                        'Finalize tax form 1099 for Moonlight Studios payout',
                        'Confirm backup payout account before Friday',
                    ],
                ],
            ],
            'recommendedAutomations' => [
                [
                    'id' => 'auto-1',
                    'title' => 'Launch thank-you loop',
                    'description' => 'Queue a personalized video for top 10 contributors from the tip train surge.',
                    'impact' => 'Retention · High confidence',
                ],
                [
                    'id' => 'auto-2',
                    'title' => 'Escalate consent review',
                    'description' => 'Assign a senior moderator to Breath Control Lab and notify participants.',
                    'impact' => 'Safety · Time sensitive',
                ],
                [
                    'id' => 'auto-3',
                    'title' => 'Offer limited memberships',
                    'description' => 'Unlock 25 invite-only slots for Wax Alchemy Society applicants.',
                    'impact' => 'Growth · Medium effort',
                ],
            ],
        ];
    }
}
