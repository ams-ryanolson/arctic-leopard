<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DiagnosePaymentTables extends Command
{
    protected $signature = 'diagnose:payment-tables';

    protected $description = 'Diagnose SE4 payment tables structure and active subscriptions';

    public function handle(): int
    {
        $this->info('🔍 Diagnosing SE4 Payment Tables...');
        $this->newLine();

        // 1. List all payment-related tables
        $this->info('📋 Payment-related tables:');
        $tables = DB::connection('se4')
            ->select("SHOW TABLES LIKE 'engine4_payment_%'");

        foreach ($tables as $table) {
            $tableName = array_values((array) $table)[0];
            $this->line("  - {$tableName}");
        }
        $this->newLine();

        // 2. Get structure of key tables
        $this->info('📊 Table Structures:');
        $this->newLine();

        $this->info('engine4_payment_subscriptions:');
        $subscriptionsStructure = DB::connection('se4')
            ->select('DESCRIBE engine4_payment_subscriptions');
        $this->table(
            ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
            array_map(fn ($col) => [
                $col->Field,
                $col->Type,
                $col->Null,
                $col->Key,
                $col->Default ?? 'NULL',
                $col->Extra ?? '',
            ], $subscriptionsStructure)
        );
        $this->newLine();

        $this->info('engine4_payment_packages:');
        $packagesStructure = DB::connection('se4')
            ->select('DESCRIBE engine4_payment_packages');
        $this->table(
            ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
            array_map(fn ($col) => [
                $col->Field,
                $col->Type,
                $col->Null,
                $col->Key,
                $col->Default ?? 'NULL',
                $col->Extra ?? '',
            ], $packagesStructure)
        );
        $this->newLine();

        $this->info('engine4_payment_gateways:');
        $gatewaysStructure = DB::connection('se4')
            ->select('DESCRIBE engine4_payment_gateways');
        $this->table(
            ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
            array_map(fn ($col) => [
                $col->Field,
                $col->Type,
                $col->Null,
                $col->Key,
                $col->Default ?? 'NULL',
                $col->Extra ?? '',
            ], $gatewaysStructure)
        );
        $this->newLine();

        // 3. Get all package IDs in use (excluding 5)
        $this->info('📦 Package IDs Currently in Use (excluding ID 5):');
        $packageCounts = DB::connection('se4')
            ->table('engine4_payment_subscriptions')
            ->select('package_id', DB::raw('COUNT(*) as count'))
            ->where('package_id', '!=', 5)
            ->groupBy('package_id')
            ->orderBy('package_id')
            ->get();

        if ($packageCounts->isEmpty()) {
            $this->warn('  No subscriptions found (excluding package ID 5)');
        } else {
            $this->table(
                ['Package ID', 'Subscription Count'],
                $packageCounts->map(fn ($p) => [$p->package_id, $p->count])->toArray()
            );
        }
        $this->newLine();

        // 4. Get active subscriptions by package ID
        $this->info('✅ Active Subscriptions by Package ID (excluding ID 5):');
        $activeCounts = DB::connection('se4')
            ->table('engine4_payment_subscriptions')
            ->select('package_id', DB::raw('COUNT(*) as count'))
            ->where('package_id', '!=', 5)
            ->where('active', 1) // Assuming 'active' column exists
            ->groupBy('package_id')
            ->orderBy('count', 'desc')
            ->get();

        if ($activeCounts->isEmpty()) {
            // Try alternative status column
            $this->warn('  No active subscriptions found with active=1, trying status column...');
            $activeCounts = DB::connection('se4')
                ->table('engine4_payment_subscriptions')
                ->select('package_id', 'status', DB::raw('COUNT(*) as count'))
                ->where('package_id', '!=', 5)
                ->groupBy('package_id', 'status')
                ->orderBy('package_id')
                ->orderBy('count', 'desc')
                ->get();

            if (! $activeCounts->isEmpty()) {
                $this->table(
                    ['Package ID', 'Status', 'Count'],
                    $activeCounts->map(fn ($p) => [$p->package_id, $p->status, $p->count])->toArray()
                );
            }
        } else {
            $this->table(
                ['Package ID', 'Active Count'],
                $activeCounts->map(fn ($p) => [$p->package_id, $p->count])->toArray()
            );
        }
        $this->newLine();

        // 5. Get package details
        $this->info('📋 Package Details:');
        $packages = DB::connection('se4')
            ->table('engine4_payment_packages')
            ->orderBy('package_id')
            ->get();

        if ($packages->isEmpty()) {
            $this->warn('  No packages found');
        } else {
            // Get column names dynamically
            $firstPackage = $packages->first();
            $columns = array_keys((array) $firstPackage);

            $this->table(
                $columns,
                $packages->map(fn ($p) => array_values((array) $p))->toArray()
            );
        }
        $this->newLine();

        // 6. Get sample subscription data
        $this->info('📄 Sample Subscription Data (first 5, excluding package 5):');
        $samples = DB::connection('se4')
            ->table('engine4_payment_subscriptions')
            ->where('package_id', '!=', 5)
            ->limit(5)
            ->get();

        if ($samples->isEmpty()) {
            $this->warn('  No sample subscriptions found');
        } else {
            $firstSample = $samples->first();
            $columns = array_keys((array) $firstSample);

            $this->table(
                $columns,
                $samples->map(fn ($s) => array_values((array) $s))->toArray()
            );
        }
        $this->newLine();

        // 7. Check gateway 102 (CCBill)
        $this->info('💳 Gateway 102 (CCBill) Details:');
        $gateway = DB::connection('se4')
            ->table('engine4_payment_gateways')
            ->where('gateway_id', 102)
            ->first();

        if ($gateway) {
            $columns = array_keys((array) $gateway);
            $this->table(
                ['Field', 'Value'],
                array_map(fn ($key, $value) => [$key, $value], $columns, array_values((array) $gateway))
            );
        } else {
            $this->warn('  Gateway 102 not found');
        }
        $this->newLine();

        // 8. Get subscription status breakdown
        $this->info('📊 Subscription Status Breakdown (excluding package 5):');
        $statusBreakdown = DB::connection('se4')
            ->table('engine4_payment_subscriptions')
            ->select('package_id', 'status', DB::raw('COUNT(*) as count'))
            ->where('package_id', '!=', 5)
            ->groupBy('package_id', 'status')
            ->orderBy('package_id')
            ->orderBy('count', 'desc')
            ->get();

        if (! $statusBreakdown->isEmpty()) {
            $this->table(
                ['Package ID', 'Status', 'Count'],
                $statusBreakdown->map(fn ($s) => [$s->package_id, $s->status ?? 'NULL', $s->count])->toArray()
            );
        } else {
            // Try with 'active' column if status doesn't exist
            $activeBreakdown = DB::connection('se4')
                ->table('engine4_payment_subscriptions')
                ->select('package_id', 'active', DB::raw('COUNT(*) as count'))
                ->where('package_id', '!=', 5)
                ->groupBy('package_id', 'active')
                ->orderBy('package_id')
                ->get();

            if (! $activeBreakdown->isEmpty()) {
                $this->table(
                    ['Package ID', 'Active', 'Count'],
                    $activeBreakdown->map(fn ($a) => [$a->package_id, $a->active ? 'Yes' : 'No', $a->count])->toArray()
                );
            }
        }

        // 9. Check engine4_payment_transactions table
        $this->info('💳 Payment Transactions Table Structure:');
        $transactionsTable = DB::connection('se4')
            ->select("SHOW TABLES LIKE 'engine4_payment_transactions'");

        if (! empty($transactionsTable)) {
            $transactionsStructure = DB::connection('se4')
                ->select('DESCRIBE engine4_payment_transactions');
            $this->table(
                ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
                array_map(fn ($col) => [
                    $col->Field,
                    $col->Type,
                    $col->Null,
                    $col->Key,
                    $col->Default ?? 'NULL',
                    $col->Extra ?? '',
                ], $transactionsStructure)
            );
            $this->newLine();

            // Sample transactions
            $this->info('📄 Sample Transactions (CCBill, first 5):');
            $sampleTransactions = DB::connection('se4')
                ->table('engine4_payment_transactions')
                ->where('gateway_id', 102)
                ->limit(5)
                ->get();

            if ($sampleTransactions->isNotEmpty()) {
                $firstSample = $sampleTransactions->first();
                $columns = array_keys((array) $firstSample);
                $this->table(
                    $columns,
                    $sampleTransactions->map(fn ($t) => array_values((array) $t))->toArray()
                );
            }
            $this->newLine();

            // Transaction stats
            $this->info('📊 Transaction Statistics (CCBill):');
            $transactionStats = DB::connection('se4')
                ->table('engine4_payment_transactions')
                ->where('gateway_id', 102)
                ->selectRaw('
                    COUNT(*) as total_transactions,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT gateway_transaction_id) as unique_gateway_transactions,
                    COUNT(DISTINCT order_id) as unique_orders
                ')
                ->first();

            if ($transactionStats) {
                $this->table(
                    ['Metric', 'Count'],
                    [
                        ['Total Transactions', $transactionStats->total_transactions],
                        ['Unique Users', $transactionStats->unique_users],
                        ['Unique Gateway Transaction IDs', $transactionStats->unique_gateway_transactions],
                        ['Unique Orders', $transactionStats->unique_orders],
                    ]
                );
            }
            $this->newLine();

            // Check relationship between subscriptions and transactions
            $this->info('🔗 Subscription-Transaction Relationship Sample:');
            $subscriptionTransactions = DB::connection('se4')
                ->table('engine4_payment_subscriptions as s')
                ->leftJoin('engine4_payment_transactions as t', function ($join) {
                    $join->on('s.user_id', '=', 't.user_id')
                        ->on('s.gateway_id', '=', 't.gateway_id');
                })
                ->where('s.gateway_id', 102)
                ->where('s.package_id', '!=', 5)
                ->select([
                    's.subscription_id',
                    's.user_id as sub_user_id',
                    's.package_id',
                    's.status as sub_status',
                    's.gateway_profile_id',
                    't.transaction_id',
                    't.gateway_transaction_id',
                    't.state as trans_state',
                    't.amount',
                    't.timestamp',
                ])
                ->limit(10)
                ->get();

            if ($subscriptionTransactions->isNotEmpty()) {
                $firstSample = $subscriptionTransactions->first();
                $columns = array_keys((array) $firstSample);
                $this->table(
                    $columns,
                    $subscriptionTransactions->map(fn ($st) => array_values((array) $st))->toArray()
                );
            }
            $this->newLine();
        } else {
            $this->warn('  engine4_payment_transactions table not found');
            $this->newLine();
        }

        // 10. Check engine4_payment_orders table if it exists
        $this->info('📦 Payment Orders Table:');
        $ordersTable = DB::connection('se4')
            ->select("SHOW TABLES LIKE 'engine4_payment_orders'");

        if (! empty($ordersTable)) {
            $ordersStructure = DB::connection('se4')
                ->select('DESCRIBE engine4_payment_orders');
            $this->table(
                ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
                array_map(fn ($col) => [
                    $col->Field,
                    $col->Type,
                    $col->Null,
                    $col->Key,
                    $col->Default ?? 'NULL',
                    $col->Extra ?? '',
                ], $ordersStructure)
            );
            $this->newLine();

            // Sample orders
            $this->info('📄 Sample Orders (first 5):');
            $sampleOrders = DB::connection('se4')
                ->table('engine4_payment_orders')
                ->limit(5)
                ->get();

            if ($sampleOrders->isNotEmpty()) {
                $firstSample = $sampleOrders->first();
                $columns = array_keys((array) $firstSample);
                $this->table(
                    $columns,
                    $sampleOrders->map(fn ($o) => array_values((array) $o))->toArray()
                );
            }
            $this->newLine();
        } else {
            $this->warn('  engine4_payment_orders table not found');
            $this->newLine();
        }

        return Command::SUCCESS;
    }
}
