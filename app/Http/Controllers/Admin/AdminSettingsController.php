<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminSettingRequest;
use App\Http\Requests\Admin\UpdateAdminSettingsBulkRequest;
use App\Models\AdminSetting;
use App\Services\TemporaryUploadService;
use App\Services\Users\UserMediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __construct(
        private TemporaryUploadService $temporaryUploads,
        private UserMediaService $userMediaService,
    ) {}

    /**
     * Display a listing of admin settings.
     */
    public function index(Request $request): Response
    {
        $category = $request->string('category');

        $query = AdminSetting::query()->orderBy('category')->orderBy('key');

        if ($category->isNotEmpty()) {
            $query->where('category', $category);
        }

        $settings = $query->get()->map(fn (AdminSetting $setting): array => [
            'key' => $setting->key,
            'value' => $setting->getValue(),
            'description' => $setting->description,
            'type' => $setting->type,
            'category' => $setting->category,
        ]);

        $categories = AdminSetting::query()
            ->distinct()
            ->pluck('category')
            ->values()
            ->all();

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'categories' => $categories,
            'selectedCategory' => $category->toString(),
        ]);
    }

    /**
     * Update the specified admin setting.
     */
    public function update(UpdateAdminSettingRequest $request, string $key): RedirectResponse
    {
        $validated = $request->validated();

        $setting = AdminSetting::query()->where('key', $key)->first();

        if ($setting === null) {
            $setting = new AdminSetting([
                'key' => $key,
                // infer sensible defaults when creating on the fly
                'type' => is_bool($validated['value']) ? 'boolean'
                    : (is_int($validated['value']) ? 'integer'
                        : (is_array($validated['value']) ? 'json' : 'string')),
                'category' => str_starts_with($key, 'feature_') ? 'features' : 'general',
                'description' => null,
            ]);
        }

        $setting->setValue($validated['value']);
        $setting->save();

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Setting updated successfully.',
            ]);
    }

    /**
     * Bulk update multiple admin settings.
     */
    public function updateMany(UpdateAdminSettingsBulkRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        foreach ($validated['settings'] as $key => $value) {
            $setting = AdminSetting::query()->firstOrNew(['key' => $key]);

            if (! $setting->exists) {
                $setting->type = is_bool($value) ? 'boolean'
                    : (is_int($value) ? 'integer'
                        : (is_array($value) ? 'json' : 'string'));
                $setting->category = str_starts_with($key, 'feature_') ? 'features' : 'general';
                $setting->description = null;
            }

            $setting->setValue($value);
            $setting->save();
        }

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Settings updated successfully.',
            ]);
    }

    /**
     * Upload a branding asset (logo, favicon, etc.)
     */
    public function uploadBranding(Request $request): JsonResponse
    {
        Gate::authorize('manage settings');

        $validated = $request->validate([
            'logo_type' => ['required', 'string', 'in:light_1x,light_2x,dark_1x,dark_2x,favicon,app_icon,og_default'],
            'identifier' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    if (! is_string($value)) {
                        return;
                    }

                    if (! $this->temporaryUploads->exists($value)) {
                        $fail('The temporary upload identifier is invalid or has expired.');
                    }
                },
            ],
        ]);

        $identifier = $validated['identifier'];
        $logoType = $validated['logo_type'];

        $disk = config('filesystems.default');

        // Promote file from temporary to permanent storage
        $promotedPath = $this->temporaryUploads->promote(
            $identifier,
            'branding',
            null,
            'public',
        );

        if ($promotedPath === null) {
            return response()->json(['error' => 'Failed to process upload.'], 422);
        }

        $originalPath = $promotedPath;
        $optimizedPath = null;

        // Process branding image
        try {
            $processed = $this->userMediaService->processBrandingImage($disk, $promotedPath, $logoType);
            $optimizedPath = $processed['optimized_path'];

            // Use optimized path as the main path
            $promotedPath = $optimizedPath ?? $promotedPath;
        } catch (\Throwable $e) {
            // If processing fails, use original
            $promotedPath = $originalPath;
        }

        // Get public URL
        $url = Storage::disk($disk)->url($promotedPath);

        // Map logo_type to admin setting key
        $settingKeyMap = [
            'light_1x' => 'site_logo_url',
            'light_2x' => 'site_logo_2x_url',
            'dark_1x' => 'site_logo_dark_url',
            'dark_2x' => 'site_logo_dark_2x_url',
            'favicon' => 'favicon_url',
            'app_icon' => 'app_icon_url',
            'og_default' => 'og_default_image_url',
        ];

        $settingKey = $settingKeyMap[$logoType] ?? null;

        // Update admin setting if key exists
        if ($settingKey) {
            $setting = AdminSetting::query()->firstOrNew(['key' => $settingKey]);
            if (! $setting->exists) {
                $setting->type = 'string';
                $setting->category = 'branding';
                $setting->description = null;
            }
            $setting->setValue($url);
            $setting->save();
        }

        return response()->json([
            'url' => $url,
            'key' => $settingKey,
        ]);
    }
}
