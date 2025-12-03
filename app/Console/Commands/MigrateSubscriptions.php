<?php

namespace App\Console\Commands;

use App\Enums\Payments\PaymentStatus;
use App\Enums\Payments\PaymentType;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\MigrationMapping;
use App\Models\Payments\Payment;
use App\Models\SE4PaymentOrder;
use App\Models\SE4PaymentSubscription;
use App\Models\SE4PaymentTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MigrateSubscriptions extends Command
{
    protected $signature = 'migrate:subscriptions
                            {--batch-size=100 : Number of subscriptions to process per batch}
                            {--limit= : Maximum number of subscriptions to migrate (for testing)}
                            {--dry-run : Show what would be migrated without making changes}
                            {--start-from= : Start from a specific SE4 subscription_id}
                            {--skip-payments : Skip creating Payment records (faster, less complete)}';

    protected $description = 'Migrate subscriptions from SocialEngine 4 to Laravel';

    /**
     * Package ID mapping to Laravel membership plans.
     * Key = SE4 package_id, Value = ['plan_slug' => 'bronze|silver|gold', 'role' => 'Bronze|Silver|Gold']
     *
     * Mapping Strategy:
     * - Bronze (21): Current active plan, $9.95/month
     * - Gold (13, 14, 15, 16): Lifetime packages (duration_type='forever'), $199.95-$250
     * - Silver (all others): Historical packages and recent non-recurring plans
     *   - Old packages (2-8, 10-12): Historical, no longer available, no transactions
     *   - Recent packages (17-20): Non-recurring plans from 2018-2025, closest to Silver pricing
     */
    protected array $packageMapping = [
        // Bronze - Current active plan
        21 => ['plan_slug' => 'bronze', 'role' => 'Bronze'],

        // Gold - Lifetime packages (no expiry)
        13 => ['plan_slug' => 'gold', 'role' => 'Gold'],  // Lifetime $250
        14 => ['plan_slug' => 'gold', 'role' => 'Gold'],  // Lifetime $249.95
        15 => ['plan_slug' => 'gold', 'role' => 'Gold'],  // Lifetime $199.95 (test plan)
        16 => ['plan_slug' => 'gold', 'role' => 'Gold'],  // Lifetime $250

        // Silver - All other packages (historical and recent non-recurring)
        // Old packages (2-8, 10-12): Historical, no longer available
        // Recent packages (17-20): Non-recurring plans from 2018-2025
        // Will be handled in getMembershipPlanForPackage() - defaults to Silver
    ];

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $batchSize = (int) $this->option('batch-size');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $startFrom = $this->option('start-from') ? (int) $this->option('start-from') : null;
        $skipPayments = $this->option('skip-payments');

        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $this->info('Starting subscription migration from SocialEngine 4...');

        // Verify Bronze, Silver, Gold plans exist (should already be created by seeder)
        $this->verifyMembershipPlansExist();

        // Get total count
        $query = SE4PaymentSubscription::query()
            ->where('package_id', '!=', 5); // Exclude free membership

        if ($startFrom) {
            $query->where('subscription_id', '>=', $startFrom);
        }

        $total = $query->count();

        if ($limit) {
            $total = min($total, $limit);
        }

        $this->info("Found {$total} subscriptions to migrate (excluding package 5)");

        if (! $this->confirm('Continue?', true)) {
            return Command::FAILURE;
        }

        $progressBar = $this->output->createProgressBar($total);
        $progressBar->start();

        $processed = 0;
        $skipped = 0;
        $errors = 0;
        $lastSubscriptionId = $startFrom ?: 0;
        $failedSubscriptions = [];
        $cancelled = false;

        // Handle interrupt signal (Ctrl+C)
        if (function_exists('pcntl_signal')) {
            pcntl_signal(SIGINT, function () use (&$cancelled) {
                $cancelled = true;
            });
        }

        while ($processed < $total && ! $cancelled) {
            // Check for signals if pcntl is available
            if (function_exists('pcntl_signal_dispatch')) {
                pcntl_signal_dispatch();
            }

            if ($cancelled) {
                $this->newLine(2);
                $this->warn('Migration cancelled by user (Ctrl+C)');
                break;
            }

            $batch = SE4PaymentSubscription::query()
                ->where('package_id', '!=', 5)
                ->where('subscription_id', '>', $lastSubscriptionId)
                ->with('package')
                ->orderBy('subscription_id')
                ->limit($batchSize)
                ->get();

            if ($batch->isEmpty()) {
                break;
            }

            foreach ($batch as $se4Subscription) {
                try {
                    $result = $this->migrateSubscription($se4Subscription, $dryRun, $skipPayments);

                    if ($result === 'skipped') {
                        $skipped++;
                    } elseif (is_array($result) && $result['status'] === 'error') {
                        $errors++;
                        $failedSubscriptions[] = [
                            'se4_id' => $se4Subscription->subscription_id,
                            'user_id' => $se4Subscription->user_id,
                            'package_id' => $se4Subscription->package_id,
                            'reason' => $result['reason'] ?? 'Unknown error',
                        ];
                    } else {
                        $processed++;
                    }

                    $lastSubscriptionId = $se4Subscription->subscription_id;
                } catch (\Exception $e) {
                    $errors++;
                    $simplifiedReason = $this->simplifyErrorMessage($e->getMessage());
                    $failedSubscriptions[] = [
                        'se4_id' => $se4Subscription->subscription_id,
                        'user_id' => $se4Subscription->user_id,
                        'package_id' => $se4Subscription->package_id,
                        'reason' => $simplifiedReason,
                    ];
                    $this->newLine();
                    $this->error("Error migrating subscription {$se4Subscription->subscription_id}: {$simplifiedReason}");
                }

                $progressBar->advance();

                if ($limit && ($processed + $skipped + $errors) >= $limit) {
                    break 2;
                }
            }
        }

        $progressBar->finish();
        $this->newLine(2);

        if ($cancelled) {
            $this->warn('Migration was cancelled.');
            $this->info("Last processed subscription ID: {$lastSubscriptionId}");
            $this->info('You can resume with: --start-from='.($lastSubscriptionId + 1));
        } else {
            $this->info('Migration complete!');
        }

        $this->table(
            ['Status', 'Count'],
            [
                ['Processed', $processed],
                ['Skipped', $skipped],
                ['Errors', $errors],
                ['Total', $processed + $skipped + $errors],
            ]
        );

        // Display failed subscriptions summary
        if (! empty($failedSubscriptions)) {
            $this->newLine();
            $this->error('Failed Subscriptions Summary:');
            $this->table(
                ['SE4 Subscription ID', 'SE4 User ID', 'Package ID', 'Reason'],
                array_map(fn ($sub) => [
                    $sub['se4_id'],
                    $sub['user_id'],
                    $sub['package_id'],
                    $sub['reason'],
                ], $failedSubscriptions)
            );
        }

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Verify Bronze, Silver, Gold membership plans exist.
     * These should already be created by the MembershipPlansSeeder.
     * We just verify they exist and warn if they don't.
     */
    protected function verifyMembershipPlansExist(): void
    {
        $requiredPlans = ['bronze', 'silver', 'gold'];
        $missingPlans = [];

        foreach ($requiredPlans as $slug) {
            $plan = MembershipPlan::where('slug', $slug)->first();
            if (! $plan) {
                $missingPlans[] = $slug;
            }
        }

        if (! empty($missingPlans)) {
            $this->error('Missing required membership plans: '.implode(', ', $missingPlans));
            $this->warn('Please run: php artisan db:seed --class=MembershipPlansSeeder');
            throw new \RuntimeException('Required membership plans not found. Please run the seeder first.');
        }

        // Also ensure roles exist (these should also be created by RolesAndPermissionsSeeder)
        $this->ensureRolesExist();
    }

    /**
     * Ensure Bronze, Silver, Gold roles exist.
     */
    protected function ensureRolesExist(): void
    {
        $roles = ['Bronze', 'Silver', 'Gold'];

        foreach ($roles as $roleName) {
            \Spatie\Permission\Models\Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web']
            );
        }
    }

    /**
     * Get the Laravel membership plan for a SE4 package.
     */
    protected function getMembershipPlanForPackage(int $packageId): ?MembershipPlan
    {
        // Check explicit mapping first
        if (isset($this->packageMapping[$packageId])) {
            $mapping = $this->packageMapping[$packageId];

            return MembershipPlan::where('slug', $mapping['plan_slug'])->first();
        }

        // Default to Silver for all other packages
        return MembershipPlan::where('slug', 'silver')->first();
    }

    /**
     * Migrate a single SE4 subscription to Laravel.
     *
     * @return string|array{status: string, reason: string}
     */
    protected function migrateSubscription(
        SE4PaymentSubscription $se4Subscription,
        bool $dryRun,
        bool $skipPayments
    ): string|array {
        // Check if already migrated
        $existing = MigrationMapping::getMapping('subscription', $se4Subscription->subscription_id);
        if ($existing) {
            return 'skipped';
        }

        // Get Laravel user ID
        $userMapping = MigrationMapping::getMapping('user', $se4Subscription->user_id);
        if (! $userMapping) {
            return [
                'status' => 'error',
                'reason' => 'User not migrated yet',
            ];
        }

        $laravelUserId = $userMapping->target_id;
        $user = \App\Models\User::find($laravelUserId);
        if (! $user) {
            return [
                'status' => 'error',
                'reason' => 'Laravel user not found',
            ];
        }

        // Get membership plan
        $plan = $this->getMembershipPlanForPackage($se4Subscription->package_id);
        if (! $plan) {
            return [
                'status' => 'error',
                'reason' => 'Membership plan not found for package '.$se4Subscription->package_id,
            ];
        }

        // Determine status
        $status = $this->mapStatus($se4Subscription->status, $se4Subscription->active, $se4Subscription->expiration_date);

        // Determine billing type (SE4 doesn't have this, but we can infer from package)
        $billingType = $se4Subscription->package && $se4Subscription->package->recurrence_type === 'forever'
            ? 'one_time'
            : 'recurring';

        // Calculate dates
        $startsAt = $se4Subscription->creation_date ?? now();
        $endsAt = null;

        // Lifetime packages (Gold) have no expiry
        $isLifetime = in_array($se4Subscription->package_id, [13, 14, 15, 16]);

        if ($isLifetime) {
            // Lifetime memberships never expire
            $endsAt = null;
        } elseif ($se4Subscription->expiration_date) {
            // Use the expiration date from SE4
            $endsAt = $se4Subscription->expiration_date;
        } elseif ($se4Subscription->package) {
            // Calculate expiration based on package duration if no expiration_date set
            $package = $se4Subscription->package;
            if ($package->duration > 0 && $package->duration_type !== 'forever') {
                $endsAt = $startsAt->copy();
                match ($package->duration_type) {
                    'day' => $endsAt->addDays($package->duration),
                    'week' => $endsAt->addWeeks($package->duration),
                    'month' => $endsAt->addMonths($package->duration),
                    'year' => $endsAt->addYears($package->duration),
                    default => null,
                };
            }
        }

        // Calculate price (convert from decimal to cents)
        $originalPrice = $se4Subscription->package
            ? (int) ($se4Subscription->package->price * 100)
            : 0;

        // Find transactions for dry-run display
        $orders = SE4PaymentOrder::where('source_type', 'payment_subscription')
            ->where('source_id', $se4Subscription->subscription_id)
            ->where('gateway_id', 102)
            ->get();

        $transactions = collect();
        foreach ($orders as $order) {
            $orderTransactions = SE4PaymentTransaction::where('order_id', $order->order_id)
                ->where('gateway_id', 102)
                ->where('state', 'okay')
                ->orderBy('timestamp')
                ->get();
            $transactions = $transactions->merge($orderTransactions);
        }
        $transactions = $transactions->sortBy('timestamp')->values();

        if ($dryRun) {
            $this->newLine();
            $this->line("Would migrate subscription: {$se4Subscription->subscription_id}");
            $this->line("  User: {$se4Subscription->user_id} → Laravel User {$laravelUserId}");
            $this->line("  Package: {$se4Subscription->package_id} → {$plan->name} ({$plan->slug})");
            $this->line("  Status: {$se4Subscription->status} (active: {$se4Subscription->active}) → {$status}");
            $this->line("  Dates: {$startsAt} → ".($endsAt ?: 'Never (lifetime)'));
            $this->line("  Price: \${$se4Subscription->package->price} → {$originalPrice} cents");
            $this->line("  Transactions found: {$transactions->count()}");
            if ($transactions->isNotEmpty()) {
                foreach ($transactions as $idx => $tx) {
                    $this->line('    Transaction '.($idx + 1).": {$tx->gateway_transaction_id} - \${$tx->amount} ({$tx->timestamp})");
                }
            }

            return 'success';
        }

        DB::beginTransaction();
        try {
            // Find all transactions related to this subscription via orders
            // Subscription → Orders (source_type='payment_subscription', source_id=subscription_id) → Transactions (order_id)
            $orders = SE4PaymentOrder::where('source_type', 'payment_subscription')
                ->where('source_id', $se4Subscription->subscription_id)
                ->where('gateway_id', 102) // CCBill only
                ->get();

            $transactions = collect();
            foreach ($orders as $order) {
                $orderTransactions = SE4PaymentTransaction::where('order_id', $order->order_id)
                    ->where('gateway_id', 102) // CCBill only
                    ->where('state', 'okay') // Only successful transactions
                    ->orderBy('timestamp')
                    ->get();
                $transactions = $transactions->merge($orderTransactions);
            }

            // Sort all transactions by timestamp
            $transactions = $transactions->sortBy('timestamp')->values();

            // Create Payment records for each transaction (if not skipping)
            $payments = collect();
            $primaryPayment = null;
            $allTransactionIds = [];

            if (! $skipPayments && $transactions->isNotEmpty()) {
                foreach ($transactions as $transaction) {
                    // Convert amount from decimal to cents
                    $amountInCents = (int) ($transaction->amount * 100);

                    // Determine payment status based on transaction state
                    $paymentStatus = match ($transaction->state) {
                        'okay' => PaymentStatus::Captured,
                        'pending' => PaymentStatus::Pending,
                        'failed' => PaymentStatus::Failed,
                        default => PaymentStatus::Pending,
                    };

                    // Validate and sanitize transaction timestamp
                    $transactionTimestamp = $this->validateAndSanitizeDate($transaction->timestamp);
                    if (! $transactionTimestamp) {
                        // Skip transactions with invalid dates, but log it
                        $this->warn("Skipping transaction {$transaction->transaction_id} for subscription {$se4Subscription->subscription_id}: invalid timestamp");

                        continue;
                    }

                    $payment = Payment::create([
                        'payable_type' => MembershipPlan::class,
                        'payable_id' => $plan->id,
                        'payer_id' => $laravelUserId,
                        'payee_id' => null,
                        'type' => PaymentType::OneTime,
                        'status' => $paymentStatus,
                        'amount' => $amountInCents,
                        'fee_amount' => 0,
                        'net_amount' => $amountInCents,
                        'currency' => strtoupper($transaction->currency ?: 'USD'),
                        'method' => 'ccbill',
                        'provider' => 'ccbill',
                        'provider_payment_id' => $transaction->gateway_transaction_id, // CCBill transaction ID
                        'provider_customer_id' => $se4Subscription->gateway_profile_id, // CCBill profile ID
                        'metadata' => [
                            'se4_subscription_id' => $se4Subscription->subscription_id,
                            'se4_package_id' => $se4Subscription->package_id,
                            'se4_gateway_id' => $se4Subscription->gateway_id,
                            'se4_transaction_id' => $transaction->transaction_id,
                            'se4_order_id' => $transaction->order_id,
                            'se4_gateway_transaction_id' => $transaction->gateway_transaction_id,
                            'se4_transaction_type' => $transaction->type,
                            'se4_transaction_state' => $transaction->state,
                            'se4_timestamp' => $transaction->timestamp?->toIso8601String(),
                        ],
                        'authorized_at' => $transactionTimestamp,
                        'captured_at' => $transaction->state === 'okay' ? $transactionTimestamp : null,
                        'succeeded_at' => $transaction->state === 'okay' ? $transactionTimestamp : null,
                    ]);

                    $payments->push($payment);
                    $allTransactionIds[] = $transaction->gateway_transaction_id;

                    // First successful transaction is the primary payment
                    if (! $primaryPayment && $transaction->state === 'okay') {
                        $primaryPayment = $payment;
                    }
                }
            }

            // If no transactions found, create a payment from subscription data (fallback)
            // Use payment_date if available, otherwise use creation_date
            if (! $skipPayments && $transactions->isEmpty()) {
                // Try payment_date first, fallback to creation_date
                $fallbackDate = $this->validateAndSanitizeDate($se4Subscription->payment_date)
                    ?? $this->validateAndSanitizeDate($se4Subscription->creation_date)
                    ?? now(); // Last resort: use current date

                $primaryPayment = Payment::create([
                    'payable_type' => MembershipPlan::class,
                    'payable_id' => $plan->id,
                    'payer_id' => $laravelUserId,
                    'payee_id' => null,
                    'type' => PaymentType::OneTime,
                    'status' => PaymentStatus::Captured,
                    'amount' => $originalPrice,
                    'fee_amount' => 0,
                    'net_amount' => $originalPrice,
                    'currency' => 'USD',
                    'method' => 'ccbill',
                    'provider' => 'ccbill',
                    'provider_payment_id' => $se4Subscription->gateway_profile_id ?: 'se4_sub_'.$se4Subscription->subscription_id, // Fallback to subscription ID
                    'provider_customer_id' => $se4Subscription->gateway_profile_id,
                    'metadata' => [
                        'se4_subscription_id' => $se4Subscription->subscription_id,
                        'se4_package_id' => $se4Subscription->package_id,
                        'se4_gateway_id' => $se4Subscription->gateway_id,
                        'se4_payment_date' => $se4Subscription->payment_date?->toIso8601String(),
                        'se4_creation_date' => $se4Subscription->creation_date?->toIso8601String(),
                        'note' => 'Created from subscription data - no transactions found',
                        'payment_data_source' => $se4Subscription->payment_date ? 'payment_date' : 'creation_date',
                    ],
                    'authorized_at' => $fallbackDate,
                    'captured_at' => $fallbackDate,
                    'succeeded_at' => $fallbackDate,
                ]);
                $payments->push($primaryPayment);
            }

            // Create UserMembership
            $membership = UserMembership::create([
                'user_id' => $laravelUserId,
                'membership_plan_id' => $plan->id,
                'status' => $status,
                'billing_type' => $billingType,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt, // null for lifetime
                'next_billing_at' => null, // SE4 doesn't track this for non-recurring
                'cancelled_at' => $se4Subscription->status === 'cancelled' ? ($se4Subscription->modified_date ?? $startsAt) : null,
                'cancellation_reason' => $se4Subscription->status === 'cancelled' ? 'Migrated from SE4' : null,
                'payment_id' => $primaryPayment?->id,
                'original_price' => $originalPrice,
                'discount_amount' => 0,
                'metadata' => [
                    'se4_subscription_id' => $se4Subscription->subscription_id,
                    'se4_package_id' => $se4Subscription->package_id,
                    'se4_status' => $se4Subscription->status,
                    'se4_active' => $se4Subscription->active,
                    'se4_gateway_id' => $se4Subscription->gateway_id,
                    'se4_gateway_profile_id' => $se4Subscription->gateway_profile_id,
                    'se4_notes' => $se4Subscription->notes,
                    'se4_transaction_count' => $transactions->count(),
                    'se4_all_transaction_ids' => $allTransactionIds, // All CCBill transaction IDs for purchase history
                    'se4_payment_count' => $payments->count(),
                ],
            ]);

            // Create migration mapping
            MigrationMapping::setMapping(
                'subscription',
                $se4Subscription->subscription_id,
                UserMembership::class,
                $membership->id,
                [
                    'se4_package_id' => $se4Subscription->package_id,
                    'se4_user_id' => $se4Subscription->user_id,
                ]
            );

            // Assign role if membership is active
            if ($status === 'active' && $plan->role_to_assign) {
                try {
                    $role = \Spatie\Permission\Models\Role::findByName($plan->role_to_assign, 'web');
                    if ($role && ! $user->hasRole($role)) {
                        $user->assignRole($role);
                    }
                } catch (\Exception $e) {
                    // Role might not exist yet, log but don't fail
                    $this->warn("Could not assign role {$plan->role_to_assign}: {$e->getMessage()}");
                }
            }

            DB::commit();

            return 'success';
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Map SE4 subscription status to Laravel membership status.
     */
    protected function mapStatus(string $se4Status, bool $active, ?\DateTime $expirationDate): string
    {
        // If explicitly active in SE4
        if ($active && $se4Status === 'active') {
            // Check if expired
            if ($expirationDate && $expirationDate < now()) {
                return 'expired';
            }

            return 'active';
        }

        // Map SE4 statuses
        return match ($se4Status) {
            'active' => 'active',
            'expired' => 'expired',
            'cancelled' => 'cancelled',
            'refunded' => 'cancelled',
            'overdue' => 'expired',
            'pending' => 'pending',
            'trial' => 'active',
            'initial' => 'pending',
            default => 'expired',
        };
    }

    /**
     * Validate and sanitize a date value for MySQL compatibility.
     * MySQL datetime range: '1000-01-01 00:00:00' to '9999-12-31 23:59:59'
     * Returns null if date is invalid or out of range.
     */
    protected function validateAndSanitizeDate(?\DateTime $date): ?\DateTime
    {
        if (! $date) {
            return null;
        }

        // Check if date is within MySQL's valid datetime range
        $minDate = new \DateTime('1000-01-01 00:00:00');
        $maxDate = new \DateTime('9999-12-31 23:59:59');

        if ($date < $minDate || $date > $maxDate) {
            return null;
        }

        // Additional check for obviously invalid dates (like year -0001)
        $year = (int) $date->format('Y');
        if ($year < 1000 || $year > 9999) {
            return null;
        }

        return $date;
    }

    /**
     * Simplify error messages.
     */
    protected function simplifyErrorMessage(string $errorMessage): string
    {
        if (preg_match('/SQLSTATE\[(.*?)\].*?Field \'(.*?)\' doesn\'t have a default value/', $errorMessage, $matches)) {
            return 'Missing required field: '.$matches[2];
        }
        if (preg_match('/SQLSTATE\[(.*?)\].*?Duplicate entry \'(.*?)\' for key \'(.*?)\'/', $errorMessage, $matches)) {
            return 'Duplicate entry: '.$matches[2].' for '.$matches[3];
        }
        if (preg_match('/UNIQUE constraint failed: ([^)]+)/', $errorMessage, $matches)) {
            return 'Unique constraint violation: '.$matches[1];
        }
        if (preg_match('/NOT NULL constraint failed: ([^)]+)/', $errorMessage, $matches)) {
            return 'Required field is null: '.$matches[1];
        }
        if (preg_match('/SQLSTATE\[(.*?)\].*?Unknown column \'(.*?)\'/', $errorMessage, $matches)) {
            return 'Unknown column: '.$matches[2];
        }
        if (preg_match('/SQLSTATE\[22007\].*?Invalid datetime format.*?column \'(.*?)\'/', $errorMessage, $matches)) {
            return 'Invalid date format in column: '.$matches[1];
        }

        return Str::limit($errorMessage, 200);
    }
}
