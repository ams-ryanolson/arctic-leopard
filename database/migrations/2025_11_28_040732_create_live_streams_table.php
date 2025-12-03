<?php

use App\Enums\LiveStreamCategory;
use App\Enums\LiveStreamStatus;
use App\Enums\LiveStreamVisibility;
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
        Schema::create('live_streams', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 32)->default(LiveStreamCategory::Entertainment->value);
            $table->string('visibility', 32)->default(LiveStreamVisibility::Public->value);
            $table->string('status', 32)->default(LiveStreamStatus::Scheduled->value);

            $table->string('stream_key')->unique();
            $table->string('rtmp_url');
            $table->unsignedInteger('viewer_count')->default(0);

            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamp('scheduled_start_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
            $table->index('status');
            $table->index('category');
            $table->index('visibility');
            $table->index('started_at');
            $table->index('scheduled_start_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_streams');
    }
};
