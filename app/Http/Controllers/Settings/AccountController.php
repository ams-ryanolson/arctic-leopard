<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    /**
     * Show the user's account settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $exports = $user->dataExports()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($export) => [
                'id' => $export->id,
                'status' => $export->status->value,
                'file_size' => $export->file_size,
                'created_at' => $export->created_at?->toIso8601String(),
                'expires_at' => $export->expires_at?->toIso8601String(),
                'downloaded_at' => $export->downloaded_at?->toIso8601String(),
                'is_expired' => $export->isExpired(),
                'is_downloaded' => $export->isDownloaded(),
                'is_pending' => $export->isPending(),
                'is_processing' => $export->isProcessing(),
                'is_completed' => $export->isCompleted(),
                'is_failed' => $export->isFailed(),
            ]);

        return Inertia::render('settings/account', [
            'verificationStatus' => null, // Placeholder for Veriff integration
            'exports' => $exports,
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
