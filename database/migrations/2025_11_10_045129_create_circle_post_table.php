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
        Schema::create('circle_post', function (Blueprint $table) {
            $table->id();
            $table->foreignId('circle_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('post_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['circle_id', 'post_id']);
            $table->index(['post_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('circle_post');
    }
};
