<?php

namespace App\Http\Controllers\Admin;

use App\Events\Users\AppealReviewed;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewAppealRequest;
use App\Models\UserAppeal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminAppealController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('reviewAppeals', auth()->user());

        $statusFilter = trim((string) $request->string('status'));
        $typeFilter = trim((string) $request->string('type'));

        $appeals = UserAppeal::query()
            ->with(['user:id,name,username,email', 'reviewedBy:id,name,username'])
            ->when($statusFilter !== '', fn ($query) => $query->where('status', $statusFilter))
            ->when($typeFilter !== '', fn ($query) => $query->where('appeal_type', $typeFilter))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Appeals/Index', [
            'filters' => [
                'status' => $statusFilter,
                'type' => $typeFilter,
            ],
            'appeals' => $appeals->through(function (UserAppeal $appeal): array {
                return [
                    'id' => $appeal->id,
                    'user' => [
                        'id' => $appeal->user->id,
                        'name' => $appeal->user->name,
                        'username' => $appeal->user->username,
                        'email' => $appeal->user->email,
                    ],
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
                ];
            }),
        ]);
    }

    public function show(UserAppeal $appeal): Response
    {
        Gate::authorize('reviewAppeals', $appeal->user);

        $appeal->load([
            'user:id,name,username,email,suspended_at,suspended_until,suspended_reason,banned_at,banned_reason',
            'reviewedBy:id,name,username',
        ]);

        return Inertia::render('Admin/Appeals/Show', [
            'appeal' => [
                'id' => $appeal->id,
                'user' => [
                    'id' => $appeal->user->id,
                    'name' => $appeal->user->name,
                    'username' => $appeal->user->username,
                    'email' => $appeal->user->email,
                    'is_suspended' => $appeal->user->isSuspended(),
                    'is_banned' => $appeal->user->isBanned(),
                    'suspended_until' => $appeal->user->suspended_until?->toIso8601String(),
                    'suspended_reason' => $appeal->user->suspended_reason,
                    'banned_reason' => $appeal->user->banned_reason,
                ],
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
        ]);
    }

    public function review(ReviewAppealRequest $request, UserAppeal $appeal): RedirectResponse
    {
        $validated = $request->validated();
        $reviewer = $request->user();

        $status = \App\Enums\AppealStatus::from($validated['status']);

        match ($status) {
            \App\Enums\AppealStatus::Approved => $appeal->approve($reviewer, $validated['review_notes'] ?? null),
            \App\Enums\AppealStatus::Rejected => $appeal->reject($reviewer, $validated['review_notes'] ?? null),
            \App\Enums\AppealStatus::Dismissed => $appeal->dismiss($reviewer, $validated['review_notes'] ?? null),
            default => throw new \InvalidArgumentException("Invalid appeal status: {$validated['status']}"),
        };

        $appeal->refresh();

        event(new AppealReviewed($appeal, $status, $reviewer));

        return redirect()
            ->route('admin.appeals.show', $appeal)
            ->with('status', [
                'type' => 'success',
                'message' => 'Appeal reviewed successfully.',
            ]);
    }
}
