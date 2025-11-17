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
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->nullable()->after('image_url');
            $table->boolean('is_crowdfunded')->default(false)->after('quantity');
            $table->unsignedBigInteger('goal_amount')->nullable()->after('is_crowdfunded');
            $table->unsignedBigInteger('current_funding')->default(0)->after('goal_amount');
            $table->string('status')->default('active')->after('current_funding');
            $table->timestamp('expires_at')->nullable()->after('status');
            $table->timestamp('approved_at')->nullable()->after('expires_at');
            $table->softDeletes()->after('approved_at');

            $table->index('status');
            $table->index('expires_at');
            $table->index('approved_at');
            $table->index(['creator_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropIndex(['creator_id', 'status']);
            $table->dropIndex(['approved_at']);
            $table->dropIndex(['expires_at']);
            $table->dropIndex(['status']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'quantity',
                'is_crowdfunded',
                'goal_amount',
                'current_funding',
                'status',
                'expires_at',
                'approved_at',
            ]);
        });
    }
};
