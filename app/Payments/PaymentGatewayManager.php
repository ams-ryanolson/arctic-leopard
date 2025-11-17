<?php

namespace App\Payments;

use App\Payments\Contracts\PaymentGatewayContract;
use App\Payments\Contracts\SubscriptionGatewayContract;
use App\Payments\Exceptions\PaymentGatewayException;
use App\Payments\Exceptions\PaymentGatewayNotFoundException;
use App\Payments\Exceptions\SubscriptionGatewayNotSupportedException;
use Closure;
use Illuminate\Contracts\Container\Container;

class PaymentGatewayManager
{
    /**
     * @var array<string, PaymentGatewayContract>
     */
    protected array $gateways = [];

    /**
     * @var array<string, SubscriptionGatewayContract>
     */
    protected array $subscriptionGateways = [];

    /**
     * @var array<string, Closure>
     */
    protected array $customResolvers = [];

    /**
     * @var array<string, mixed>
     */
    protected array $config = [];

    /**
     * @param  array<string, mixed>  $config
     */
    public function __construct(
        protected readonly Container $container,
        array $config
    ) {
        $this->config = array_replace_recursive([
            'default' => 'fake',
            'gateways' => [],
        ], $config);
    }

    public function driver(?string $name = null): PaymentGatewayContract
    {
        $name = $name ?? $this->getDefaultDriver();

        if (! isset($this->gateways[$name])) {
            $this->gateways[$name] = $this->resolve($name);
        }

        return $this->gateways[$name];
    }

    public function subscriptionDriver(?string $name = null): SubscriptionGatewayContract
    {
        $name = $name ?? $this->getDefaultDriver();

        if (! isset($this->subscriptionGateways[$name])) {
            $this->subscriptionGateways[$name] = $this->resolveSubscription($name);
        }

        return $this->subscriptionGateways[$name];
    }

    /**
     * Register a custom resolver for the given gateway.
     */
    public function extend(string $name, Closure $callback): void
    {
        $this->customResolvers[$name] = $callback;
    }

    public function getDefaultDriver(): string
    {
        return (string) ($this->config['default'] ?? 'fake');
    }

    /**
     * @return array<string, mixed>
     */
    protected function getGatewayConfig(string $name): array
    {
        $gatewayConfig = $this->config['gateways'][$name] ?? null;

        if ($gatewayConfig === null) {
            throw PaymentGatewayNotFoundException::named($name);
        }

        return $gatewayConfig;
    }

    protected function resolve(string $name): PaymentGatewayContract
    {
        if (isset($this->customResolvers[$name])) {
            return $this->callCustomResolver($name);
        }

        $config = $this->getGatewayConfig($name);

        $driverClass = $config['driver'] ?? null;

        if ($driverClass === null) {
            throw new PaymentGatewayException("Gateway [{$name}] is missing a driver configuration.");
        }

        $gateway = $this->container->make($driverClass, [
            'config' => $config['options'] ?? [],
        ]);

        if (! $gateway instanceof PaymentGatewayContract) {
            throw new PaymentGatewayException("Gateway [{$name}] must implement ".PaymentGatewayContract::class);
        }

        return $gateway;
    }

    protected function resolveSubscription(string $name): SubscriptionGatewayContract
    {
        if (isset($this->customResolvers["{$name}.subscription"])) {
            return $this->callCustomResolver("{$name}.subscription");
        }

        $config = $this->getGatewayConfig($name);

        if (isset($config['subscription_driver'])) {
            $driver = $this->container->make($config['subscription_driver'], [
                'config' => $config['options'] ?? [],
            ]);

            if (! $driver instanceof SubscriptionGatewayContract) {
                throw new PaymentGatewayException("Subscription driver for [{$name}] must implement ".SubscriptionGatewayContract::class);
            }

            return $driver;
        }

        $paymentGateway = $this->driver($name);

        if ($paymentGateway instanceof SubscriptionGatewayContract) {
            return $paymentGateway;
        }

        throw SubscriptionGatewayNotSupportedException::forGateway($name);
    }

    protected function callCustomResolver(string $name): mixed
    {
        return $this->customResolvers[$name]($this->container);
    }
}
