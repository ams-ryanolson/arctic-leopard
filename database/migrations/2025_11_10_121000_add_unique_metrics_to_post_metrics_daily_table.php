<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('post_metrics_daily', function (Blueprint $table): void {
            if (! Schema::hasColumn('post_metrics_daily', 'unique_viewers')) {
                $table->unsignedInteger('unique_viewers')->default(0)->after('views');
            }

            if (! Schema::hasColumn('post_metrics_daily', 'unique_authenticated_viewers')) {
                $table->unsignedInteger('unique_authenticated_viewers')->default(0)->after('unique_viewers');
            }

            if (! Schema::hasColumn('post_metrics_daily', 'unique_guest_viewers')) {
                $table->unsignedInteger('unique_guest_viewers')->default(0)->after('unique_authenticated_viewers');
            }

            if (! Schema::hasColumn('post_metrics_daily', 'country_breakdown')) {
                $table->json('country_breakdown')->nullable()->after('unique_guest_viewers');
            }
        });
    }

    public function down(): void
    {
        Schema::table('post_metrics_daily', function (Blueprint $table): void {
            if (Schema::hasColumn('post_metrics_daily', 'country_breakdown')) {
                $table->dropColumn('country_breakdown');
            }

            if (Schema::hasColumn('post_metrics_daily', 'unique_guest_viewers')) {
                $table->dropColumn('unique_guest_viewers');
            }

            if (Schema::hasColumn('post_metrics_daily', 'unique_authenticated_viewers')) {
                $table->dropColumn('unique_authenticated_viewers');
            }

            if (Schema::hasColumn('post_metrics_daily', 'unique_viewers')) {
                $table->dropColumn('unique_viewers');
            }
        });
    }
};
