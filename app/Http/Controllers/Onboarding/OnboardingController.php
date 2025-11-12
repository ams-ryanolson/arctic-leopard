<?php

namespace App\Http\Controllers\Onboarding;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController
{
    /**
     * Show the first step of the onboarding flow.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Onboarding/Start');
    }
}

