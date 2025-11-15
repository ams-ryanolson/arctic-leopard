<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminSettingRequest;
use App\Models\AdminSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
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

        $setting = AdminSetting::query()->where('key', $key)->firstOrFail();
        $setting->setValue($validated['value']);
        $setting->save();

        return redirect()
            ->back()
            ->with('status', [
                'type' => 'success',
                'message' => 'Setting updated successfully.',
            ]);
    }
}
