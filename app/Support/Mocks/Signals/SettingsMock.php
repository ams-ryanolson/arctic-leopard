<?php

namespace App\Support\Mocks\Signals;

class SettingsMock
{
    /**
     * @return array{
     *     welcome: array<string, mixed>,
     *     profile: array<string, mixed>,
     *     notifications: array<int, array<string, mixed>>,
     *     automations: array<int, array<string, mixed>>
     * }
     */
    public static function data(): array
    {
        return [
            'welcome' => [
                'headline' => 'Signals settings keep your brand verified, responsive, and in control.',
                'subheadline' => 'Finish the creator onboarding checklist, confirm payout identity, and choose the alerts that matter most.',
                'steps' => [
                    [
                        'title' => 'Submit or refresh KYC documents',
                        'description' => 'Upload ID and business details so payouts stay uninterrupted.',
                        'status' => 'incomplete',
                    ],
                    [
                        'title' => 'Confirm notification channels',
                        'description' => 'Choose where you receive chargeback, tip train, and compliance notifications.',
                        'status' => 'in-progress',
                    ],
                    [
                        'title' => 'Enable automation playbooks',
                        'description' => 'Automate thank-you loops, dispute evidence reminders, and VIP outreach.',
                        'status' => 'complete',
                    ],
                ],
            ],
            'profile' => [
                'legalName' => 'Moonlight Studios LLC',
                'taxClassification' => 'LLC · Disregarded entity',
                'country' => 'United States',
                'kycStatus' => 'requires-update',
                'kycDue' => now()->addDays(5)->toDateString(),
                'contacts' => [
                    [
                        'name' => 'Riley Chen',
                        'role' => 'Compliance',
                        'email' => 'riley@moonlightstudios.com',
                        'phone' => '+1 (323) 555-0199',
                    ],
                    [
                        'name' => 'Atlas Vega',
                        'role' => 'Finance',
                        'email' => 'atlas@moonlightstudios.com',
                        'phone' => '+1 (323) 555-0104',
                    ],
                ],
            ],
            'notifications' => [
                [
                    'id' => 'notif-disputes',
                    'label' => 'Chargeback deadlines',
                    'description' => 'Alerts 48 hours and 12 hours before evidence is due.',
                    'channels' => ['Email', 'SMS'],
                    'enabled' => true,
                ],
                [
                    'id' => 'notif-tip-trains',
                    'label' => 'Tip train milestones',
                    'description' => 'Push notification and webhook when trains unlock new tiers.',
                    'channels' => ['Push', 'Webhook'],
                    'enabled' => true,
                ],
                [
                    'id' => 'notif-kyc',
                    'label' => 'KYC renewal reminders',
                    'description' => 'Weekly summaries of pending KYC and document requests.',
                    'channels' => ['Email'],
                    'enabled' => false,
                ],
            ],
            'automations' => [
                [
                    'id' => 'automation-thankyou',
                    'name' => 'Tip train thank-you series',
                    'description' => 'Send 3-part thank-you workflow to contributors after reaching 125% of goal.',
                    'enabled' => true,
                ],
                [
                    'id' => 'automation-disputes',
                    'name' => 'Dispute evidence reminders',
                    'description' => 'Ping finance Slack channel with checklist when new dispute enters queue.',
                    'enabled' => true,
                ],
                [
                    'id' => 'automation-vip',
                    'name' => 'VIP churn interception',
                    'description' => 'Auto-DM high spenders if they drop below 50% engagement for the week.',
                    'enabled' => false,
                ],
            ],
        ];
    }
}
