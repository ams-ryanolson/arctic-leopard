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
        Schema::table('ads', function (Blueprint $table) {
            $table->unsignedBigInteger('budget_amount')->nullable()->change();
            $table->char('budget_currency', 3)->nullable()->change();
            $table->string('pricing_model', 32)->nullable()->change();
            $table->unsignedBigInteger('pricing_rate')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            $table->unsignedBigInteger('budget_amount')->nullable(false)->change();
            $table->char('budget_currency', 3)->nullable(false)->change();
            $table->string('pricing_model', 32)->default('cpm')->nullable(false)->change();
            $table->unsignedBigInteger('pricing_rate')->nullable(false)->change();
        });
    }
};
