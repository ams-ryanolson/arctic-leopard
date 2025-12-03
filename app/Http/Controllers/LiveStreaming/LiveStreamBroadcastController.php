<?php

namespace App\Http\Controllers\LiveStreaming;

use App\Enums\LiveStreamCategory;
use App\Enums\LiveStreamStatus;
use App\Enums\LiveStreamVisibility;
use App\Http\Controllers\Controller;
use App\Http\Requests\LiveStreaming\StoreLiveStreamRequest;
use App\Models\LiveStream;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveStreamBroadcastController extends Controller
{
    /**
     * Show pre-stream setup page.
     */
    public function show(Request $request): Response
    {
        return Inertia::render('LiveStreaming/Broadcast/Start', [
            // TODO: Add form data
        ]);
    }

    /**
     * Start a new stream.
     */
    public function start(StoreLiveStreamRequest $request)
    {
        $stream = LiveStream::create([
            'user_id' => $request->user()->id,
            'title' => $request->validated()['title'],
            'description' => $request->validated()['description'] ?? null,
            'category' => LiveStreamCategory::from($request->validated()['category']),
            'visibility' => LiveStreamVisibility::from($request->validated()['visibility']),
            'status' => LiveStreamStatus::Scheduled,
            'viewer_count' => 0,
        ]);

        // Redirect to the stream page so they can preview/start it
        return redirect()->route('live.show', $stream);
    }

    /**
     * End a stream.
     */
    public function end(Request $request, LiveStream $stream)
    {
        // TODO: Implement stream ending
        return redirect()->route('live.index');
    }

    /**
     * Show OBS settings page without a stream (placeholder/mock).
     */
    public function obsSettingsWithoutStream(Request $request): Response
    {
        return Inertia::render('LiveStreaming/Broadcast/OBSSettings', [
            'stream' => [
                'stream_key' => 'mock-stream-key-placeholder',
                'rtmp_url' => 'rtmp://mock-server.example.com/stream/mock-key',
            ],
        ]);
    }

    /**
     * Show OBS settings page.
     */
    public function obsSettings(Request $request, LiveStream $stream): Response
    {
        return Inertia::render('LiveStreaming/Broadcast/OBSSettings', [
            'stream' => [
                'stream_key' => $stream->stream_key,
                'rtmp_url' => $stream->rtmp_url,
            ],
        ]);
    }

    /**
     * Update stream settings during live.
     */
    public function updateSettings(Request $request, LiveStream $stream)
    {
        // TODO: Implement settings update
        return back();
    }
}
