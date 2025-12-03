<?php

use App\Enums\LiveStreamTipStatus;
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
        Schema::create('live_stream_tips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')
                ->constrained('live_streams')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('sender_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('recipient_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->unsignedBigInteger('amount');
            $table->char('currency', 3)->default('USD');
            $table->text('message')->nullable();
            $table->string('status', 32)->default(LiveStreamTipStatus::Pending->value);
            $table->foreignId('payment_id')
                ->nullable()
                ->constrained('payments')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->timestamp('created_at');

            $table->index(['stream_id', 'created_at']);
            $table->index(['recipient_id', 'created_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_stream_tips');
    }
};
