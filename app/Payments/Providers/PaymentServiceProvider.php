<?php

namespace App\Payments\Providers;

use App\Payments\Contracts\PaymentGatewayContract;
use App\Payments\Contracts\SubscriptionGatewayContract;
use App\Payments\PaymentGatewayManager;
use Illuminate\Support\ServiceProvider;

class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGatewayManager::class, function ($app) {
            $config = (array) $app['config']->get('payments', []);

            return new PaymentGatewayManager($app, $config);
        });

        $this->app->alias(PaymentGatewayManager::class, 'payments.manager');

        $this->app->singleton(\App\Payments\Gateways\FakeGateway::class, function ($app) {
            $config = (array) $app['config']->get('payments.gateways.fake.options', []);

            return new \App\Payments\Gateways\FakeGateway($config);
        });

        $this->app->afterResolving(PaymentGatewayManager::class, function (PaymentGatewayManager $manager, $app) {
            $manager->extend('fake', fn (): \App\Payments\Gateways\FakeGateway => $app->make(\App\Payments\Gateways\FakeGateway::class));
            $manager->extend('fake.subscription', fn (): \App\Payments\Gateways\FakeGateway => $app->make(\App\Payments\Gateways\FakeGateway::class));
        });

        $this->app->bind(PaymentGatewayContract::class, function ($app) {
            return $app->make(PaymentGatewayManager::class)->driver();
        });

        $this->app->bind(SubscriptionGatewayContract::class, function ($app) {
            return $app->make(PaymentGatewayManager::class)->subscriptionDriver();
        });
    }
}
