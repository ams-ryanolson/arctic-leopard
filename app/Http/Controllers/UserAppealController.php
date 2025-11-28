<?php

namespace App\Http\Controllers;

use App\Enums\AppealType;
use App\Events\Users\AppealSubmitted;
use App\Http\Requests\AppealRequest;
use App\Models\UserAppeal;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserAppealController extends Controller
{
    public function create(): Response
    {
        $user = auth()->user();

        if (! $user || (! $user->isSuspended() && ! $user->isBanned())) {
            abort(403, 'You are not suspended or banned.');
        }

        if (! $user->canAppeal()) {
            abort(403, 'You already have a pending appeal.');
        }

        $appealType = $user->isBanned() ? AppealType::Ban : AppealType::Suspension;

        return Inertia::render('Account/Appeal/Create', [
            'appeal_type' => $appealType->value,
            'user_status' => [
                'is_suspended' => $user->isSuspended(),
                'is_banned' => $user->isBanned(),
                'suspended_until' => $user->suspended_until?->toIso8601String(),
                'suspended_reason' => $user->suspended_reason,
                'banned_reason' => $user->banned_reason,
            ],
        ]);
    }

    public function store(AppealRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->canAppeal()) {
            return redirect()
                ->back()
                ->with('status', [
                    'type' => 'error',
                    'message' => 'You already have a pending appeal.',
                ]);
        }

        $appealType = $user->isBanned() ? AppealType::Ban : AppealType::Suspension;

        $appeal = UserAppeal::create([
            'user_id' => $user->id,
            'appeal_type' => $appealType,
            'reason' => $request->validated()['reason'],
            'status' => \App\Enums\AppealStatus::Pending,
        ]);

        event(new AppealSubmitted($appeal));

        return redirect()
            ->route('account.appeal.show', $appeal)
            ->with('status', [
                'type' => 'success',
                'message' => 'Appeal submitted successfully. We will review it shortly.',
            ]);
    }

    public function show(UserAppeal $appeal): Response
    {
        $user = auth()->user();

        if (! $user || $user->id !== $appeal->user_id) {
            abort(403);
        }

        $appeal->load(['reviewedBy:id,name,username']);
        $user->refresh();

        return Inertia::render('Account/Appeal/Show', [
            'appeal' => [
                'id' => $appeal->id,
                'appeal_type' => $appeal->appeal_type->value,
                'reason' => $appeal->reason,
                'status' => $appeal->status->value,
                'reviewed_at' => $appeal->reviewed_at?->toIso8601String(),
                'review_notes' => $appeal->review_notes,
                'reviewed_by' => $appeal->reviewedBy ? [
                    'id' => $appeal->reviewedBy->id,
                    'name' => $appeal->reviewedBy->name,
                    'username' => $appeal->reviewedBy->username,
                ] : null,
                'created_at' => $appeal->created_at->toIso8601String(),
            ],
            'user_status' => [
                'is_suspended' => $user->isSuspended(),
                'is_banned' => $user->isBanned(),
            ],
        ]);
    }
}
