<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Support\Mocks\Signals\OverviewMock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsOverviewController extends Controller
{
    /**
     * Display the informational overview for Signals.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Signals/Overview', OverviewMock::data());
    }
}





