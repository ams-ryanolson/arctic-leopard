<?php

namespace App\Listeners\Content;

use App\Enums\ActivityType;
use App\Events\Content\ContentApproved;
use App\Events\Posts\PostPublished;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class HandleContentApproval
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(ContentApproved $event): void
    {
        $content = $event->content;
        $contentType = class_basename($content);
        $author = $content->author ?? $content->user ?? null;

        // If content was pending and is now approved, publish it (for posts)
        if ($content instanceof \App\Models\Post && $content->isPendingModeration()) {
            if ($content->published_at === null) {
                $content->update(['published_at' => now()]);
            }
            PostPublished::dispatch($content, false);
        }

        // Log the approval
        $this->activityLog->log(
            ActivityType::ContentApproved,
            "{$contentType} approved",
            $content,
            $event->moderator,
            [
                'content_type' => $contentType,
                'content_id' => $content->getKey(),
            ],
            $this->request
        );
    }
}
