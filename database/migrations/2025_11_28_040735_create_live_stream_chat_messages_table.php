<?php

use App\Enums\LiveStreamChatMessageType;
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
        Schema::create('live_stream_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')
                ->constrained('live_streams')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->text('message');
            $table->string('message_type', 32)->default(LiveStreamChatMessageType::Text->value);
            $table->unsignedBigInteger('tip_amount')->nullable();
            $table->foreignId('tip_recipient_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->boolean('is_deleted')->default(false);
            $table->foreignId('deleted_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->timestamp('created_at');

            $table->index(['stream_id', 'created_at']);
            $table->index(['stream_id', 'is_deleted', 'created_at']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_stream_chat_messages');
    }
};
