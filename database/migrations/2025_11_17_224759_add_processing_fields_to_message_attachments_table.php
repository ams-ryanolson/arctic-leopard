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
            if (! Schema::hasColumn('message_attachments', 'processing_status')) {
                $table->enum('processing_status', ['pending', 'completed', 'failed'])
                    ->nullable()
                    ->after('transcode_job');
            }

            if (! Schema::hasColumn('message_attachments', 'processing_meta')) {
                $table->json('processing_meta')->nullable()->after('processing_status');
            }

            if (! Schema::hasColumn('message_attachments', 'processing_error')) {
                $table->text('processing_error')->nullable()->after('processing_meta');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('message_attachments', function (Blueprint $table) {
            if (Schema::hasColumn('message_attachments', 'processing_error')) {
                $table->dropColumn('processing_error');
            }

            if (Schema::hasColumn('message_attachments', 'processing_meta')) {
                $table->dropColumn('processing_meta');
            }

            if (Schema::hasColumn('message_attachments', 'processing_status')) {
                $table->dropColumn('processing_status');
            }
        });
    }
};
