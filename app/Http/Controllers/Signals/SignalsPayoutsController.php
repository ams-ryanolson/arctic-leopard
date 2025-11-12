<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Support\Mocks\Signals\PayoutsMock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsPayoutsController extends Controller
{
    /**
     * Display payout schedule, ledger, and compliance state for treasury teams.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Signals/Payouts', PayoutsMock::data());
    }
}
