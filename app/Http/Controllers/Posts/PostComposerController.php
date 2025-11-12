<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StorePostRequest;
use App\Services\Posts\PostCreationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;

class PostComposerController extends Controller
{
    public function __construct(
        private readonly PostCreationService $postCreationService,
    ) {
    }

    public function __invoke(StorePostRequest $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validated();

        $this->postCreationService->create(
            $user,
            Arr::except($validated, ['media', 'poll', 'hashtags']),
            $validated['media'] ?? [],
            $validated['poll'] ?? null,
            $validated['hashtags'] ?? [],
        );

        return redirect()->route('dashboard');
    }
}




