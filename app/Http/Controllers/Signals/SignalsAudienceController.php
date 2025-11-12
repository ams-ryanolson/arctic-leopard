<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Support\Mocks\Signals\AudienceMock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsAudienceController extends Controller
{
    /**
     * Display audience and circle health insights.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Signals/Audience', AudienceMock::data());
    }
}
