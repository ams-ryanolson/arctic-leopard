<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Support\Mocks\Signals\StatsMock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsStatsController extends Controller
{
    /**
     * Display the Signals stats dashboard with mock data.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Signals/Stats', StatsMock::data());
    }
}





