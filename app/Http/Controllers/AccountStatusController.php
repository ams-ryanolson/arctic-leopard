<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountStatusController extends Controller
{
    public function banned(Request $request): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isBanned()) {
            return redirect()->route('home');
        }

        $hasPendingAppeal = $user->appeals()
            ->where('status', \App\Enums\AppealStatus::Pending)
            ->where('appeal_type', \App\Enums\AppealType::Ban)
            ->exists();

        return Inertia::render('Account/Banned', [
            'reason' => $user->banned_reason,
            'banned_at' => $user->banned_at?->toIso8601String(),
            'banned_by' => $user->bannedBy ? [
                'id' => $user->bannedBy->id,
                'name' => $user->bannedBy->name,
                'username' => $user->bannedBy->username,
            ] : null,
            'has_pending_appeal' => $hasPendingAppeal,
            'can_appeal' => $user->canAppeal(),
            'active_warnings' => $user->getActiveWarnings()->map(fn ($warning) => [
                'id' => $warning->id,
                'reason' => $warning->reason,
                'notes' => $warning->notes,
                'expires_at' => $warning->expires_at?->toIso8601String(),
                'created_at' => $warning->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function suspended(Request $request): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isSuspended()) {
            return redirect()->route('home');
        }

        $hasPendingAppeal = $user->appeals()
            ->where('status', \App\Enums\AppealStatus::Pending)
            ->where('appeal_type', \App\Enums\AppealType::Suspension)
            ->exists();

        return Inertia::render('Account/Suspended', [
            'reason' => $user->suspended_reason,
            'suspended_at' => $user->suspended_at?->toIso8601String(),
            'suspended_until' => $user->suspended_until?->toIso8601String(),
            'suspended_by' => $user->suspendedBy ? [
                'id' => $user->suspendedBy->id,
                'name' => $user->suspendedBy->name,
                'username' => $user->suspendedBy->username,
            ] : null,
            'has_pending_appeal' => $hasPendingAppeal,
            'can_appeal' => $user->canAppeal(),
            'active_warnings' => $user->getActiveWarnings()->map(fn ($warning) => [
                'id' => $warning->id,
                'reason' => $warning->reason,
                'notes' => $warning->notes,
                'expires_at' => $warning->expires_at?->toIso8601String(),
                'created_at' => $warning->created_at->toIso8601String(),
            ]),
        ]);
    }
}
