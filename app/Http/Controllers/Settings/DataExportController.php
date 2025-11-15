<?php

namespace App\Http\Controllers\Settings;

use App\Enums\UserDataExportStatus;
use App\Http\Controllers\Controller;
use App\Jobs\ExportUserData;
use App\Models\UserDataExport;
use App\Services\Toasts\ToastBus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class DataExportController extends Controller
{
    /**
     * Request a data export for the user.
     */
    public function export(Request $request, ToastBus $toastBus): RedirectResponse
    {
        $user = $request->user();

        // Create the export record immediately with pending status
        $export = UserDataExport::create([
            'user_id' => $user->id,
            'status' => UserDataExportStatus::Pending,
            'file_path' => '', // Will be set when the job completes
            'disk' => config('filesystems.default'),
            'expires_at' => now()->addDays(7),
        ]);

        // Dispatch the job to the default queue
        ExportUserData::dispatch($user->id, $export->id)->onQueue('default');

        $toastBus->success(
            $user,
            'Your data export has been queued. You will receive a notification when it is ready for download.'
        );

        return back();
    }

    /**
     * Download a data export.
     */
    public function download(Request $request, UserDataExport $export, ToastBus $toastBus): Response|RedirectResponse
    {
        // Ensure the export belongs to the authenticated user
        if ($export->user_id !== $request->user()->id) {
            abort(403);
        }

        // Check if export has expired
        if ($export->isExpired()) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['message' => 'This export has expired. Please request a new export.'], 410);
            }

            $toastBus->warning(
                $request->user(),
                'This export has expired. Please request a new export.'
            );

            return back();
        }

        // Check if file exists
        if (! $export->fileExists()) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['message' => 'The export file is no longer available. Please request a new export.'], 404);
            }

            $toastBus->danger(
                $request->user(),
                'The export file is no longer available. Please request a new export.'
            );

            return back();
        }

        // Mark as downloaded
        $export->markAsDownloaded();

        $disk = Storage::disk($export->disk);
        $filename = 'user-data-export-'.$export->created_at->format('Y-m-d-His').'.zip';

        // For S3, use signed URL redirect
        if ($export->disk === 's3' || $disk->getAdapter() instanceof \League\Flysystem\AwsS3V3\AwsS3V3Adapter) {
            $url = $export->getDownloadUrl(60);

            return redirect($url);
        }

        // For local storage, stream the file directly
        $stream = $disk->readStream($export->file_path);

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
        }, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Content-Length' => $disk->size($export->file_path),
        ]);
    }

    /**
     * Delete a data export.
     */
    public function destroy(Request $request, UserDataExport $export, ToastBus $toastBus): RedirectResponse
    {
        // Ensure the export belongs to the authenticated user
        if ($export->user_id !== $request->user()->id) {
            abort(403);
        }

        // Delete the file from storage if it exists
        $export->deleteFile();

        // Delete the export record
        $export->delete();

        $toastBus->success(
            $request->user(),
            'Export deleted successfully.'
        );

        return back();
    }
}
