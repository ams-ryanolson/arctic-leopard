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
        Schema::create('user_notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('follows')->default(true);
            $table->boolean('follow_requests')->default(true);
            $table->boolean('follow_approvals')->default(true);
            $table->boolean('post_likes')->default(true);
            $table->boolean('post_bookmarks')->default(true);
            $table->boolean('messages')->default(true);
            $table->boolean('comments')->default(true);
            $table->boolean('replies')->default(true);
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notification_preferences');
    }
};
