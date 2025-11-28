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
        Schema::table('posts', function (Blueprint $table) {
            $table->string('moderation_status', 32)->nullable()->after('published_at')->comment('pending, approved, rejected');
            $table->timestamp('moderated_at')->nullable()->after('moderation_status');
            $table->foreignId('moderated_by_id')->nullable()->after('moderated_at')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->text('moderation_notes')->nullable()->after('moderated_by_id');
            $table->text('rejection_reason')->nullable()->after('moderation_notes');

            $table->index('moderation_status');
            $table->index('moderated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['moderated_by_id']);
            $table->dropIndex(['moderation_status']);
            $table->dropIndex(['moderated_at']);

            $table->dropColumn([
                'moderation_status',
                'moderated_at',
                'moderated_by_id',
                'moderation_notes',
                'rejection_reason',
            ]);
        });
    }
};
