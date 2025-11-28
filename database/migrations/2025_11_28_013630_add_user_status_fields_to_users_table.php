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
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable()->after('creator_status_disabled_at');
            $table->timestamp('suspended_until')->nullable()->after('suspended_at');
            $table->text('suspended_reason')->nullable()->after('suspended_until');
            $table->foreignId('suspended_by_id')->nullable()->after('suspended_reason')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->timestamp('banned_at')->nullable()->after('suspended_by_id');
            $table->text('banned_reason')->nullable()->after('banned_at');
            $table->foreignId('banned_by_id')->nullable()->after('banned_reason')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->unsignedInteger('warning_count')->default(0)->after('banned_by_id');
            $table->timestamp('last_warned_at')->nullable()->after('warning_count');

            $table->index('suspended_at');
            $table->index('suspended_until');
            $table->index('banned_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['suspended_by_id']);
            $table->dropForeign(['banned_by_id']);
            $table->dropIndex(['suspended_at']);
            $table->dropIndex(['suspended_until']);
            $table->dropIndex(['banned_at']);

            $table->dropColumn([
                'suspended_at',
                'suspended_until',
                'suspended_reason',
                'suspended_by_id',
                'banned_at',
                'banned_reason',
                'banned_by_id',
                'warning_count',
                'last_warned_at',
            ]);
        });
    }
};
