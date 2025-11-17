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
        Schema::table('post_media', function (Blueprint $table) {
            // Processing status for images (real-time) and videos (async)
            $table->enum('processing_status', ['pending', 'processing', 'completed', 'failed'])
                ->default('completed')
                ->after('is_primary');

            // Optimized version (WebP for images, transcoded for videos)
            $table->string('optimized_path')->nullable()->after('thumbnail_path');

            // Blurred placeholder for progressive loading
            $table->string('blur_path')->nullable()->after('optimized_path');

            // Original path preserved (for reference/debugging)
            $table->string('original_path')->nullable()->after('blur_path');

            // Processing metadata (Mux asset ID for videos, processing errors, etc.)
            $table->json('processing_meta')->nullable()->after('meta');

            // Processing error message if failed
            $table->text('processing_error')->nullable()->after('processing_meta');

            // Index for querying pending/processing items
            $table->index('processing_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_media', function (Blueprint $table) {
            $table->dropIndex(['processing_status']);
            $table->dropColumn([
                'processing_status',
                'optimized_path',
                'blur_path',
                'original_path',
                'processing_meta',
                'processing_error',
            ]);
        });
    }
};
