<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostMedia;
use Illuminate\Http\Response;

class MediaController extends Controller
{
    public function destroy(Post $post, PostMedia $media): Response
    {
        if ($media->post_id !== $post->getKey()) {
            abort(404);
        }

        $this->authorize('update', $post);

        $media->delete();

        return response()->noContent();
    }
}
