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
        Schema::create('content_moderation_queue', function (Blueprint $table) {
            $table->id();
            $table->string('moderatable_type');
            $table->unsignedBigInteger('moderatable_id');
            $table->string('status', 32)->default('pending')->comment('pending, approved, rejected, dismissed');
            $table->foreignId('moderated_by_id')->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->text('moderation_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['moderatable_type', 'moderatable_id']);
            $table->index('status');
            $table->index('created_at');
            $table->unique(['moderatable_type', 'moderatable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_moderation_queue');
    }
};
