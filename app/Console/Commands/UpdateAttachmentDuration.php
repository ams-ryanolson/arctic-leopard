<?php

namespace App\Console\Commands;

use App\Models\MessageAttachment;
use Illuminate\Console\Command;

class UpdateAttachmentDuration extends Command
{
    protected $signature = 'attachment:update-duration {id} {duration}';

    protected $description = 'Update the duration of a message attachment';

    public function handle(): int
    {
        $id = (int) $this->argument('id');
        $duration = (float) $this->argument('duration');
        $durationRounded = (int) round($duration);

        $attachment = MessageAttachment::find($id);

        if (! $attachment) {
            $this->error("Attachment with ID {$id} not found.");

            return 1;
        }

        $this->info("Found attachment: {$attachment->filename} (Type: {$attachment->type}, MIME: {$attachment->mime_type})");
        $this->info('Current duration: '.($attachment->duration ?? 'null').' seconds');

        $attachment->duration = $durationRounded;
        $attachment->save();

        $this->info("Updated duration to: {$durationRounded} seconds (from {$duration} seconds)");

        return 0;
    }
}
