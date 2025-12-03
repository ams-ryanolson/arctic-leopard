<?php

namespace App\Http\Controllers\LiveStreaming;

use App\Http\Controllers\Controller;
use App\Models\LiveStream;
use Illuminate\Http\Request;

class LiveStreamChatController extends Controller
{
    /**
     * Get chat messages for a stream.
     */
    public function index(Request $request, LiveStream $stream)
    {
        // TODO: Implement chat message retrieval
        return response()->json(['messages' => []]);
    }

    /**
     * Send a chat message.
     */
    public function store(Request $request, LiveStream $stream)
    {
        // TODO: Implement chat message creation
        return back();
    }
}
