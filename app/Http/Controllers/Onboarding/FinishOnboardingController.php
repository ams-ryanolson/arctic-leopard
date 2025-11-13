<?php

namespace App\Http\Controllers\Onboarding;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FinishOnboardingController
{
    /**
     * Mark the user's profile as completed and redirect to dashboard.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user && ! $user->profile_completed_at) {
            $user->forceFill([
                'profile_completed_at' => now(),
            ])->save();
        }

        return redirect()->route('dashboard');
    }
}
