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
        Schema::table('users', function (Blueprint $table) {
            $table->string('location_city')->nullable()->change();
            $table->string('location_country')->nullable()->change();
            $table->decimal('location_latitude', 10, 7)->nullable()->change();
            $table->decimal('location_longitude', 10, 7)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('location_city')->nullable(false)->change();
            $table->string('location_country')->nullable(false)->change();
            $table->decimal('location_latitude', 10, 7)->nullable(false)->change();
            $table->decimal('location_longitude', 10, 7)->nullable(false)->change();
        });
    }
};
