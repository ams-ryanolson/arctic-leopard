<?php

namespace App\Http\Controllers\LiveStreaming;

use App\Http\Controllers\Controller;
use App\Models\LiveStream;
use Illuminate\Http\Request;

class LiveStreamTipController extends Controller
{
    /**
     * Send a tip during a stream.
     */
    public function store(Request $request, LiveStream $stream)
    {
        // TODO: Implement tip creation
        return back();
    }

    /**
     * Get tip leaderboard for a stream.
     */
    public function leaderboard(Request $request, LiveStream $stream)
    {
        // TODO: Implement leaderboard retrieval
        return response()->json(['leaderboard' => []]);
    }
}
