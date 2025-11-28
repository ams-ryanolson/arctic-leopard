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
        Schema::create('user_appeals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->string('appeal_type', 32)->comment('suspension or ban');
            $table->text('reason')->comment('User\'s appeal message');
            $table->string('status', 32)->default('pending')->comment('pending, approved, rejected, dismissed');
            $table->foreignId('reviewed_by_id')->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable()->comment('Admin notes on decision');
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('appeal_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_appeals');
    }
};
