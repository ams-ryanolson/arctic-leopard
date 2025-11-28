<?php

namespace App\Listeners\Users;

use App\Models\User;
use App\Models\UserWarning;
use Illuminate\Support\Facades\DB;

class ExpireWarnings
{
    /**
     * Expire warnings that are older than 90 days.
     */
    public function handle(): void
    {
        $expiredWarnings = UserWarning::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expiredWarnings as $warning) {
            // Update user's warning count if needed
            $user = $warning->user;
            if ($user) {
                DB::transaction(function () use ($user): void {
                    $user->refresh();
                    $user->update([
                        'warning_count' => $user->activeWarnings()->count(),
                    ]);
                });
            }
        }
    }
}
