<?php

namespace App\Http\Controllers;

use App\Models\AdminSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LegalPageController extends Controller
{
    public function show(Request $request, string $page): Response
    {
        $map = [
            'terms' => ['key' => 'terms_content', 'title' => 'Terms of Service'],
            'privacy' => ['key' => 'privacy_content', 'title' => 'Privacy Policy'],
            'guidelines' => ['key' => 'guidelines_content', 'title' => 'Community Guidelines'],
            'cookies' => ['key' => 'cookie_policy_content', 'title' => 'Cookie Policy'],
            'dmca' => ['key' => 'dmca_policy_content', 'title' => 'DMCA Policy'],
        ];

        abort_unless(isset($map[$page]), 404);

        $setting = AdminSetting::query()->where('key', $map[$page]['key'])->first();
        $content = (string) ($setting?->getValue() ?? '<p>Content coming soon.</p>');
        // Simple variable interpolation for dynamic contact details used in templates
        $content = str_replace(
            [
                '{{site_name}}',
                '{{support_email}}',
                '{{legal_email}}',
                '{{abuse_email}}',
                '{{dmca_email}}',
                '{{last_updated}}',
            ],
            [
                (string) AdminSetting::get('site_name', config('app.name')),
                (string) AdminSetting::get('support_email', ''),
                (string) AdminSetting::get('legal_email', ''),
                (string) AdminSetting::get('abuse_email', ''),
                (string) AdminSetting::get('legal_email', (string) AdminSetting::get('support_email', '')),
                $setting?->updated_at?->toDateString() ?? '',
            ],
            $content
        );
        $updatedAt = $setting?->updated_at?->toDateString();

        return Inertia::render('Legal/Show', [
            'title' => $map[$page]['title'],
            'content' => $content,
            'updatedAt' => $updatedAt,
        ]);
    }
}
