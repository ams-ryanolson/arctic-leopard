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
        Schema::create('ad_placements', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('allowed_sizes')->nullable();
            $table->unsignedInteger('default_weight')->default(100);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('is_active');
        });

        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('advertiser_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('name');
            $table->string('status', 32)->default('draft');
            $table->timestamp('start_date');
            $table->timestamp('end_date')->nullable();
            $table->unsignedBigInteger('total_budget');
            $table->char('currency', 3);
            $table->unsignedBigInteger('spent_amount')->default(0);
            $table->string('pacing_strategy', 32)->default('standard');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['advertiser_id', 'status']);
            $table->index('status');
            $table->index('start_date');
        });

        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('advertiser_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('campaign_id')
                ->nullable()
                ->constrained('ad_campaigns')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('name');
            $table->string('status', 32)->default('draft');
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->unsignedBigInteger('max_impressions')->nullable();
            $table->unsignedBigInteger('max_clicks')->nullable();
            $table->unsignedBigInteger('daily_impression_cap')->nullable();
            $table->unsignedBigInteger('daily_click_cap')->nullable();
            $table->unsignedBigInteger('budget_amount');
            $table->char('budget_currency', 3);
            $table->unsignedBigInteger('spent_amount')->default(0);
            $table->string('pricing_model', 32)->default('cpm');
            $table->unsignedBigInteger('pricing_rate');
            $table->json('targeting')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['advertiser_id', 'status']);
            $table->index(['campaign_id', 'status']);
            $table->index('status');
            $table->index(['start_date', 'end_date']);
        });

        Schema::create('ad_creatives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')
                ->constrained('ads')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('placement', 64);
            $table->string('size', 32);
            $table->string('asset_type', 32)->default('image');
            $table->string('asset_path')->nullable();
            $table->string('asset_url')->nullable();
            $table->string('headline')->nullable();
            $table->text('body_text')->nullable();
            $table->string('cta_text')->nullable();
            $table->string('cta_url');
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('review_status', 32)->default('pending');
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['ad_id', 'placement', 'is_active']);
            $table->index(['ad_id', 'display_order']);
            $table->index('review_status');
        });

        Schema::create('ad_impressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')
                ->constrained('ads')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('ad_creative_id')
                ->constrained('ad_creatives')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('placement', 64);
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('session_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('referrer')->nullable();
            $table->timestamp('viewed_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['ad_id', 'viewed_at']);
            $table->index(['user_id', 'viewed_at']);
            $table->index(['placement', 'viewed_at']);
            $table->index('viewed_at');
        });

        Schema::create('ad_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')
                ->constrained('ads')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('ad_creative_id')
                ->constrained('ad_creatives')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('impression_id')
                ->nullable()
                ->constrained('ad_impressions')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('placement', 64);
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('session_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('clicked_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['ad_id', 'clicked_at']);
            $table->index(['user_id', 'clicked_at']);
            $table->index('impression_id');
            $table->index('clicked_at');
        });

        Schema::create('ad_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')
                ->nullable()
                ->constrained('ads')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('campaign_id')
                ->nullable()
                ->constrained('ad_campaigns')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('placement', 64)->nullable();
            $table->date('report_date');
            $table->string('report_type', 32)->default('daily');
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->unsignedBigInteger('spend')->default(0);
            $table->decimal('ctr', 5, 4)->nullable();
            $table->unsignedBigInteger('cpm')->nullable();
            $table->unsignedBigInteger('cpc')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->index(['ad_id', 'report_date']);
            $table->index(['campaign_id', 'report_date']);
            $table->index('report_date');
            $table->index('report_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ad_reports');
        Schema::dropIfExists('ad_clicks');
        Schema::dropIfExists('ad_impressions');
        Schema::dropIfExists('ad_creatives');
        Schema::dropIfExists('ads');
        Schema::dropIfExists('ad_campaigns');
        Schema::dropIfExists('ad_placements');
    }
};
