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
        Schema::create('story_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('story_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('disk', 50);
            $table->string('path');
            $table->string('blurred_path')->nullable()->comment('For subscriber-only preview (future use)');
            $table->string('thumbnail_path')->nullable();
            $table->string('mime_type', 100);

            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedInteger('duration')->nullable()->comment('Duration in seconds for video');
            $table->unsignedBigInteger('size')->nullable()->comment('File size in bytes');
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->index('story_id');
            $table->index('mime_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('story_media');
    }
};
