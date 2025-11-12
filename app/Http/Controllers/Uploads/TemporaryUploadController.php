<?php

namespace App\Http\Controllers\Uploads;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use App\Services\TemporaryUploadService;

class TemporaryUploadController extends Controller
{
    public function __construct(
        protected TemporaryUploadService $temporaryUploads,
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'mimetypes:' . implode(',', config('uploads.allowed_mime_types')),
                'max:' . config('uploads.max_file_size'),
            ],
        ]);

        $file = $validated['file'];
        $stored = $this->temporaryUploads->store($file);

        $previewUrl = route('uploads.tmp.show', ['upload' => $stored['identifier']]);

        return response()->json([
            'id' => $stored['identifier'],
            'filename' => $stored['filename'],
            'path' => $stored['path'],
            'original_name' => $stored['original_name'],
            'mime_type' => $stored['mime_type'],
            'size' => $stored['size'],
            'disk' => $stored['disk'],
            'url' => $previewUrl,
            'thumbnail_url' => $previewUrl,
        ]);
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


