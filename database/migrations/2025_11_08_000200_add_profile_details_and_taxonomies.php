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
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'display_name')) {
                $table->string('display_name', 150)->nullable()->after('name');
            }

            if (! Schema::hasColumn('users', 'pronouns')) {
                $table->string('pronouns', 100)->nullable()->after('display_name');
            }

            if (! Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable()->after('pronouns');
            }
        });

        Schema::create('interests', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('slug', 140)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('interest_user', function (Blueprint $table): void {
            $table->foreignId('interest_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['interest_id', 'user_id']);
        });

        Schema::create('hashtags', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('slug', 140)->unique();
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();
        });

        Schema::create('hashtag_user', function (Blueprint $table): void {
            $table->foreignId('hashtag_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['hashtag_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hashtag_user');
        Schema::dropIfExists('hashtags');
        Schema::dropIfExists('interest_user');
        Schema::dropIfExists('interests');

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'bio')) {
                $table->dropColumn('bio');
            }

            if (Schema::hasColumn('users', 'pronouns')) {
                $table->dropColumn('pronouns');
            }

            if (Schema::hasColumn('users', 'display_name')) {
                $table->dropColumn('display_name');
            }
        });
    }
};




