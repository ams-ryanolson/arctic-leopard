<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Support\Mocks\Signals\SettingsMock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SignalsSettingsController extends Controller
{
    /**
     * Display the Signals settings workspace with mock data.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Signals/Settings', SettingsMock::data());
    }
}





