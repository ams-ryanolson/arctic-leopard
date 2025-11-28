<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveContentRequest;
use App\Http\Requests\Admin\BulkModerationRequest;
use App\Http\Requests\Admin\RejectContentRequest;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Story;
use App\Services\ContentModerationService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminModerationController extends Controller
{
    public function __construct(
        private readonly ContentModerationService $moderationService
    ) {}

    public function index(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->hasRole(['Admin', 'Super Admin', 'Moderator'])) {
            abort(403);
        }

        $queue = $this->moderationService->getQueue($request);

        return Inertia::render('Admin/Moderation/Index', [
            'filters' => [
                'type' => $request->string('type')->toString(),
                'status' => $request->string('status')->toString(),
                'search' => $request->string('search')->toString(),
            ],
            'queue' => $queue->through(function ($item) {
                $content = $item->moderatable;
                $author = null;

                if ($content instanceof Post || $content instanceof Story || $content instanceof Comment) {
                    $author = $content->user;
                }

                return [
                    'id' => $item->id,
                    'content_type' => class_basename($content),
                    'content_id' => $content->getKey(),
                    'status' => $item->status,
                    'moderated_at' => $item->moderated_at?->toIso8601String(),
                    'moderated_by' => $item->moderatedBy ? [
                        'id' => $item->moderatedBy->id,
                        'name' => $item->moderatedBy->name,
                        'username' => $item->moderatedBy->username,
                    ] : null,
                    'created_at' => $item->created_at->toIso8601String(),
                    'content' => $this->formatContentForDisplay($content),
                    'author' => $author ? [
                        'id' => $author->id,
                        'name' => $author->name,
                        'username' => $author->username,
                    ] : null,
                ];
            }),
        ]);
    }

    public function show(string $type, int $id): Response
    {
        /** @var \App\Models\User $user */
        $user = request()->user();

        if (! $user->hasRole(['Admin', 'Super Admin', 'Moderator'])) {
            abort(403);
        }

        $content = $this->resolveContent($type, $id);

        if (! $content) {
            abort(404);
        }

        $queueEntry = $content->moderationQueue ?? \App\Models\ContentModerationQueue::where('moderatable_type', $content->getMorphClass())
            ->where('moderatable_id', $content->getKey())
            ->first();

        return Inertia::render('Admin/Moderation/Show', [
            'content_type' => $type,
            'content_id' => $id,
            'content' => $this->formatContentForDisplay($content),
            'queue_entry' => $queueEntry ? [
                'id' => $queueEntry->id,
                'status' => $queueEntry->status,
                'moderated_at' => $queueEntry->moderated_at?->toIso8601String(),
                'moderation_notes' => $queueEntry->moderation_notes,
                'rejection_reason' => $queueEntry->rejection_reason,
                'moderated_by' => $queueEntry->moderatedBy ? [
                    'id' => $queueEntry->moderatedBy->id,
                    'name' => $queueEntry->moderatedBy->name,
                    'username' => $queueEntry->moderatedBy->username,
                ] : null,
            ] : null,
        ]);
    }

    public function approve(ApproveContentRequest $request, string $type, int $id): RedirectResponse
    {
        $content = $this->resolveContent($type, $id);

        if (! $content) {
            abort(404);
        }

        Gate::authorize('moderate', $content);

        $this->moderationService->approve(
            content: $content,
            moderator: $request->user(),
            notes: $request->validated()['notes'] ?? null
        );

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Content approved successfully.',
            ]);
    }

    public function reject(RejectContentRequest $request, string $type, int $id): RedirectResponse
    {
        $content = $this->resolveContent($type, $id);

        if (! $content) {
            abort(404);
        }

        Gate::authorize('moderate', $content);

        $this->moderationService->reject(
            content: $content,
            moderator: $request->user(),
            reason: $request->validated()['rejection_reason'],
            notes: $request->validated()['notes'] ?? null
        );

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Content rejected successfully.',
            ]);
    }

    public function dismiss(Request $request, string $type, int $id): RedirectResponse
    {
        $content = $this->resolveContent($type, $id);

        if (! $content) {
            abort(404);
        }

        Gate::authorize('moderate', $content);

        $this->moderationService->dismiss(
            content: $content,
            moderator: $request->user(),
            notes: $request->string('notes')->toString() ?: null
        );

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Content dismissed from queue successfully.',
            ]);
    }

    public function bulkApprove(BulkModerationRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $moderator = $request->user();

        $approvedCount = 0;

        foreach ($validated['content_ids'] as $contentId) {
            $content = $this->resolveContent($validated['content_type'], $contentId);

            if ($content && Gate::allows('moderate', $content)) {
                $this->moderationService->approve($content, $moderator);
                $approvedCount++;
            }
        }

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => "{$approvedCount} content items approved successfully.",
            ]);
    }

    public function bulkReject(BulkModerationRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $moderator = $request->user();

        $rejectedCount = 0;
        $reason = $validated['rejection_reason'] ?? 'Bulk rejection';

        foreach ($validated['content_ids'] as $contentId) {
            $content = $this->resolveContent($validated['content_type'], $contentId);

            if ($content && Gate::allows('moderate', $content)) {
                $this->moderationService->reject($content, $moderator, $reason);
                $rejectedCount++;
            }
        }

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => "{$rejectedCount} content items rejected successfully.",
            ]);
    }

    /**
     * Resolve content model from type and ID.
     */
    protected function resolveContent(string $type, int $id): ?Model
    {
        return match (strtolower($type)) {
            'post' => Post::find($id),
            'story' => Story::find($id),
            'comment' => Comment::find($id),
            default => null,
        };
    }

    /**
     * Format content for display in the moderation interface.
     *
     * @return array<string, mixed>
     */
    protected function formatContentForDisplay(Model $content): array
    {
        if ($content instanceof Post) {
            return [
                'type' => 'post',
                'id' => $content->id,
                'body' => $content->body,
                'user' => [
                    'id' => $content->user->id,
                    'name' => $content->user->name,
                    'username' => $content->user->username,
                ],
                'created_at' => $content->created_at->toIso8601String(),
                'moderation_status' => $content->moderation_status?->value,
                'moderation_notes' => $content->moderation_notes,
                'rejection_reason' => $content->rejection_reason,
                'media' => $content->media->map(fn ($media) => [
                    'id' => $media->id,
                    'url' => $media->url,
                    'type' => $media->type,
                ]),
            ];
        }

        if ($content instanceof Story) {
            return [
                'type' => 'story',
                'id' => $content->id,
                'body' => $content->body,
                'user' => [
                    'id' => $content->user->id,
                    'name' => $content->user->name,
                    'username' => $content->user->username,
                ],
                'created_at' => $content->created_at->toIso8601String(),
                'moderation_status' => $content->moderation_status?->value,
                'moderation_notes' => $content->moderation_notes,
                'rejection_reason' => $content->rejection_reason,
                'media' => $content->media->map(fn ($media) => [
                    'id' => $media->id,
                    'url' => $media->url,
                    'type' => $media->type,
                ]),
            ];
        }

        if ($content instanceof Comment) {
            return [
                'type' => 'comment',
                'id' => $content->id,
                'body' => $content->body,
                'user' => [
                    'id' => $content->user->id,
                    'name' => $content->user->name,
                    'username' => $content->user->username,
                ],
                'post' => $content->post ? [
                    'id' => $content->post->id,
                    'body' => $content->post->body,
                ] : null,
                'created_at' => $content->created_at->toIso8601String(),
                'moderation_status' => $content->moderation_status?->value,
                'moderation_notes' => $content->moderation_notes,
                'rejection_reason' => $content->rejection_reason,
            ];
        }

        return [];
    }
}
