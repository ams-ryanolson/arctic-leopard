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
        Schema::create('migration_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('source_type', 50)->comment('e.g., user, post, media');
            $table->unsignedBigInteger('source_id')->comment('SE4 ID');
            $table->string('target_type', 50)->comment('e.g., User, Post, PostMedia');
            $table->unsignedBigInteger('target_id')->comment('Laravel model ID');
            $table->json('metadata')->nullable()->comment('Additional migration data');
            $table->timestamps();

            $table->unique(['source_type', 'source_id'], 'migration_mappings_source_unique');
            $table->index(['target_type', 'target_id'], 'migration_mappings_target_index');
            $table->index('source_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('migration_mappings');
    }
};
