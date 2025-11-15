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
        Schema::create('user_memberships', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_plan_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // active, expired, cancelled, pending
            $table->string('billing_type'); // recurring, one_time
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable(); // nullable for lifetime
            $table->timestamp('next_billing_at')->nullable(); // for recurring
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->unsignedBigInteger('original_price'); // in cents, at time of purchase
            $table->unsignedBigInteger('discount_amount')->default(0); // in cents, if any discount applied
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
            $table->index(['membership_plan_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_memberships');
    }
};
