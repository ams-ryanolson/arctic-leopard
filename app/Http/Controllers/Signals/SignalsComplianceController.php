<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Support\Mocks\Signals\ComplianceMock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsComplianceController extends Controller
{
    /**
     * Display compliance insights and safety workflows.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Signals/Compliance', ComplianceMock::data());
    }
}
