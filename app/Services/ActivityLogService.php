<?php

namespace App\Services;

use App\Enums\ActivityType;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

use function activity;

class ActivityLogService
{
    /**
     * Log an activity with automatic IP and user agent capture.
     *
     * @param  array<string, mixed>  $properties
     */
    public function log(
        ActivityType $type,
        string $description,
        ?Model $subject = null,
        ?User $causer = null,
        array $properties = [],
        ?Request $request = null
    ): void {
        $logProperties = array_merge($properties, [
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);

        $activity = activity($type->value)
            ->withProperties($logProperties);

        if ($subject !== null) {
            $activity->performedOn($subject);
        }

        if ($causer !== null) {
            $activity->causedBy($causer);
        }

        $activity->log($description);
    }
}
