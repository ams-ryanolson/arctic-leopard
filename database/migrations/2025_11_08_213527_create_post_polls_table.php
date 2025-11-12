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
        Schema::create('post_polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('question');
            $table->boolean('allow_multiple')->default(false);
            $table->unsignedTinyInteger('max_choices')->nullable();
            $table->timestamp('closes_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique('post_id');
            $table->index('closes_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_polls');
    }
};
