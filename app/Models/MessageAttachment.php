<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MessageAttachment extends Model
{
    /** @use HasFactory<\Database\Factories\MessageAttachmentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'message_id',
        'uploaded_by_id',
        'type',
        'disk',
        'path',
        'filename',
        'mime_type',
        'size',
        'width',
        'height',
        'duration',
        'ordering',
        'is_inline',
        'is_primary',
        'meta',
        'transcode_job',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'duration' => 'integer',
            'ordering' => 'integer',
            'is_inline' => 'bool',
            'is_primary' => 'bool',
            'meta' => 'array',
            'transcode_job' => 'array',
        ];
    }

    /**
     * Message the attachment belongs to.
     *
     * @return BelongsTo<Message, MessageAttachment>
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * User who uploaded the attachment.
     *
     * @return BelongsTo<User, MessageAttachment>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    public function getUrlAttribute(): ?string
    {
        if ($this->path === null) {
            return null;
        }

        return Storage::disk($this->disk ?? config('filesystems.default'))
            ->url($this->path);
    }
}
