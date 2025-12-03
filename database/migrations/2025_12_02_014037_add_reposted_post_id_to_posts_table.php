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
            $table->foreignId('reposted_post_id')
                ->nullable()
                ->after('user_id')
                ->constrained('posts')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->index('reposted_post_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['reposted_post_id']);
            $table->dropIndex(['reposted_post_id']);
            $table->dropColumn('reposted_post_id');
        });
    }
};
