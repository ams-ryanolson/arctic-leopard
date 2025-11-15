<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialController extends Controller
{
    /**
     * Show the user's social settings page (placeholder).
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/social');
    }
}
