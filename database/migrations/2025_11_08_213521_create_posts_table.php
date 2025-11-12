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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('type', 32);
            $table->string('audience', 32);

            $table->boolean('is_system')->default(false);
            $table->boolean('is_pinned')->default(false);

            $table->text('body')->nullable();
            $table->json('extra_attributes')->nullable();

            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->unsignedInteger('reposts_count')->default(0);
            $table->unsignedInteger('poll_votes_count')->default(0);
            $table->unsignedInteger('views_count')->default(0);

            $table->unsignedBigInteger('paywall_price')->nullable()->comment('Price in minor units');
            $table->char('paywall_currency', 3)->nullable();

            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['type', 'published_at']);
            $table->index(['audience', 'published_at']);
            $table->index(['user_id', 'published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
