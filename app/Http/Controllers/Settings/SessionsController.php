<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SessionsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $currentSessionId = $request->session()->getId();

        $sessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(function ($session) use ($currentSessionId) {
                return [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address,
                    'user_agent' => $session->user_agent,
                    'is_current' => $session->id === $currentSessionId,
                    'last_activity' => date('Y-m-d H:i:s', $session->last_activity),
                    'last_activity_human' => now()->setTimestamp($session->last_activity)->diffForHumans(),
                    'device_info' => $this->parseUserAgent($session->user_agent),
                ];
            });

        return Inertia::render('settings/security/sessions', [
            'sessions' => $sessions,
        ]);
    }

    public function destroy(Request $request, string $sessionId): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $currentSessionId = $request->session()->getId();

        // Don't allow deleting current session
        if ($sessionId === $currentSessionId) {
            return redirect()->back()->withErrors([
                'session' => 'You cannot delete your current session.',
            ]);
        }

        DB::table('sessions')
            ->where('id', $sessionId)
            ->where('user_id', $user->id)
            ->delete();

        return redirect()->back()->with('status', 'Session deleted successfully.');
    }

    public function destroyAll(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $currentSessionId = $request->session()->getId();

        // Delete all sessions except current
        DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $currentSessionId)
            ->delete();

        return redirect()->back()->with('status', 'All other sessions have been deleted.');
    }

    private function parseUserAgent(?string $userAgent): array
    {
        if ($userAgent === null) {
            return ['unknown' => true];
        }

        $isMobile = preg_match('/(android|iphone|ipad|mobile)/i', $userAgent);
        $isTablet = preg_match('/(ipad|tablet)/i', $userAgent);
        $isDesktop = ! $isMobile && ! $isTablet;

        // Try to extract browser
        $browser = 'Unknown';
        if (preg_match('/Chrome\/(\d+)/i', $userAgent, $matches)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Firefox\/(\d+)/i', $userAgent, $matches)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Safari\/(\d+)/i', $userAgent, $matches) && ! preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/Edge\/(\d+)/i', $userAgent, $matches)) {
            $browser = 'Edge';
        }

        // Try to extract OS
        $os = 'Unknown';
        if (preg_match('/Windows/i', $userAgent)) {
            $os = 'Windows';
        } elseif (preg_match('/Mac OS X/i', $userAgent)) {
            $os = 'macOS';
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $os = 'Linux';
        } elseif (preg_match('/iPhone|iPad|iPod/i', $userAgent)) {
            $os = 'iOS';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $os = 'Android';
        }

        return [
            'browser' => $browser,
            'os' => $os,
            'is_mobile' => $isMobile,
            'is_tablet' => $isTablet,
            'is_desktop' => $isDesktop,
            'raw' => $userAgent,
        ];
    }
}
