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
        Schema::create('membership_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_plan_id')->nullable()->constrained()->nullOnDelete(); // null = applies to all
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('discount_type'); // percentage, fixed_amount
            $table->unsignedBigInteger('discount_value'); // percentage or cents
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['code', 'is_active']);
            $table->index(['membership_plan_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_discounts');
    }
};
