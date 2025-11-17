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
        Schema::table('event_media', function (Blueprint $table) {
            if (! Schema::hasColumn('event_media', 'original_path')) {
                $table->string('original_path')->nullable()->after('path');
            }

            if (! Schema::hasColumn('event_media', 'optimized_path')) {
                $table->string('optimized_path')->nullable()->after('original_path');
            }

            if (! Schema::hasColumn('event_media', 'blur_path')) {
                $table->string('blur_path')->nullable()->after('optimized_path');
            }

            if (! Schema::hasColumn('event_media', 'processing_status')) {
                $table->enum('processing_status', ['pending', 'completed', 'failed'])
                    ->nullable()
                    ->after('meta');
            }

            if (! Schema::hasColumn('event_media', 'processing_meta')) {
                $table->json('processing_meta')->nullable()->after('processing_status');
            }

            if (! Schema::hasColumn('event_media', 'processing_error')) {
                $table->text('processing_error')->nullable()->after('processing_meta');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_media', function (Blueprint $table) {
            if (Schema::hasColumn('event_media', 'processing_error')) {
                $table->dropColumn('processing_error');
            }

            if (Schema::hasColumn('event_media', 'processing_meta')) {
                $table->dropColumn('processing_meta');
            }

            if (Schema::hasColumn('event_media', 'processing_status')) {
                $table->dropColumn('processing_status');
            }

            if (Schema::hasColumn('event_media', 'blur_path')) {
                $table->dropColumn('blur_path');
            }

            if (Schema::hasColumn('event_media', 'optimized_path')) {
                $table->dropColumn('optimized_path');
            }

            if (Schema::hasColumn('event_media', 'original_path')) {
                $table->dropColumn('original_path');
            }
        });
    }
};
