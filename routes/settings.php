<?php

use App\Http\Controllers\Settings\AccountController;
use App\Http\Controllers\Settings\DataExportController;
use App\Http\Controllers\Settings\NotificationsController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\PrivacyController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SocialController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Settings\VerificationController;
use App\Http\Controllers\UserBlockController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    // Redirect to profile settings by default
    Route::redirect('settings', '/settings/profile');

    // Profile Settings
    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('settings.profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('settings.profile.update');
    Route::patch('settings/profile/media', [ProfileController::class, 'updateMedia'])->name('settings.profile.media.update');

    // Privacy Settings
    Route::get('settings/privacy', [PrivacyController::class, 'edit'])->name('settings.privacy.edit');
    Route::patch('settings/privacy', [PrivacyController::class, 'update'])->name('settings.privacy.update');
    Route::get('settings/privacy/blocked-users', [UserBlockController::class, 'index'])
        ->name('settings.privacy.blocked-users');

    // Security Settings
    Route::get('settings/security', [PasswordController::class, 'edit'])->name('settings.security.edit');
    Route::put('settings/security/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('settings.security.password.update');
    Route::get('settings/security/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('settings.security.two-factor.show');

    // Notifications Settings
    Route::get('settings/notifications', [NotificationsController::class, 'edit'])->name('settings.notifications.edit');
    Route::patch('settings/notifications', [NotificationsController::class, 'update'])->name('settings.notifications.update');

    // Social Settings (placeholder for future)
    Route::get('settings/social', [SocialController::class, 'edit'])->name('settings.social.edit');

    // Data & Account Settings
    Route::get('settings/account', [AccountController::class, 'edit'])->name('settings.account.edit');
    Route::post('settings/account/export', [DataExportController::class, 'export'])->name('settings.account.export');
    Route::get('settings/account/export/{export}/download', [DataExportController::class, 'download'])->name('settings.account.export.download');
    Route::delete('settings/account/export/{export}', [DataExportController::class, 'destroy'])->name('settings.account.export.destroy');
    Route::get('settings/account/verification', [VerificationController::class, 'show'])->name('settings.account.verification');
    Route::get('verification/popup', [VerificationController::class, 'popup'])->name('verification.popup');
    Route::delete('settings/account', [AccountController::class, 'destroy'])->name('settings.account.destroy');

    // Legacy routes for backwards compatibility (redirect to new structure)
    Route::get('settings/password', fn () => redirect()->route('settings.security.edit'));
    Route::get('settings/two-factor', fn () => redirect()->route('settings.security.two-factor.show'));
    Route::get('settings/blocked-users', fn () => redirect()->route('settings.privacy.blocked-users'));
    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');
});
