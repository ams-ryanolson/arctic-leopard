<?php

namespace App\Listeners;

use App\Enums\ActivityType;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogUserLogin
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(Login $event): void
    {
        $user = $event->user;
        $ipAddress = $this->request->ip();
        $userAgent = $this->request->userAgent();

        // Check if this is a new device by checking if we've seen this user_agent + ip combination before
        $isNewDevice = $this->isNewDevice($user->id, $ipAddress, $userAgent);

        $properties = [
            'is_new_device' => $isNewDevice,
            'device_info' => $this->parseUserAgent($userAgent),
        ];

        $description = $isNewDevice
            ? "User {$user->name} logged in from a new device"
            : "User {$user->name} logged in";

        $this->activityLog->log(
            ActivityType::UserLogin,
            $description,
            $user,
            $user,
            $properties,
            $this->request
        );
    }

    private function isNewDevice(int $userId, string $ipAddress, ?string $userAgent): bool
    {
        if ($userAgent === null) {
            return true;
        }

        // Check sessions table for previous logins with same user_agent and ip
        $previousSession = DB::table('sessions')
            ->where('user_id', $userId)
            ->where('ip_address', $ipAddress)
            ->where('user_agent', $userAgent)
            ->where('last_activity', '>', now()->subDays(90)->timestamp)
            ->exists();

        return ! $previousSession;
    }

    private function parseUserAgent(?string $userAgent): array
    {
        if ($userAgent === null) {
            return ['unknown' => true];
        }

        // Simple user agent parsing - you might want to use a package like jenssegers/agent
        $isMobile = preg_match('/(android|iphone|ipad|mobile)/i', $userAgent);
        $isTablet = preg_match('/(ipad|tablet)/i', $userAgent);

        return [
            'is_mobile' => $isMobile,
            'is_tablet' => $isTablet,
            'raw' => $userAgent,
        ];
    }
}
