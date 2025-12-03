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
        Schema::create('user_feature_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('feature_key'); // e.g., 'feature_ads_enabled'
            $table->boolean('enabled');
            $table->timestamps();

            $table->unique(['user_id', 'feature_key']);
            $table->index('feature_key');
        });

        Schema::create('role_feature_overrides', function (Blueprint $table) {
            $table->id();
            $table->string('role_name'); // e.g., 'Admin', 'Creator'
            $table->string('feature_key'); // e.g., 'feature_ads_enabled'
            $table->boolean('enabled');
            $table->timestamps();

            $table->unique(['role_name', 'feature_key']);
            $table->index('feature_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_feature_overrides');
        Schema::dropIfExists('user_feature_overrides');
    }
};
