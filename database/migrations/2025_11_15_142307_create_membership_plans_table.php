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
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('monthly_price'); // in cents
            $table->unsignedBigInteger('yearly_price'); // in cents
            $table->char('currency', 3)->default('USD');
            $table->string('role_to_assign'); // Premium, Elite, or Unlimited
            $table->json('permissions_to_grant')->nullable(); // array of permission names
            $table->json('features')->nullable(); // {"feature_key": "description"}
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('allows_recurring')->default(true);
            $table->boolean('allows_one_time')->default(true);
            $table->unsignedInteger('one_time_duration_days')->nullable(); // for one-time purchases
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_plans');
    }
};
