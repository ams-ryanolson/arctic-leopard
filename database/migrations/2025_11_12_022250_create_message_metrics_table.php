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
        Schema::create('message_metrics', function (Blueprint $table) {
            $table->id();
            $table->date('recorded_on');
            $table->foreignId('conversation_id')->nullable()->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('messages_sent')->default(0);
            $table->unsignedInteger('attachments_sent')->default(0);
            $table->unsignedInteger('reactions_added')->default(0);
            $table->unsignedInteger('system_messages_sent')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['recorded_on', 'conversation_id', 'user_id'], 'message_metrics_unique_scope');
            $table->index(['recorded_on', 'conversation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_metrics');
    }
};
