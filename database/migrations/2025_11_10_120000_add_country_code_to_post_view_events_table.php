<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('post_view_events', function (Blueprint $table): void {
            if (! Schema::hasColumn('post_view_events', 'country_code')) {
                $table->char('country_code', 2)->nullable()->after('user_agent_hash');
            }

            $table->index(['post_id', 'country_code']);
        });
    }

    public function down(): void
    {
        Schema::table('post_view_events', function (Blueprint $table): void {
            $table->dropIndex(['post_id', 'country_code']);

            if (Schema::hasColumn('post_view_events', 'country_code')) {
                $table->dropColumn('country_code');
            }
        });
    }
};
