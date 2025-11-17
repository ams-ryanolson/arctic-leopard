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
        Schema::table('message_attachments', function (Blueprint $table) {
            if (! Schema::hasColumn('message_attachments', 'original_path')) {
                $table->string('original_path')->nullable()->after('path');
            }

            if (! Schema::hasColumn('message_attachments', 'optimized_path')) {
                $table->string('optimized_path')->nullable()->after('original_path');
            }

            if (! Schema::hasColumn('message_attachments', 'blur_path')) {
                $table->string('blur_path')->nullable()->after('optimized_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('message_attachments', function (Blueprint $table) {
            if (Schema::hasColumn('message_attachments', 'blur_path')) {
                $table->dropColumn('blur_path');
            }

            if (Schema::hasColumn('message_attachments', 'optimized_path')) {
                $table->dropColumn('optimized_path');
            }

            if (Schema::hasColumn('message_attachments', 'original_path')) {
                $table->dropColumn('original_path');
            }
        });
    }
};
