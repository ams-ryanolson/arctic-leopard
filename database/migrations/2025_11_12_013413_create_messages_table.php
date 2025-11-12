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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('conversation_id')
                ->constrained('conversations')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('reply_to_id')
                ->nullable()
                ->constrained('messages')
                ->nullOnDelete();
            $table->foreignId('deleted_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('type', 30)->default('message');
            $table->unsignedBigInteger('sequence');
            $table->text('body')->nullable();
            $table->json('fragments')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('visible_at')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamp('redacted_at')->nullable();
            $table->timestamp('undo_expires_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['conversation_id', 'sequence']);
            $table->index(['conversation_id', 'created_at']);
            $table->index(['conversation_id', 'visible_at']);
            $table->index('user_id');
            $table->index('reply_to_id');
            $table->index('deleted_by_id');
            $table->index('undo_expires_at');
            $table->index('type');
        });

        Schema::table('conversations', function (Blueprint $table): void {
            $table->foreign('last_message_id')
                ->references('id')
                ->on('messages')
                ->nullOnDelete();
        });

        Schema::table('conversation_participants', function (Blueprint $table): void {
            $table->foreign('last_read_message_id')
                ->references('id')
                ->on('messages')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversation_participants', function (Blueprint $table): void {
            $table->dropForeign(['last_read_message_id']);
        });

        Schema::table('conversations', function (Blueprint $table): void {
            $table->dropForeign(['last_message_id']);
        });

        Schema::dropIfExists('messages');
    }
};
