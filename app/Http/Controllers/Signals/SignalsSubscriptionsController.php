<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Support\Mocks\Signals\SubscriptionsMock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsSubscriptionsController extends Controller
{
    /**
     * Display subscription analytics and actions for creators.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Signals/Subscriptions', SubscriptionsMock::data());
    }
}
