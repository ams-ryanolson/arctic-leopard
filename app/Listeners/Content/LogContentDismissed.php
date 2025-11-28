<?php

namespace App\Listeners\Content;

use App\Enums\ActivityType;
use App\Events\Content\ContentDismissed;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LogContentDismissed
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(ContentDismissed $event): void
    {
        $content = $event->content;
        $contentType = class_basename($content);

        $this->activityLog->log(
            ActivityType::ContentDismissed,
            "{$contentType} dismissed from moderation queue",
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
