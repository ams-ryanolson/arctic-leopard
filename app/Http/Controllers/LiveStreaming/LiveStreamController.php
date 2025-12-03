<?php

namespace App\Http\Controllers\LiveStreaming;

use App\Enums\LiveStreamCategory;
use App\Enums\LiveStreamStatus;
use App\Enums\LiveStreamVisibility;
use App\Http\Controllers\Controller;
use App\Models\LiveStream;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveStreamController extends Controller
{
    /**
     * Browse all live streams.
     */
    public function index(Request $request): Response
    {
        $viewer = $request->user();

        $query = LiveStream::query()
            ->where('status', LiveStreamStatus::Live->value)
            ->with(['user:id,username,display_name,avatar_path'])
            ->orderBy('started_at', 'desc');

        // Apply filters
        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('visibility')) {
            $query->where('visibility', $request->input('visibility'));
        }

        // Filter by viewer access
        if ($viewer !== null) {
            $query->where(function ($q) use ($viewer) {
                $q->where('visibility', LiveStreamVisibility::Public->value)
                    ->orWhere(function ($q2) use ($viewer) {
                        $q2->where('visibility', LiveStreamVisibility::Followers->value)
                            ->whereHas('user', function ($q3) use ($viewer) {
                                $q3->whereIn('id', function ($sub) use ($viewer) {
                                    $sub->select('followable_id')
                                        ->from('followables')
                                        ->where('user_id', $viewer->id)
                                        ->where('followable_type', User::class)
                                        ->where('accepted_at', '!=', null);
                                });
                            });
                    })
                    ->orWhere(function ($q2) {
                        $q2->where('visibility', LiveStreamVisibility::Subscribers->value)
                            ->whereHas('user', function ($q3) {
                                // Check subscription status
                                // This would need to check the subscription service
                            });
                    });
            });
        } else {
            // Non-authenticated users only see public streams
            $query->where('visibility', LiveStreamVisibility::Public->value);
        }

        $streams = $query->paginate(20)->withQueryString();

        return Inertia::render('LiveStreaming/Browse', [
            'streams' => $streams->map(function (LiveStream $stream) {
                return [
                    'id' => $stream->id,
                    'uuid' => $stream->uuid,
                    'title' => $stream->title,
                    'description' => $stream->description,
                    'category' => $stream->category,
                    'viewer_count' => $stream->viewer_count,
                    'started_at' => $stream->started_at?->toIso8601String(),
                    'user' => [
                        'id' => $stream->user->id,
                        'username' => $stream->user->username,
                        'display_name' => $stream->user->display_name ?? $stream->user->username,
                        'avatar_url' => $stream->user->avatar_url,
                    ],
                ];
            }),
            'pagination' => [
                'current_page' => $streams->currentPage(),
                'last_page' => $streams->lastPage(),
                'per_page' => $streams->perPage(),
                'total' => $streams->total(),
            ],
            'categories' => collect(LiveStreamCategory::cases())->map(function ($category) {
                return [
                    'name' => ucfirst(str_replace('_', ' ', $category->value)),
                    'value' => $category->value,
                ];
            })->toArray(),
            'filters' => [
                'category' => $request->input('category'),
                'search' => $request->input('search'),
                'visibility' => $request->input('visibility'),
            ],
        ]);
    }

    /**
     * Watch a specific stream.
     */
    public function show(Request $request, LiveStream $stream): Response
    {
        $viewer = $request->user();
        $isHost = $viewer !== null && $stream->user_id === $viewer->id;

        // Hosts can always view their own streams (for preview/setup)
        if (! $isHost) {
            // Check if viewer can access this stream
            if (! $stream->canJoin($viewer)) {
                abort(403, 'You do not have access to this stream.');
            }

            // Non-hosts can only view live streams
            if (! $stream->isLive()) {
                abort(404, 'This stream is not currently live.');
            }
        }

        $stream->load([
            'user',
            'activeParticipants.user',
            'moderators.user',
        ]);

        return Inertia::render('LiveStreaming/Show', [
            'stream' => [
                'id' => $stream->id,
                'uuid' => $stream->uuid,
                'title' => $stream->title,
                'description' => $stream->description,
                'category' => $stream->category->value,
                'status' => $stream->status->value,
                'viewer_count' => $stream->viewer_count,
                'started_at' => $stream->started_at?->toIso8601String(),
                'stream_key' => $stream->stream_key,
                'rtmp_url' => $stream->rtmp_url,
                'user' => [
                    'id' => $stream->user->id,
                    'username' => $stream->user->username,
                    'display_name' => $stream->user->display_name ?? $stream->user->username,
                    'avatar_url' => $stream->user->avatar_url,
                ],
                'participants' => $stream->activeParticipants->map(function ($participant) {
                    return [
                        'id' => $participant->id,
                        'user_id' => $participant->user_id,
                        'role' => $participant->role->value,
                        'user' => [
                            'id' => $participant->user->id,
                            'username' => $participant->user->username,
                            'display_name' => $participant->user->display_name ?? $participant->user->username,
                            'avatar_url' => $participant->user->avatar_url,
                        ],
                    ];
                }),
            ],
            'canModerate' => $viewer !== null && $stream->canModerate($viewer),
            'isHost' => $isHost,
        ]);
    }
}
