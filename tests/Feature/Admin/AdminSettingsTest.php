<?php

use App\Models\AdminSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;

beforeEach(function (): void {
    Storage::fake('public');

    AdminSetting::factory()->create([
        'key' => 'id_verification_expires_after_years',
        'value' => '1',
        'type' => 'integer',
        'category' => 'verification',
    ]);

    AdminSetting::factory()->create([
        'key' => 'id_verification_grace_period_days',
        'value' => '30',
        'type' => 'integer',
        'category' => 'verification',
    ]);

    AdminSetting::factory()->create([
        'key' => 'feature_ads_enabled',
        'value' => 'false',
        'type' => 'boolean',
        'category' => 'features',
    ]);

    AdminSetting::factory()->create([
        'key' => 'support_email',
        'value' => 'support@example.com',
        'type' => 'string',
        'category' => 'communication',
    ]);
});

it('allows admin to view settings', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->get('/admin/settings')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('settings')
            ->has('categories')
            ->has('selectedCategory')
        );
});

it('allows admin to view settings filtered by category', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->get('/admin/settings?category=verification')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('settings')
            ->where('selectedCategory', 'verification')
            ->has('settings', 2) // Only verification settings
        );
});

it('requires admin permission to view settings', function (): void {
    $user = User::factory()->create();

    // Middleware redirects instead of 403
    actingAs($user)
        ->get('/admin/settings')
        ->assertRedirect();
});

it('allows admin to update setting', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings/id_verification_expires_after_years', [
            'value' => 2,
        ])
        ->assertRedirect();

    assertDatabaseHas('admin_settings', [
        'key' => 'id_verification_expires_after_years',
        'value' => '2',
    ]);
});

it('allows admin to update boolean setting', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings/feature_ads_enabled', [
            'value' => true,
        ])
        ->assertRedirect();

    // Boolean values are stored as '1' or '0'
    assertDatabaseHas('admin_settings', [
        'key' => 'feature_ads_enabled',
        'value' => '1',
    ]);
});

it('allows admin to update string setting', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings/support_email', [
            'value' => 'new-support@example.com',
        ])
        ->assertRedirect();

    assertDatabaseHas('admin_settings', [
        'key' => 'support_email',
        'value' => 'new-support@example.com',
    ]);
});

it('creates new setting when updating non-existent key', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    assertDatabaseMissing('admin_settings', [
        'key' => 'new_setting_key',
    ]);

    actingAs($admin)
        ->patchJson('/admin/settings/new_setting_key', [
            'value' => 'new value',
        ])
        ->assertRedirect();

    assertDatabaseHas('admin_settings', [
        'key' => 'new_setting_key',
        'value' => 'new value',
        'type' => 'string',
        'category' => 'general',
    ]);
});

it('infers feature category for feature_ prefixed keys', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings/feature_new_feature', [
            'value' => true,
        ])
        ->assertRedirect();

    assertDatabaseHas('admin_settings', [
        'key' => 'feature_new_feature',
        'type' => 'boolean',
        'category' => 'features',
    ]);
});

it('requires admin permission to update settings', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->patchJson('/admin/settings/id_verification_expires_after_years', [
            'value' => 2,
        ])
        ->assertForbidden();
});

it('validates integer type for integer settings', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings/id_verification_expires_after_years', [
            'value' => 'not an integer',
        ])
        ->assertUnprocessable();
});

it('validates boolean type for boolean settings', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings/feature_ads_enabled', [
            'value' => 'not a boolean',
        ])
        ->assertUnprocessable();
});

it('allows admin to bulk update settings', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings', [
            'settings' => [
                'id_verification_expires_after_years' => 2,
                'feature_ads_enabled' => true,
                'support_email' => 'bulk-update@example.com',
            ],
        ])
        ->assertRedirect();

    assertDatabaseHas('admin_settings', [
        'key' => 'id_verification_expires_after_years',
        'value' => '2',
    ]);

    // Boolean values are stored as '1' or '0'
    assertDatabaseHas('admin_settings', [
        'key' => 'feature_ads_enabled',
        'value' => '1',
    ]);

    assertDatabaseHas('admin_settings', [
        'key' => 'support_email',
        'value' => 'bulk-update@example.com',
    ]);
});

it('creates new settings during bulk update', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings', [
            'settings' => [
                'new_string_setting' => 'string value',
                'new_integer_setting' => 42,
                'new_boolean_setting' => false,
                'feature_new_feature' => true,
            ],
        ])
        ->assertRedirect();

    assertDatabaseHas('admin_settings', [
        'key' => 'new_string_setting',
        'value' => 'string value',
        'type' => 'string',
        'category' => 'general',
    ]);

    assertDatabaseHas('admin_settings', [
        'key' => 'new_integer_setting',
        'value' => '42',
        'type' => 'integer',
        'category' => 'general',
    ]);

    // Boolean values are stored as '1' or '0'
    assertDatabaseHas('admin_settings', [
        'key' => 'new_boolean_setting',
        'value' => '0',
        'type' => 'boolean',
        'category' => 'general',
    ]);

    assertDatabaseHas('admin_settings', [
        'key' => 'feature_new_feature',
        'value' => '1',
        'type' => 'boolean',
        'category' => 'features',
    ]);
});

it('requires admin permission to bulk update settings', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->patchJson('/admin/settings', [
            'settings' => [
                'id_verification_expires_after_years' => 2,
            ],
        ])
        ->assertForbidden();
});

it('validates bulk update requires settings array', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings', [])
        ->assertUnprocessable();
});

it('validates feature flags are boolean in bulk update', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings', [
            'settings' => [
                'feature_ads_enabled' => 'not a boolean',
            ],
        ])
        ->assertUnprocessable();
});

it('validates email format for email settings in bulk update', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings', [
            'settings' => [
                'support_email' => 'not-an-email',
            ],
        ])
        ->assertUnprocessable();
});

it('validates URL format for URL settings in bulk update', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings', [
            'settings' => [
                'contact_url' => 'not-a-url',
            ],
        ])
        ->assertUnprocessable();
});

it('validates consent reprompt days range in bulk update', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings', [
            'settings' => [
                'consent_reprompt_days' => 1000, // Max is 730
            ],
        ])
        ->assertUnprocessable();

    actingAs($admin)
        ->patchJson('/admin/settings', [
            'settings' => [
                'consent_reprompt_days' => 0, // Min is 1
            ],
        ])
        ->assertUnprocessable();
});

it('allows admin to upload branding asset', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    $file = UploadedFile::fake()->image('logo.png', 100, 100);

    $response = actingAs($admin)
        ->postJson('/admin/settings/branding/upload', [
            'logo_type' => 'light_1x',
            'file' => $file,
        ])
        ->assertSuccessful()
        ->assertJsonStructure([
            'url',
            'key',
        ]);

    $data = $response->json();
    expect($data['key'])->toBe('site_logo_url');
    expect($data['url'])->toContain('/storage/branding/');

    // Extract filename from URL and verify it exists
    $urlParts = explode('/', $data['url']);
    $filename = end($urlParts);
    Storage::disk('public')->assertExists('branding/'.$filename);

    assertDatabaseHas('admin_settings', [
        'key' => 'site_logo_url',
        'category' => 'branding',
        'type' => 'string',
    ]);
});

it('maps logo types to correct setting keys', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    $mappings = [
        'light_1x' => 'site_logo_url',
        'light_2x' => 'site_logo_2x_url',
        'dark_1x' => 'site_logo_dark_url',
        'dark_2x' => 'site_logo_dark_2x_url',
        'favicon' => 'favicon_url',
        'app_icon' => 'app_icon_url',
        'og_default' => 'og_default_image_url',
    ];

    foreach ($mappings as $logoType => $expectedKey) {
        $file = UploadedFile::fake()->image("{$logoType}.png", 100, 100);

        $response = actingAs($admin)
            ->postJson('/admin/settings/branding/upload', [
                'logo_type' => $logoType,
                'file' => $file,
            ])
            ->assertSuccessful();

        expect($response->json('key'))->toBe($expectedKey);
    }
});

it('requires admin permission to upload branding asset', function (): void {
    $user = User::factory()->create();

    $file = UploadedFile::fake()->image('logo.png', 100, 100);

    actingAs($user)
        ->postJson('/admin/settings/branding/upload', [
            'logo_type' => 'light_1x',
            'file' => $file,
        ])
        ->assertForbidden();
});

it('validates logo type in branding upload', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    $file = UploadedFile::fake()->image('logo.png', 100, 100);

    actingAs($admin)
        ->postJson('/admin/settings/branding/upload', [
            'logo_type' => 'invalid_type',
            'file' => $file,
        ])
        ->assertUnprocessable();
});

it('validates file is required in branding upload', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->postJson('/admin/settings/branding/upload', [
            'logo_type' => 'light_1x',
        ])
        ->assertUnprocessable();
});

it('validates file is an image in branding upload', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    $file = UploadedFile::fake()->create('document.pdf', 1000);

    actingAs($admin)
        ->postJson('/admin/settings/branding/upload', [
            'logo_type' => 'light_1x',
            'file' => $file,
        ])
        ->assertUnprocessable();
});

it('validates file size limit in branding upload', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    // Create a file larger than 5MB
    $file = UploadedFile::fake()->image('logo.png')->size(6000); // 6MB

    actingAs($admin)
        ->postJson('/admin/settings/branding/upload', [
            'logo_type' => 'light_1x',
            'file' => $file,
        ])
        ->assertUnprocessable();
});

it('generates unique filename for branding uploads', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    $file1 = UploadedFile::fake()->image('logo1.png', 100, 100);
    $file2 = UploadedFile::fake()->image('logo2.png', 100, 100);

    $response1 = actingAs($admin)
        ->postJson('/admin/settings/branding/upload', [
            'logo_type' => 'light_1x',
            'file' => $file1,
        ])
        ->assertSuccessful();

    $response2 = actingAs($admin)
        ->postJson('/admin/settings/branding/upload', [
            'logo_type' => 'light_1x',
            'file' => $file2,
        ])
        ->assertSuccessful();

    // Filenames should be different (ULID-based)
    expect($response1->json('url'))->not->toBe($response2->json('url'));
});
