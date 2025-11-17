<?php

namespace App\Http\Controllers\Uploads;

use App\Services\TemporaryUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TemporaryUploadController extends Controller
{
    public function __construct(
        protected TemporaryUploadService $temporaryUploads,
    ) {}

    public function store(Request $request): JsonResponse
    {
        \Log::info('TemporaryUploadController: store called', [
            'has_file' => $request->hasFile('file'),
            'file_name' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : null,
        ]);

        try {
            $validated = $request->validate([
                'file' => [
                    'required',
                    'file',
                    'mimetypes:'.implode(',', config('uploads.allowed_mime_types')),
                    'max:'.config('uploads.max_file_size'),
                ],
            ]);

            $file = $validated['file'];
            $stored = $this->temporaryUploads->store($file);

            \Log::info('TemporaryUploadController: file stored successfully', [
                'identifier' => $stored['identifier'],
                'path' => $stored['path'],
            ]);

            $previewUrl = route('uploads.tmp.show', ['upload' => $stored['identifier']]);

            return response()->json([
                'id' => $stored['identifier'],
                'identifier' => $stored['identifier'],
                'filename' => $stored['filename'],
                'path' => $stored['path'],
                'original_name' => $stored['original_name'],
                'mime_type' => $stored['mime_type'],
                'size' => $stored['size'],
                'disk' => $stored['disk'],
                'url' => $previewUrl,
                'thumbnail_url' => $previewUrl,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('TemporaryUploadController: validation failed', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('TemporaryUploadController: store failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => $e->getMessage() ?: 'Upload failed. Please try again.',
                'errors' => [],
            ], 500);
        }
    }

    public function destroy(Request $request): HttpResponse
    {
        $identifier = trim($request->getContent());

        if ($identifier === '') {
            return Response::noContent();
        }

        $this->temporaryUploads->delete($identifier);

        return Response::noContent();
    }

    public function show(string $identifier)
    {
        $response = $this->temporaryUploads->stream($identifier);

        if ($response === null) {
            return Response::json(['message' => 'File not found'], 404);
        }

        return $response;
    }
}
