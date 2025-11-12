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
        Schema::create('post_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('disk', 50);
            $table->string('path');
            $table->string('thumbnail_path')->nullable();
            $table->string('mime_type', 100);

            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedInteger('duration')->nullable()->comment('Duration in seconds for video/audio');
            $table->json('meta')->nullable();

            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index(['post_id', 'position']);
            $table->index(['mime_type']);

            $table->unique(['post_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_media');
    }
};
