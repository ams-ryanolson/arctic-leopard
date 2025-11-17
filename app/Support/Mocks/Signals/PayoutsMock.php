<?php

namespace App\Support\Mocks\Signals;

class PayoutsMock
{
    /**
     * @return array{
     *     accounts: array<int, array<string, mixed>>,
     *     scheduleConfig: array<string, mixed>,
     *     manualWindow: array<string, mixed>,
     *     schedule: array<int, array<string, mixed>>,
     *     ledger: array<int, array<string, mixed>>,
     *     complianceChecklist: array<int, array<string, mixed>>,
     *     accountStatus: array<string, mixed>
     * }
     */
    public static function data(): array
    {
        return [
            'accounts' => [
                [
                    'id' => 'account-primary',
                    'label' => 'Primary ACH · Ending 4321',
                    'type' => 'ACH',
                    'currency' => 'USD',
                    'status' => 'verified',
                    'default' => true,
                    'limits' => 'Daily $50k · Monthly $250k',
                ],
                [
                    'id' => 'account-eu',
                    'label' => 'Wise EUR Wallet',
                    'type' => 'Wire',
                    'currency' => 'EUR',
                    'status' => 'pending_verification',
                    'default' => false,
                    'limits' => 'Daily €20k · Monthly €75k',
                ],
                [
                    'id' => 'account-backup',
                    'label' => 'Backup ACH · Ending 9087',
                    'type' => 'ACH',
                    'currency' => 'USD',
                    'status' => 'needs_documents',
                    'default' => false,
                    'limits' => 'Daily $10k · Monthly $40k',
                ],
            ],
            'scheduleConfig' => [
                'frequency' => 'weekly',
                'nextPayout' => now()->addDays(3)->toIso8601String(),
                'options' => [
                    ['label' => 'Manual', 'value' => 'manual'],
                    ['label' => 'Weekly (Fri)', 'value' => 'weekly'],
                    ['label' => 'Bi-weekly (1st & 15th)', 'value' => 'biweekly'],
                    ['label' => 'Monthly (last business day)', 'value' => 'monthly'],
                ],
            ],
            'manualWindow' => [
                'eligible' => true,
                'lastManualPayout' => now()->subDays(9)->toIso8601String(),
                'cooldownHours' => 12,
            ],
            'schedule' => [
                [
                    'id' => 'payout-1',
                    'label' => 'Weekly creator disbursement',
                    'amount' => 12430,
                    'scheduledFor' => now()->addDays(3)->toIso8601String(),
                    'status' => 'scheduled',
                ],
                [
                    'id' => 'payout-2',
                    'label' => 'Moonlight Studios split',
                    'amount' => 5420,
                    'scheduledFor' => now()->addDays(5)->toIso8601String(),
                    'status' => 'requires-action',
                ],
                [
                    'id' => 'payout-3',
                    'label' => 'Circle facilitator bonuses',
                    'amount' => 3200,
                    'scheduledFor' => now()->addDays(7)->toIso8601String(),
                    'status' => 'scheduled',
                ],
            ],
            'ledger' => [
                [
                    'id' => 'ledger-1',
                    'date' => now()->subDays(1)->toDateString(),
                    'description' => 'Stripe ACH transfer',
                    'type' => 'credit',
                    'amount' => 4800,
                    'balance' => 19850,
                ],
                [
                    'id' => 'ledger-2',
                    'date' => now()->subDays(3)->toDateString(),
                    'description' => 'Creator payout - Edge Guardians',
                    'type' => 'debit',
                    'amount' => 6200,
                    'balance' => 15050,
                ],
                [
                    'id' => 'ledger-3',
                    'date' => now()->subDays(6)->toDateString(),
                    'description' => 'Tip train settlement',
                    'type' => 'credit',
                    'amount' => 7400,
                    'balance' => 21250,
                ],
            ],
            'complianceChecklist' => [
                [
                    'id' => 'compliance-1',
                    'item' => 'Verify Moonlight Studios W-9',
                    'status' => 'pending',
                    'owner' => 'Avery Lang',
                    'dueDate' => now()->addDays(2)->toDateString(),
                ],
                [
                    'id' => 'compliance-2',
                    'item' => 'Confirm EU VAT remittance files',
                    'status' => 'in-progress',
                    'owner' => 'FinOps Desk',
                    'dueDate' => now()->addDay()->toDateString(),
                ],
                [
                    'id' => 'compliance-3',
                    'item' => 'Update treasury policy playbook',
                    'status' => 'complete',
                    'owner' => 'Riley Chen',
                    'dueDate' => now()->subDays(1)->toDateString(),
                ],
            ],
            'accountStatus' => [
                'health' => 'attention',
                'messages' => [
                    'Primary payout account verified • Last refreshed 2 days ago',
                    'Secondary account pending verification • Upload bank statement',
                    'Two-factor authentication enabled for treasury team',
                ],
                'limits' => [
                    'daily' => ['limit' => 50000, 'used' => 21800],
                    'monthly' => ['limit' => 250000, 'used' => 142300],
                ],
            ],
        ];
    }
}
