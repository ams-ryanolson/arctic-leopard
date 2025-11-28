<?php

use App\Enums\Payments\PaymentType;
use App\Models\User;
use App\Payments\Data\SubaccountConfig;
use App\Payments\Gateways\CCBill\CCBillSubaccountResolver;

it('throws exception when low risk non-recurring config is missing', function (): void {
    $config = [
        'high_risk_non_recurring' => [
            'client_accnum' => 900000,
            'client_subacc' => 0001,
        ],
    ];

    $resolver = new CCBillSubaccountResolver($config);

    expect(fn () => $resolver->getVaultingSubaccount())
        ->toThrow(\InvalidArgumentException::class, 'Low risk non-recurring subaccount configuration is missing');
});

it('throws exception when high risk non-recurring config is missing', function (): void {
    $config = [
        'low_risk_non_recurring' => [
            'client_accnum' => 900000,
            'client_subacc' => 0001,
        ],
    ];

    $resolver = new CCBillSubaccountResolver($config);

    expect(fn () => $resolver->resolveSubaccountForCharge(
        PaymentType::Recurring,
        false,
        User::factory()->create()
    ))->toThrow(\InvalidArgumentException::class, 'High risk non-recurring subaccount configuration is missing');
});

it('returns low risk non-recurring subaccount for vaulting', function (): void {
    $config = [
        'low_risk_non_recurring' => [
            'client_accnum' => 900000,
            'client_subacc' => 0001,
        ],
    ];

    $resolver = new CCBillSubaccountResolver($config);
    $subaccount = $resolver->getVaultingSubaccount();

    expect($subaccount)->toBeInstanceOf(SubaccountConfig::class)
        ->and($subaccount->clientAccnum)->toBe(900000)
        ->and($subaccount->clientSubacc)->toBe(1);
});

it('returns low risk non-recurring subaccount for one-time payments', function (): void {
    $config = [
        'low_risk_non_recurring' => [
            'client_accnum' => 900000,
            'client_subacc' => 0001,
        ],
        'high_risk_non_recurring' => [
            'client_accnum' => 900001,
            'client_subacc' => 0002,
        ],
    ];

    $resolver = new CCBillSubaccountResolver($config);
    $subaccount = $resolver->resolveSubaccountForCharge(PaymentType::OneTime, false);

    expect($subaccount->clientAccnum)->toBe(900000)
        ->and($subaccount->clientSubacc)->toBe(1);
});

it('returns low risk non-recurring subaccount for site subscriptions', function (): void {
    $config = [
        'low_risk_non_recurring' => [
            'client_accnum' => 900000,
            'client_subacc' => 0001,
        ],
        'high_risk_non_recurring' => [
            'client_accnum' => 900001,
            'client_subacc' => 0002,
        ],
    ];

    $resolver = new CCBillSubaccountResolver($config);
    $subaccount = $resolver->resolveSubaccountForCharge(PaymentType::Recurring, true, null);

    expect($subaccount->clientAccnum)->toBe(900000)
        ->and($subaccount->clientSubacc)->toBe(1);
});

it('returns high risk non-recurring subaccount for creator subscriptions', function (): void {
    $config = [
        'low_risk_non_recurring' => [
            'client_accnum' => 900000,
            'client_subacc' => 0001,
        ],
        'high_risk_non_recurring' => [
            'client_accnum' => 900001,
            'client_subacc' => 0002,
        ],
    ];

    $creator = User::factory()->create();
    $resolver = new CCBillSubaccountResolver($config);
    $subaccount = $resolver->resolveSubaccountForCharge(PaymentType::Recurring, true, $creator);

    expect($subaccount->clientAccnum)->toBe(900001)
        ->and($subaccount->clientSubacc)->toBe(2);
});

it('returns high risk non-recurring subaccount as default for unknown payment types', function (): void {
    $config = [
        'low_risk_non_recurring' => [
            'client_accnum' => 900000,
            'client_subacc' => 0001,
        ],
        'high_risk_non_recurring' => [
            'client_accnum' => 900001,
            'client_subacc' => 0002,
        ],
    ];

    $resolver = new CCBillSubaccountResolver($config);
    $subaccount = $resolver->resolveSubaccountForCharge(PaymentType::Adjustment, false);

    expect($subaccount->clientAccnum)->toBe(900001)
        ->and($subaccount->clientSubacc)->toBe(2);
});

it('handles string numeric values in config', function (): void {
    $config = [
        'low_risk_non_recurring' => [
            'client_accnum' => '900000',
            'client_subacc' => '0001',
        ],
    ];

    $resolver = new CCBillSubaccountResolver($config);
    $subaccount = $resolver->getVaultingSubaccount();

    expect($subaccount->clientAccnum)->toBe(900000)
        ->and($subaccount->clientSubacc)->toBe(1);
});
