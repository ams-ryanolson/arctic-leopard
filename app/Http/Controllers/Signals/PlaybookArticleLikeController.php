<?php

namespace App\Http\Controllers\Signals;

use App\Http\Controllers\Controller;
use App\Models\PlaybookArticle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlaybookArticleLikeController extends Controller
{
    public function store(Request $request, PlaybookArticle $article): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasLiked($article)) {
            $user->like($article);
            $article->increment('likes_count');
        }

        return response()->json([
            'likes_count' => $article->likes_count,
            'user_liked' => true,
        ]);
    }

    public function destroy(Request $request, PlaybookArticle $article): JsonResponse
    {
        $user = $request->user();

        if ($user->hasLiked($article)) {
            $user->unlike($article);

            if ($article->likes_count > 0) {
                $article->decrement('likes_count');
            }
        }

        return response()->json([
            'likes_count' => $article->likes_count,
            'user_liked' => false,
        ]);
    }
}
