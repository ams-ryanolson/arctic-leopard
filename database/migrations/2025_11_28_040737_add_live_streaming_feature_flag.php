<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $setting = \App\Models\AdminSetting::set('feature_live_streaming_enabled', false);

        $setting->update([
            'type' => 'boolean',
            'category' => 'features',
            'description' => 'Enable live streaming functionality.',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\AdminSetting::query()->where('key', 'feature_live_streaming_enabled')->delete();
    }
};
