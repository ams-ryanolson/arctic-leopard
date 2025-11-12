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
        Schema::create('post_poll_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_poll_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('title');
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('vote_count')->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['post_poll_id', 'position']);
            $table->unique(['post_poll_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_poll_options');
    }
};
