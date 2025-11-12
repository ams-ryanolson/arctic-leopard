<?php

namespace App\Console\Commands\Payments;

use App\Enums\Payments\PaymentType;
use App\Models\User;
use App\Payments\Data\PaymentIntentData;
use App\Payments\PaymentGatewayManager;
use App\Services\Payments\PaymentService;
use App\ValueObjects\Money;
use Illuminate\Console\Command;

class TestGatewayCommand extends Command
{
    protected $signature = 'payments:test-gateway
        {gateway? : The gateway driver registered in config/payments.php}
        {--intent : Create a synthetic payment intent to verify round trips}';

    protected $description = 'Resolve a payment gateway driver and optionally execute a synthetic intent flow.';

    public function handle(PaymentGatewayManager $gateways, PaymentService $payments): int
    {
        $gatewayName = $this->argument('gateway') ?? $gateways->getDefaultDriver();

        try {
            $driver = $gateways->driver($gatewayName);
        } catch (\Throwable $exception) {
            $this->error(sprintf('Failed to resolve gateway [%s]: %s', $gatewayName, $exception->getMessage()));

            return self::FAILURE;
        }

        $this->info(sprintf('Resolved gateway [%s] using driver [%s].', $gatewayName, $driver::class));

        if (! $this->option('intent')) {
            return self::SUCCESS;
        }

        $currency = config('payments.currency.default', 'USD');
        $amount = Money::from(1000, $currency);

        $payer = User::query()->first() ?? User::factory()->create();
        $payee = User::query()->whereKeyNot($payer->getKey())->first() ?? User::factory()->create();

        $intent = $payments->createIntent(new PaymentIntentData(
            payableType: self::class,
            payableId: 0,
            amount: $amount,
            payerId: $payer->getKey(),
            payeeId: $payee->getKey(),
            type: PaymentType::OneTime,
            method: 'test',
            metadata: ['command' => 'payments:test-gateway'],
            description: 'Synthetic CLI verification intent'
        ), $gatewayName);

        $this->table(
            ['Local Intent ID', 'Provider Intent', 'Payment ID', 'Status'],
            [[
                'local' => $intent->id,
                'provider' => $intent->provider_intent_id,
                'payment' => $intent->payment_id,
                'status' => $intent->status->value,
            ]]
        );

        return self::SUCCESS;
    }
}
