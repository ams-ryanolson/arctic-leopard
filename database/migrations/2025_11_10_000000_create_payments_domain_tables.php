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
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('amount');
            $table->char('currency', 3);
            $table->string('interval');
            $table->unsignedInteger('interval_count')->default(1);
            $table->unsignedInteger('trial_days')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['creator_id', 'slug']);
        });

        Schema::create('subscription_plan_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('value')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('type');
            $table->string('brand')->nullable();
            $table->string('label')->nullable();
            $table->string('last_four', 4)->nullable();
            $table->string('exp_month', 2)->nullable();
            $table->string('exp_year', 4)->nullable();
            $table->boolean('is_default')->default(false);
            $table->string('status')->default('active');
            $table->string('fingerprint')->nullable();
            $table->string('provider_account_id')->nullable();
            $table->string('provider_method_id')->nullable();
            $table->json('billing_address')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'provider', 'status']);
            $table->unique(['provider', 'provider_method_id']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->morphs('payable');
            $table->foreignId('payer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('payee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type'); // one_time, recurring, adjustment, etc.
            $table->string('status'); // pending, authorized, captured, settled, failed, refunded, cancelled
            $table->unsignedBigInteger('amount');
            $table->unsignedBigInteger('fee_amount')->default(0);
            $table->unsignedBigInteger('net_amount')->default(0);
            $table->char('currency', 3);
            $table->string('method')->nullable();
            $table->string('provider')->nullable();
            $table->string('provider_payment_id')->nullable();
            $table->string('provider_customer_id')->nullable();
            $table->foreignId('payment_method_id')->nullable()->constrained()->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('succeeded_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['provider', 'provider_payment_id']);
            $table->index(['payer_id', 'status']);
            $table->index(['payee_id', 'status']);
        });

        Schema::create('payment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->morphs('payable');
            $table->string('description')->nullable();
            $table->unsignedBigInteger('amount');
            $table->unsignedInteger('quantity')->default(1);
            $table->json('metadata')->nullable();
            $table->timestamps();

        });

        Schema::create('payment_intents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->morphs('payable');
            $table->foreignId('payer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('payee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('amount');
            $table->char('currency', 3);
            $table->string('type')->nullable();
            $table->string('method')->nullable();
            $table->string('status'); // pending, requires_method, requires_confirmation, processing, succeeded, cancelled
            $table->string('provider')->nullable();
            $table->string('provider_intent_id')->nullable();
            $table->string('client_secret')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['provider', 'provider_intent_id']);
            $table->index(['payer_id', 'status']);
        });

        Schema::create('payment_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('subscriber_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('payment_method_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status'); // pending, trialing, active, past_due, cancelled, expired
            $table->string('provider')->nullable();
            $table->string('provider_subscription_id')->nullable();
            $table->boolean('auto_renews')->default(true);
            $table->unsignedBigInteger('amount');
            $table->char('currency', 3);
            $table->string('interval');
            $table->unsignedInteger('interval_count')->default(1);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('grace_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['subscriber_id', 'creator_id', 'subscription_plan_id'], 'subscription_unique_per_plan');
            $table->index(['provider', 'provider_subscription_id'], 'subscription_provider_index');
        });

        Schema::create('payment_refunds', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->char('currency', 3);
            $table->string('status'); // pending, processing, succeeded, failed
            $table->string('reason')->nullable();
            $table->string('provider')->nullable();
            $table->string('provider_refund_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['provider', 'provider_refund_id']);
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // credit, debit, adjustment
            $table->unsignedBigInteger('amount');
            $table->char('currency', 3);
            $table->bigInteger('balance_after')->nullable();
            $table->morphs('source');
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->string('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'occurred_at']);
        });

        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('ledger')->default('general');
            $table->morphs('ledgerable');
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->enum('direction', ['debit', 'credit']);
            $table->unsignedBigInteger('amount');
            $table->char('currency', 3);
            $table->bigInteger('balance_after')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['ledger', 'occurred_at']);
        });

        Schema::create('payment_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('provider');
            $table->string('event')->nullable();
            $table->string('signature')->nullable();
            $table->json('headers')->nullable();
            $table->longText('payload');
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->string('status')->default('pending');
            $table->text('exception')->nullable();
            $table->timestamps();

            $table->index(['provider', 'status']);
            $table->index(['received_at']);
        });

        Schema::create('payment_gateway_configs', function (Blueprint $table) {
            $table->id();
            $table->morphs('configurable');
            $table->string('provider');
            $table->boolean('is_default')->default(false);
            $table->string('status')->default('active');
            $table->json('settings');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['configurable_type', 'configurable_id', 'provider'], 'configurable_provider_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_configs');
        Schema::dropIfExists('payment_webhooks');
        Schema::dropIfExists('ledger_entries');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('payment_refunds');
        Schema::dropIfExists('payment_subscriptions');
        Schema::dropIfExists('payment_intents');
        Schema::dropIfExists('payment_items');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('subscription_plan_features');
        Schema::dropIfExists('subscription_plans');
    }
};

