<?php

namespace App\Support\Mocks\Signals;

class ComplianceMock
{
    /**
     * @return array{
     *     disputes: array<int, array<string, mixed>>,
     *     metrics: array<string, string|int>,
     *     kycTasks: array<int, array<string, mixed>>,
     *     documents: array<int, array<string, mixed>>,
     *     guides: array<int, array<string, mixed>>
     * }
     */
    public static function data(): array
    {
        return [
            'disputes' => [
                [
                    'id' => 'dispute-1',
                    'customer' => 'Milo Hart',
                    'cardBrand' => 'Visa',
                    'amount' => 180,
                    'reason' => 'Fraud—card not present',
                    'status' => 'respond-by',
                    'deadline' => now()->addDays(3)->toIso8601String(),
                    'lastAction' => now()->subHours(5)->toIso8601String(),
                ],
                [
                    'id' => 'dispute-2',
                    'customer' => 'Sasha Rivers',
                    'cardBrand' => 'Mastercard',
                    'amount' => 95,
                    'reason' => 'Product not as described',
                    'status' => 'in-review',
                    'deadline' => now()->addDays(6)->toIso8601String(),
                    'lastAction' => now()->subHours(11)->toIso8601String(),
                ],
                [
                    'id' => 'dispute-3',
                    'customer' => 'Anders Pike',
                    'cardBrand' => 'Amex',
                    'amount' => 240,
                    'reason' => 'Duplicate charge',
                    'status' => 'won',
                    'deadline' => now()->subDays(1)->toIso8601String(),
                    'lastAction' => now()->subDays(2)->toIso8601String(),
                ],
            ],
            'metrics' => [
                'winRate' => '72%',
                'openDisputes' => 3,
                'pendingDocs' => 2,
            ],
            'kycTasks' => [
                [
                    'id' => 'kyc-1',
                    'entity' => 'Moonlight Studios LLC',
                    'task' => 'Upload new beneficial owner IDs',
                    'status' => 'pending',
                    'dueDate' => now()->addDays(4)->toDateString(),
                ],
                [
                    'id' => 'kyc-2',
                    'entity' => 'Wax Alchemy Society',
                    'task' => 'Renew OFAC screening certification',
                    'status' => 'in-review',
                    'dueDate' => now()->addDay()->toDateString(),
                ],
                [
                    'id' => 'kyc-3',
                    'entity' => 'Edge Guardians Collective',
                    'task' => 'Confirm business address change',
                    'status' => 'complete',
                    'dueDate' => now()->subDays(2)->toDateString(),
                ],
            ],
            'documents' => [
                [
                    'id' => 'doc-1',
                    'name' => '2025 W-9 Form',
                    'status' => 'Received',
                    'receivedAt' => now()->subDays(5)->toDateString(),
                ],
                [
                    'id' => 'doc-2',
                    'name' => 'Government-issued ID · Riley Chen',
                    'status' => 'Pending review',
                    'receivedAt' => now()->subDay()->toDateString(),
                ],
                [
                    'id' => 'doc-3',
                    'name' => 'Bank statement · Backup ACH',
                    'status' => 'Required',
                    'receivedAt' => null,
                ],
            ],
            'guides' => [
                [
                    'id' => 'guide-1',
                    'title' => 'Chargeback evidence checklist',
                    'summary' => 'Gather screen recordings, consent logs, and fulfillment receipts.',
                    'action' => 'Open checklist',
                ],
                [
                    'id' => 'guide-2',
                    'title' => 'KYC renewal playbook',
                    'summary' => 'Step-by-step process to refresh IDs without payout downtime.',
                    'action' => 'View playbook',
                ],
            ],
        ];
    }
}


