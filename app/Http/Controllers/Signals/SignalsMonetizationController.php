<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Support\Mocks\Signals\MonetizationMock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsMonetizationController extends Controller
{
    /**
     * Display monetization performance insights with mock data.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Signals/Monetization', MonetizationMock::data());
    }
}
