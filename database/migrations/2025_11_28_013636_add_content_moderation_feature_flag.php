<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $setting = \App\Models\AdminSetting::set('content_moderation_required', false);

        $setting->update([
            'type' => 'boolean',
            'category' => 'moderation',
            'description' => 'Require admin/mod approval before content goes live. When disabled, content auto-publishes but still appears in moderation queue for scanning.',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\AdminSetting::query()->where('key', 'content_moderation_required')->delete();
    }
};
