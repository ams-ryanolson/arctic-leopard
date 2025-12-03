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
        Schema::table('conversation_participants', function (Blueprint $table): void {
            $table->index(['user_id', 'left_at', 'last_read_message_id'], 'conv_participants_unread_idx');
        });

        Schema::table('messages', function (Blueprint $table): void {
            if (! $this->indexExists('messages', 'messages_conv_id_idx')) {
                $table->index(['conversation_id', 'id'], 'messages_conv_id_idx');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversation_participants', function (Blueprint $table): void {
            $table->dropIndex('conv_participants_unread_idx');
        });

        Schema::table('messages', function (Blueprint $table): void {
            $table->dropIndex('messages_conv_id_idx');
        });
    }

    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();
        $tableName = $connection->getTablePrefix().$table;

        if ($driver === 'sqlite') {
            $result = $connection->select(
                "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND tbl_name=? AND name=?",
                [$tableName, $index]
            );
        } else {
            // MySQL/MariaDB
            $databaseName = $connection->getDatabaseName();
            $result = $connection->select(
                'SELECT COUNT(*) as count FROM information_schema.statistics 
                 WHERE table_schema = ? AND table_name = ? AND index_name = ?',
                [$databaseName, $tableName, $index]
            );
        }

        return $result[0]->count > 0;
    }
};
