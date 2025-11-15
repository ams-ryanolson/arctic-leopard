<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVerificationRenewalRequest;
use App\Models\User;
use App\Services\Verification\VerificationService;
use Illuminate\Http\RedirectResponse;

class AdminVerificationController extends Controller
{
    public function __construct(
        private readonly VerificationService $verificationService,
    ) {}

    /**
     * Require re-verification for a user.
     */
    public function requireReverification(StoreVerificationRenewalRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $this->verificationService->requireRenewal(
            $user,
            $request->user(),
            $validated['compliance_note']
        );

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Re-verification has been required for this user.',
            ]);
    }
}
