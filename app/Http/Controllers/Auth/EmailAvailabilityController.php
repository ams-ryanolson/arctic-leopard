<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmailAvailabilityController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
        ]);

        $email = Str::lower($validated['email']);

        $available = ! User::whereRaw('lower(email) = ?', [$email])->exists();
        $suggestions = [];

        if (! $available) {
            $suggestions = $this->generateSuggestions($email);
        }

        return response()->json([
            'available' => $available,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * @return array<int, string>
     */
    protected function generateSuggestions(string $email): array
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, 'example.com');
        $local = Str::of($local)
            ->lower()
            ->replaceMatches('/[^a-z0-9._+-]/', '')
            ->trim('._+-');

        if ($local->isEmpty()) {
            $local = Str::of('creator');
        }

        $base = (string) Str::limit($local, 30, '');
        $domain = $domain ?: 'example.com';

        $candidates = collect([
            $base.'+'.random_int(11, 99).'@'.$domain,
            $base.random_int(100, 999).'@'.$domain,
            $base.'+'.Str::random(3).'@'.$domain,
            'real'.$base.'@'.$domain,
        ])->unique();

        $suggestions = [];

        foreach ($candidates as $candidate) {
            if (! User::whereRaw('lower(email) = ?', [Str::lower($candidate)])->exists()) {
                $suggestions[] = $candidate;
            }

            if (count($suggestions) === 4) {
                break;
            }
        }

        return $suggestions;
    }
}
