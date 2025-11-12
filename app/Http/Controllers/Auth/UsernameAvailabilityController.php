<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UsernameAvailabilityController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:30', 'regex:/^[A-Za-z0-9._-]+$/'],
        ]);

        $username = $validated['username'];
        $normalized = Str::lower($username);

        $available = ! User::where('username_lower', $normalized)->exists();
        $suggestions = [];

        if (! $available) {
            $suggestions = $this->generateSuggestions($username);
        }

        return response()->json([
            'available' => $available,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * Generate alternative usernames that are currently available.
     *
     * @return array<int, string>
     */
    protected function generateSuggestions(string $username): array
    {
        $base = Str::of($username)
            ->lower()
            ->replaceMatches('/[^a-z0-9._-]/', '')
            ->trim('-_.');

        if ($base->length() < 3) {
            $base = Str::of('scene');
        }

        $baseString = (string) $base;
        $candidates = collect([
            $baseString.'_'.Str::random(2),
            $baseString.Str::random(3),
            $baseString.'_'.random_int(11, 99),
            'real'.$baseString,
            $baseString.'_rk',
            $baseString.random_int(100, 999),
        ])->map(fn (string $candidate) => Str::limit($candidate, 30, ''))
            ->filter()
            ->unique();

        $suggestions = [];

        foreach ($candidates as $candidate) {
            if (! User::where('username_lower', Str::lower($candidate))->exists()) {
                $suggestions[] = $candidate;
            }

            if (count($suggestions) === 5) {
                break;
            }
        }

        return $suggestions;
    }
}
