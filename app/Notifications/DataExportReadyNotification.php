<?php

namespace App\Notifications;

use App\Models\User;
use App\Models\UserDataExport;

class DataExportReadyNotification extends DatabaseNotification
{
    public const TYPE = 'data-export-ready';

    public function __construct(
        User $actor,
        public UserDataExport $export,
    ) {
        parent::__construct($actor);
    }

    #[\Override]
    public function databaseType(object $notifiable): string
    {
        return self::TYPE;
    }

    #[\Override]
    protected function subjectPayload(object $notifiable): array
    {
        return [
            'type' => 'data-export',
            'id' => (string) $this->export->id,
            'export_id' => $this->export->id,
            'created_at' => $this->export->created_at?->toIso8601String(),
        ];
    }
}
