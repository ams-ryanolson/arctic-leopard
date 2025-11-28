<?php

namespace App\Listeners\Content;

use App\Enums\ActivityType;
use App\Events\Content\ContentQueuedForModeration;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LogContentModeration
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(ContentQueuedForModeration $event): void
    {
        $contentType = class_basename($event->content);
        $author = $event->content->author ?? $event->content->user ?? null;

        $this->activityLog->log(
            ActivityType::ContentQueuedForModeration,
            "{$contentType} queued for moderation",
            $event->content,
            $author,
            [
                'content_type' => $contentType,
                'content_id' => $event->content->getKey(),
            ],
            $this->request
        );
    }
}
