<?php

namespace App\Listeners\Content;

use App\Enums\ActivityType;
use App\Events\Content\ContentRejected;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class HandleContentRejection
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(ContentRejected $event): void
    {
        $content = $event->content;
        $contentType = class_basename($content);
        $author = $content->author ?? $content->user ?? null;

        // Content is already marked as rejected in the model
        // We could hide/delete it here if needed, but for now just log

        $this->activityLog->log(
            ActivityType::ContentRejected,
            "{$contentType} rejected: {$event->reason}",
            $content,
            $event->moderator,
            [
                'content_type' => $contentType,
                'content_id' => $content->getKey(),
                'rejection_reason' => $event->reason,
            ],
            $this->request
        );
    }
}
