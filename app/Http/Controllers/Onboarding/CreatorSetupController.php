<?php

namespace App\Http\Controllers\Onboarding;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CreatorSetupController
{
    /**
     * Display the optional creator setup step.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Onboarding/CreatorSetup');
    }
}
