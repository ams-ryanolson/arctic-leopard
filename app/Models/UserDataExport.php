<?php

namespace App\Models;

use App\Enums\UserDataExportStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class UserDataExport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'file_path',
        'disk',
        'file_size',
        'expires_at',
        'downloaded_at',
    ];

    protected $casts = [
        'status' => UserDataExportStatus::class,
        'expires_at' => 'datetime',
        'downloaded_at' => 'datetime',
        'file_size' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the export has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Check if the export is pending.
     */
    public function isPending(): bool
    {
        return $this->status === UserDataExportStatus::Pending;
    }

    /**
     * Check if the export is processing.
     */
    public function isProcessing(): bool
    {
        return $this->status === UserDataExportStatus::Processing;
    }

    /**
     * Check if the export is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === UserDataExportStatus::Completed;
    }

    /**
     * Check if the export has failed.
     */
    public function isFailed(): bool
    {
        return $this->status === UserDataExportStatus::Failed;
    }

    /**
     * Check if the export has been downloaded.
     */
    public function isDownloaded(): bool
    {
        return $this->downloaded_at !== null;
    }

    /**
     * Mark the export as downloaded.
     */
    public function markAsDownloaded(): void
    {
        $this->update(['downloaded_at' => now()]);
    }

    /**
     * Get a temporary signed URL for downloading the export.
     */
    public function getDownloadUrl(int $expirationMinutes = 60): string
    {
        return Storage::disk($this->disk)->temporaryUrl(
            $this->file_path,
            now()->addMinutes($expirationMinutes)
        );
    }

    /**
     * Check if the file exists in storage.
     */
    public function fileExists(): bool
    {
        return Storage::disk($this->disk)->exists($this->file_path);
    }

    /**
     * Delete the file from storage.
     */
    public function deleteFile(): bool
    {
        if ($this->fileExists()) {
            return Storage::disk($this->disk)->delete($this->file_path);
        }

        return false;
    }
}
