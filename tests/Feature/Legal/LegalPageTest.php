<?php

use App\Models\AdminSetting;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

beforeEach(function (): void {
    AdminSetting::factory()->create([
        'key' => 'terms_content',
        'value' => '<h1>Terms of Service</h1><p>Test content</p>',
        'type' => 'string',
        'category' => 'legal',
    ]);

    AdminSetting::factory()->create([
        'key' => 'privacy_content',
        'value' => '<h1>Privacy Policy</h1><p>Privacy content</p>',
        'type' => 'string',
        'category' => 'legal',
    ]);

    AdminSetting::factory()->create([
        'key' => 'site_name',
        'value' => 'Test Site',
        'type' => 'string',
        'category' => 'branding',
    ]);

    AdminSetting::factory()->create([
        'key' => 'support_email',
        'value' => 'support@example.com',
        'type' => 'string',
        'category' => 'communication',
    ]);

    AdminSetting::factory()->create([
        'key' => 'legal_email',
        'value' => 'legal@example.com',
        'type' => 'string',
        'category' => 'communication',
    ]);
});

it('displays terms of service page', function (): void {
    get('/legal/terms')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Legal/Show')
            ->has('title')
            ->has('content')
            ->where('title', 'Terms of Service')
            ->where('content', '<h1>Terms of Service</h1><p>Test content</p>')
        );
});

it('displays privacy policy page', function (): void {
    get('/legal/privacy')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Legal/Show')
            ->where('title', 'Privacy Policy')
        );
});

it('displays community guidelines page', function (): void {
    AdminSetting::factory()->create([
        'key' => 'guidelines_content',
        'value' => '<h1>Community Guidelines</h1>',
        'type' => 'string',
        'category' => 'legal',
    ]);

    get('/legal/guidelines')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Legal/Show')
            ->where('title', 'Community Guidelines')
        );
});

it('displays cookie policy page', function (): void {
    AdminSetting::factory()->create([
        'key' => 'cookie_policy_content',
        'value' => '<h1>Cookie Policy</h1>',
        'type' => 'string',
        'category' => 'legal',
    ]);

    get('/legal/cookies')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Legal/Show')
            ->where('title', 'Cookie Policy')
        );
});

it('displays DMCA policy page', function (): void {
    AdminSetting::factory()->create([
        'key' => 'dmca_policy_content',
        'value' => '<h1>DMCA Policy</h1>',
        'type' => 'string',
        'category' => 'legal',
    ]);

    get('/legal/dmca')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Legal/Show')
            ->where('title', 'DMCA Policy')
        );
});

it('returns 404 for invalid legal page', function (): void {
    get('/legal/invalid')
        ->assertNotFound();
});

it('replaces placeholders in legal content', function (): void {
    // Update existing setting
    $setting = AdminSetting::query()->where('key', 'terms_content')->first();
    $setting->value = 'Site: {{site_name}}, Support: {{support_email}}, Legal: {{legal_email}}';
    $setting->save();

    get('/legal/terms')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('content', 'Site: Test Site, Support: support@example.com, Legal: legal@example.com')
        );
});

it('shows default content when setting does not exist', function (): void {
    AdminSetting::query()->where('key', 'terms_content')->delete();

    get('/legal/terms')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('content', '<p>Content coming soon.</p>')
        );
});

it('includes last updated date when available', function (): void {
    $setting = AdminSetting::query()->where('key', 'terms_content')->first();
    $setting->touch(); // Update timestamp

    get('/legal/terms')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('updatedAt')
            ->where('updatedAt', $setting->updated_at->toDateString())
        );
});
