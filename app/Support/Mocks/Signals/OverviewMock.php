<?php

namespace App\Support\Mocks\Signals;

class OverviewMock
{
    /**
     * @return array{
     *     headline: string,
     *     subheading: string,
     *     highlights: array<int, array<string, string>>,
     *     metrics: array<int, array<string, string>>,
     *     tutorials: array<int, array<string, string>>
     * }
     */
    public static function data(): array
    {
        return [
            'headline' => 'Signals is your creator operations command center.',
            'subheading' => 'Keep tabs on monetization, compliance, payouts, and growth from a single workspace.',
            'highlights' => [
                [
                    'title' => 'Custom playbooks',
                    'body' => 'Trigger automations based on tipping surges, compliance deadlines, or subscriber milestones.',
                ],
                [
                    'title' => 'Live monetization insights',
                    'body' => 'Track daily sales velocity and campaign momentum at a glance.',
                ],
                [
                    'title' => 'Actionable tutorials',
                    'body' => 'Learn proven rituals for increasing retention, handling disputes, and scaling collaborations.',
                ],
            ],
            'metrics' => [
                [
                    'label' => 'Daily sales',
                    'value' => '$7,820',
                    'delta' => '+18% vs yesterday',
                ],
                [
                    'label' => 'Tips in last hour',
                    'value' => '$1,260',
                    'delta' => 'Surge active',
                ],
                [
                    'label' => 'New subscribers',
                    'value' => '86',
                    'delta' => '+12% vs last week',
                ],
            ],
            'tutorials' => [
                [
                    'title' => 'Design a tip-train with retention hooks',
                    'duration' => '5 min watch',
                    'category' => 'Monetization ritual',
                    'href' => '#',
                ],
                [
                    'title' => 'KYC renewals without downtime',
                    'duration' => '3 min read',
                    'category' => 'Compliance playbook',
                    'href' => '#',
                ],
                [
                    'title' => 'Welcome flow automations that convert',
                    'duration' => '8 min workshop',
                    'category' => 'Audience growth',
                    'href' => '#',
                ],
            ],
        ];
    }
}
