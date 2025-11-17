<?php

namespace App\Support\Mocks\Signals;

class SubscriptionsMock
{
    /**
     * @return array{
     *     plans: array<int, array<string, mixed>>,
     *     planForm: array<string, mixed>,
     *     cohorts: array<int, array<string, mixed>>,
     *     churnFunnel: array<int, array<string, mixed>>,
     *     recentEvents: array<int, array<string, mixed>>,
     *     quickActions: array<int, array<string, mixed>>
     * }
     */
    public static function data(): array
    {
        return [
            'plans' => [
                [
                    'id' => 'plan-founders',
                    'name' => 'Founders Circle',
                    'price' => '$65/mo',
                    'members' => 318,
                    'status' => 'active',
                    'visibility' => 'Invite-only',
                ],
                [
                    'id' => 'plan-dungeon',
                    'name' => 'Dungeon Keyholder',
                    'price' => '$28/mo',
                    'members' => 1_120,
                    'status' => 'active',
                    'visibility' => 'Public',
                ],
                [
                    'id' => 'plan-backstage',
                    'name' => 'Backstage Access',
                    'price' => '$12/mo',
                    'members' => 2_460,
                    'status' => 'active',
                    'visibility' => 'Public',
                ],
                [
                    'id' => 'plan-premier',
                    'name' => 'Premier Scene Drops',
                    'price' => '$95/mo',
                    'members' => 84,
                    'status' => 'draft',
                    'visibility' => 'Invite-only',
                ],
            ],
            'planForm' => [
                'defaults' => [
                    'name' => 'New ritual tier',
                    'price' => 45,
                    'currency' => 'USD',
                    'billingCadence' => 'monthly',
                    'visibility' => 'invite-only',
                    'description' => 'Unlock exclusive scene rehearsals, backstage commentary, and aftercare breakdowns.',
                    'perks' => [
                        'Weekly ritual drop',
                        'Live Q&A once per month',
                        'Private aftercare audio library',
                    ],
                ],
                'cadenceOptions' => ['monthly', 'quarterly', 'annual'],
                'visibilityOptions' => [
                    ['label' => 'Public', 'value' => 'public'],
                    ['label' => 'Invite-only', 'value' => 'invite-only'],
                ],
            ],
            'cohorts' => [
                [
                    'month' => 'July',
                    'newSubscribers' => 420,
                    'retention' => 0.78,
                    'arpu' => 62.45,
                ],
                [
                    'month' => 'August',
                    'newSubscribers' => 465,
                    'retention' => 0.74,
                    'arpu' => 59.12,
                ],
                [
                    'month' => 'September',
                    'newSubscribers' => 502,
                    'retention' => 0.81,
                    'arpu' => 64.28,
                ],
                [
                    'month' => 'October',
                    'newSubscribers' => 548,
                    'retention' => 0.84,
                    'arpu' => 66.91,
                ],
            ],
            'churnFunnel' => [
                ['stage' => 'Active', 'value' => 100, 'delta' => '+6%'],
                ['stage' => 'Expiring', 'value' => 18, 'delta' => '-3%'],
                ['stage' => 'Churned', 'value' => 9, 'delta' => '-1%'],
            ],
            'recentEvents' => [
                [
                    'id' => 'sub-event-1',
                    'type' => 'upgrade',
                    'member' => 'Atlas Vega',
                    'plan' => 'Founders Circle',
                    'value' => 120,
                    'occurredAt' => now()->subMinutes(9)->toIso8601String(),
                ],
                [
                    'id' => 'sub-event-2',
                    'type' => 'downgrade',
                    'member' => 'Nova Quinn',
                    'plan' => 'Core Access',
                    'value' => 45,
                    'occurredAt' => now()->subMinutes(41)->toIso8601String(),
                ],
                [
                    'id' => 'sub-event-3',
                    'type' => 'new',
                    'member' => 'Silas Marron',
                    'plan' => 'Edge Guardians Elite',
                    'value' => 85,
                    'occurredAt' => now()->subHours(3)->toIso8601String(),
                ],
            ],
            'quickActions' => [
                [
                    'id' => 'sub-action-1',
                    'label' => 'Launch retention drip',
                    'description' => 'Target expiring cohort with a three-message re-engagement flow.',
                    'severity' => 'high',
                ],
                [
                    'id' => 'sub-action-2',
                    'label' => 'Comp VIP renewal',
                    'description' => 'Offer 30-day complimentary upgrade to prevent churn in top supporters.',
                    'severity' => 'medium',
                ],
                [
                    'id' => 'sub-action-3',
                    'label' => 'DM new Founders',
                    'description' => 'Send personal welcome to the last 15 Founders Circle members.',
                    'severity' => 'low',
                ],
            ],
        ];
    }
}
