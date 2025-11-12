<?php

namespace App\Http\Controllers\Onboarding;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FollowSuggestionsController
{
    /**
     * Display the follow suggestions onboarding step.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Onboarding/FollowSuggestions');
    }
}
