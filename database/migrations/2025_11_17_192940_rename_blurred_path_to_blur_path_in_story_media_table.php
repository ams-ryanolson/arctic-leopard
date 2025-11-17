<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('story_media', function (Blueprint $table) {
            // Drop blurred_path if it exists (we're standardizing on blur_path)
            if (Schema::hasColumn('story_media', 'blurred_path')) {
                $table->dropColumn('blurred_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('story_media', function (Blueprint $table) {
            // Re-add blurred_path if rolling back (though data will be lost)
            if (! Schema::hasColumn('story_media', 'blurred_path')) {
                $table->string('blurred_path')->nullable()->after('blur_path');
            }
        });
    }
};
