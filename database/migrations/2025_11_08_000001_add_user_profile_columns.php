<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username')->unique()->after('id');
            }

            if (! Schema::hasColumn('users', 'username_lower')) {
                $table->string('username_lower')->unique()->after('username');
            }

            if (! Schema::hasColumn('users', 'birthdate')) {
                $table->date('birthdate')->nullable()->after('email_verified_at');
            }

            if (! Schema::hasColumn('users', 'location_city')) {
                $table->string('location_city')->nullable()->after('birthdate');
            }

            if (! Schema::hasColumn('users', 'location_region')) {
                $table->string('location_region')->nullable()->after('location_city');
            }

            if (! Schema::hasColumn('users', 'location_country')) {
                $table->string('location_country')->nullable()->after('location_region');
            }

            if (! Schema::hasColumn('users', 'location_latitude')) {
                $table->decimal('location_latitude', 10, 7)->nullable()->after('location_country');
            }

            if (! Schema::hasColumn('users', 'location_longitude')) {
                $table->decimal('location_longitude', 10, 7)->nullable()->after('location_latitude');
            }

            if (! Schema::hasColumn('users', 'accepted_terms_at')) {
                $table->timestamp('accepted_terms_at')->nullable()->after('location_longitude');
            }

            if (! Schema::hasColumn('users', 'accepted_privacy_at')) {
                $table->timestamp('accepted_privacy_at')->nullable()->after('accepted_terms_at');
            }

            if (! Schema::hasColumn('users', 'profile_completed_at')) {
                $table->timestamp('profile_completed_at')->nullable()->after('accepted_privacy_at');
            }
        });

        DB::table('users')
            ->select('id', 'username', 'email')
            ->orderBy('id')
            ->each(function ($user): void {
                $username = $user->username ?? Str::before((string) $user->email, '@') ?? 'user'.$user->id;
                $username = Str::of($username)
                    ->lower()
                    ->replaceMatches('/[^a-z0-9._-]/', '')
                    ->trim('-_.');

                if ($username->isEmpty()) {
                    $username = Str::of('user'.$user->id);
                }

                $base = Str::limit((string) $username, 30, '');
                $candidate = (string) $base;
                $counter = 1;

                while (DB::table('users')
                    ->where('id', '<>', $user->id)
                    ->where('username_lower', Str::lower($candidate))
                    ->exists()) {
                    $candidate = Str::limit($base.'_'.$counter, 30, '');
                    $counter++;
                }

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'username' => $candidate,
                        'username_lower' => Str::lower($candidate),
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'profile_completed_at')) {
                $table->dropColumn('profile_completed_at');
            }

            if (Schema::hasColumn('users', 'accepted_privacy_at')) {
                $table->dropColumn('accepted_privacy_at');
            }

            if (Schema::hasColumn('users', 'accepted_terms_at')) {
                $table->dropColumn('accepted_terms_at');
            }

            if (Schema::hasColumn('users', 'location_longitude')) {
                $table->dropColumn('location_longitude');
            }

            if (Schema::hasColumn('users', 'location_latitude')) {
                $table->dropColumn('location_latitude');
            }

            if (Schema::hasColumn('users', 'location_country')) {
                $table->dropColumn('location_country');
            }

            if (Schema::hasColumn('users', 'location_region')) {
                $table->dropColumn('location_region');
            }

            if (Schema::hasColumn('users', 'location_city')) {
                $table->dropColumn('location_city');
            }

            if (Schema::hasColumn('users', 'birthdate')) {
                $table->dropColumn('birthdate');
            }

            if (Schema::hasColumn('users', 'username_lower')) {
                $table->dropColumn('username_lower');
            }

            if (Schema::hasColumn('users', 'username')) {
                $table->dropColumn('username');
            }
        });
    }
};
