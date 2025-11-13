<?php

use App\Enums\EventModality;
use App\Enums\EventRsvpStatus;
use App\Enums\EventStatus;
use App\Enums\EventType;
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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->uuid('series_id')->nullable();

            $table->foreignId('parent_event_id')
                ->nullable()
                ->constrained('events')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('created_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('submitted_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('manager_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('approved_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->string('status', 32)->default(EventStatus::Draft->value);
            $table->string('modality', 32)->default(EventModality::InPerson->value);
            $table->string('type', 32)->default(EventType::Party->value);

            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_rule')->nullable();

            $table->string('title');
            $table->string('slug')->unique();
            $table->string('subtitle')->nullable();

            $table->string('avatar_path')->nullable();
            $table->string('cover_path')->nullable();

            $table->mediumText('description');

            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->string('timezone', 64);

            $table->unsignedInteger('rsvp_limit')->nullable();
            $table->boolean('allow_guests')->default(false);

            $table->string('location_name')->nullable();
            $table->string('location_venue')->nullable();
            $table->string('location_address')->nullable();
            $table->string('location_city')->nullable();
            $table->string('location_region')->nullable();
            $table->string('location_postal_code')->nullable();
            $table->char('location_country', 2)->nullable();
            $table->decimal('location_latitude', 10, 7)->nullable();
            $table->decimal('location_longitude', 10, 7)->nullable();
            $table->string('virtual_meeting_url')->nullable();

            $table->json('requirements')->nullable();
            $table->json('extra_attributes')->nullable();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->text('submission_notes')->nullable();
            $table->text('admin_notes')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index('series_id');
            $table->index('status');
            $table->index('type');
            $table->index('modality');
            $table->index('starts_at');
        });

        Schema::create('event_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color')->nullable();
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });

        Schema::create('event_event_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('event_tag_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['event_id', 'event_tag_id']);
            $table->index(['event_tag_id', 'position']);
        });

        Schema::create('event_rsvps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->string('status', 24)->default(EventRsvpStatus::Going->value);
            $table->unsignedInteger('guest_count')->default(0);
            $table->timestamp('responded_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['event_id', 'user_id']);
            $table->index('status');
        });

        Schema::create('event_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('uploaded_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('disk', 64)->default('public');
            $table->string('path');
            $table->string('thumbnail_path')->nullable();
            $table->string('media_type', 32)->default('image');
            $table->string('title')->nullable();
            $table->text('caption')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['event_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_media');
        Schema::dropIfExists('event_rsvps');
        Schema::dropIfExists('event_event_tag');
        Schema::dropIfExists('event_tags');
        Schema::dropIfExists('events');
    }
};
