<?php

namespace App\Http\Controllers\LiveStreaming;

use App\Http\Controllers\Controller;
use App\Models\LiveStream;
use App\Models\User;
use Illuminate\Http\Request;

class LiveStreamStageController extends Controller
{
    /**
     * Invite user to stage.
     */
    public function invite(Request $request, LiveStream $stream)
    {
        // TODO: Implement invitation logic
        return back();
    }

    /**
     * Remove user from stage.
     */
    public function remove(Request $request, LiveStream $stream, User $user)
    {
        // TODO: Implement removal logic
        return back();
    }

    /**
     * Promote user to co-host.
     */
    public function promote(Request $request, LiveStream $stream, User $user)
    {
        // TODO: Implement promotion logic
        return back();
    }
}
