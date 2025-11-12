<?php

namespace App\Payments\Contracts;

use App\Payments\Data\SubscriptionCancelData;
use App\Payments\Data\SubscriptionCreateData;
use App\Payments\Data\SubscriptionResponse;
use App\Payments\Data\SubscriptionResumeData;
use App\Payments\Data\SubscriptionSwapData;

interface SubscriptionGatewayContract
{
    public function identifier(): string;

    public function createSubscription(SubscriptionCreateData $data): SubscriptionResponse;

    public function swapSubscription(SubscriptionSwapData $data): SubscriptionResponse;

    public function cancelSubscription(SubscriptionCancelData $data): SubscriptionResponse;

    public function resumeSubscription(SubscriptionResumeData $data): SubscriptionResponse;
}

