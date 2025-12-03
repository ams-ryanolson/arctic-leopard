<?php

namespace App\Console\Commands;

use App\Models\MigrationMapping;
use App\Models\SE4User;
use App\Models\SE4UserFieldValue;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MigrateUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:users
                            {--batch-size=100 : Number of users to process per batch}
                            {--limit= : Maximum number of users to migrate (for testing)}
                            {--dry-run : Show what would be migrated without making changes}
                            {--start-from= : Start from a specific SE4 user_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate users from SocialEngine 4 to Laravel';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $batchSize = (int) $this->option('batch-size');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $startFrom = $this->option('start-from') ? (int) $this->option('start-from') : null;

        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $this->info('Starting user migration from SocialEngine 4...');

        // Get total count
        $query = SE4User::query();
        if ($startFrom) {
            $query->where('user_id', '>=', $startFrom);
        }
        $total = $query->count();

        if ($limit) {
            $total = min($total, $limit);
        }

        $this->info("Found {$total} users to migrate");

        if (! $this->confirm('Continue?', true)) {
            return Command::FAILURE;
        }

        $progressBar = $this->output->createProgressBar($total);
        $progressBar->start();

        $processed = 0;
        $skipped = 0;
        $errors = 0;
        $lastUserId = $startFrom ?: 0;
        $failedUsers = [];
        $cancelled = false;

        // Cache the "User" role lookup (only need to do this once)
        $userRole = null;
        if (method_exists(User::class, 'assignRole')) {
            try {
                $userRole = \Spatie\Permission\Models\Role::where('name', 'User')->first();
            } catch (\Exception $e) {
                // Role might not exist, will handle per-user
            }
        }

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

            $batch = SE4User::query()
                ->where('user_id', '>', $lastUserId)
                ->orderBy('user_id')
                ->limit($batchSize)
                ->get();

            if ($batch->isEmpty()) {
                break;
            }

            // OPTIMIZATION: Pre-fetch all field values for this batch
            $userIds = $batch->pluck('user_id')->toArray();
            $fieldValues = $this->prefetchFieldValues($userIds);

            // OPTIMIZATION: Pre-check existing emails and usernames for this batch
            $existingEmails = User::whereIn('email', $batch->pluck('email'))->pluck('email')->toArray();
            $existingUsernames = User::whereIn('username_lower', $batch->pluck('username')->filter()->map(fn ($u) => Str::lower($u)))->pluck('username_lower')->toArray();

            // OPTIMIZATION: Pre-check migration mappings for this batch
            $existingMappings = MigrationMapping::where('source_type', 'user')
                ->whereIn('source_id', $userIds)
                ->pluck('source_id')
                ->toArray();

            // OPTIMIZATION: Disable model events during batch processing for better performance
            $originalEventDispatcher = User::getEventDispatcher();
            User::unsetEventDispatcher();

            // OPTIMIZATION: Use a single shared password hash for all users (they'll reset anyway)
            // This eliminates 500 expensive bcrypt hashes per batch (saves 50-150 seconds per batch!)
            $sharedPasswordHash = $this->getSharedPasswordHash();

            try {
                // OPTIMIZATION: Process users in a single transaction per batch (instead of per user)
                DB::beginTransaction();
                try {
                    $createdUsers = [];
                    $createdMappings = [];

                    foreach ($batch as $se4User) {
                        try {
                            $result = $this->migrateUser(
                                $se4User,
                                $dryRun,
                                $fieldValues,
                                $existingEmails,
                                $existingUsernames,
                                $existingMappings,
                                null, // Don't assign role yet - we'll do it in bulk
                                $sharedPasswordHash // Use shared password for all users
                            );

                            if ($result === 'skipped') {
                                $skipped++;
                            } elseif (is_array($result) && $result['status'] === 'error') {
                                $errors++;
                                $failedUsers[] = [
                                    'se4_id' => $se4User->user_id,
                                    'username' => $se4User->username ?? 'N/A',
                                    'email' => $se4User->email,
                                    'reason' => $result['reason'] ?? 'Unknown error',
                                ];
                            } elseif (is_array($result) && $result['status'] === 'success') {
                                $processed++;
                                // Store user and mapping for bulk role assignment
                                if (isset($result['user_id'])) {
                                    $createdUsers[] = $result['user_id'];
                                    $createdMappings[] = [
                                        'source_type' => 'user',
                                        'source_id' => $se4User->user_id,
                                        'target_type' => User::class,
                                        'target_id' => $result['user_id'],
                                    ];
                                }
                            } else {
                                $processed++;
                            }

                            $lastUserId = $se4User->user_id;
                        } catch (\Exception $e) {
                            $errors++;
                            $simplifiedReason = $this->simplifyErrorMessage($e->getMessage());
                            $failedUsers[] = [
                                'se4_id' => $se4User->user_id,
                                'username' => $se4User->username ?? 'N/A',
                                'email' => $se4User->email,
                                'reason' => $simplifiedReason,
                            ];
                            $this->newLine();
                            $this->error("Error migrating user {$se4User->user_id}: {$simplifiedReason}");
                        }

                        $progressBar->advance();

                        if ($limit && ($processed + $skipped + $errors) >= $limit) {
                            break 2;
                        }
                    }

                    // OPTIMIZATION: Bulk assign "User" role to all created users at once
                    if (! empty($createdUsers) && $userRole && method_exists(User::class, 'assignRole')) {
                        try {
                            $users = User::whereIn('id', $createdUsers)->get();
                            foreach ($users as $user) {
                                if (! $user->hasRole('User')) {
                                    $user->assignRole($userRole);
                                }
                            }
                        } catch (\Exception $e) {
                            $this->warn("Could not bulk assign User role: {$e->getMessage()}");
                        }
                    }

                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }
            } finally {
                // Re-enable model events
                User::setEventDispatcher($originalEventDispatcher);
            }
        }

        $progressBar->finish();
        $this->newLine(2);

        if ($cancelled) {
            $this->warn('Migration was cancelled.');
            $this->info("Last processed user ID: {$lastUserId}");
            $this->info('You can resume with: --start-from='.($lastUserId + 1));
        } else {
            $this->info('Migration complete!');
            $this->newLine();
            $this->info('Re-indexing users in Scout (this may take a few minutes)...');
            $this->newLine();

            try {
                Artisan::call('scout:import', [
                    'model' => 'App\\Models\\User',
                ]);

                $this->info('✅ Scout indexing complete!');
            } catch (\Exception $e) {
                $this->error('❌ Scout indexing failed: '.$e->getMessage());
                $this->warn('You can manually run: php artisan scout:import "App\\Models\\User"');
            }

            $this->newLine();
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

        // Display failed users summary
        if (! empty($failedUsers)) {
            $this->newLine();
            $this->error('Failed Users Summary:');
            $this->table(
                ['SE4 ID', 'Username', 'Email', 'Reason'],
                array_map(fn ($user) => [
                    $user['se4_id'],
                    $user['username'],
                    $user['email'],
                    $user['reason'],
                ], $failedUsers)
            );
        }

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Pre-fetch all field values for a batch of users to avoid N+1 queries.
     *
     * @param  array<int>  $userIds
     * @return array<int, array{6?: string, 13?: string, 61?: string, 64?: string}>
     */
    protected function prefetchFieldValues(array $userIds): array
    {
        if (empty($userIds)) {
            return [];
        }

        // Fetch all field values for this batch in one query
        $fieldValues = SE4UserFieldValue::whereIn('item_id', $userIds)
            ->whereIn('field_id', [6, 13, 61, 64]) // birthdate, bio, city, country
            ->get()
            ->groupBy('item_id')
            ->map(function ($values) {
                $result = [];
                foreach ($values as $value) {
                    $result[$value->field_id] = $value->value;
                }

                return $result;
            })
            ->toArray();

        return $fieldValues;
    }

    /**
     * Migrate a single SE4 user to Laravel.
     *
     * @param  array<int, array{6?: string, 13?: string, 61?: string, 64?: string}>  $prefetchedFieldValues
     * @param  array<string>  $existingEmails
     * @param  array<string>  $existingUsernames
     * @param  array<int>  $existingMappings
     * @param  \Spatie\Permission\Models\Role|null  $userRole  (deprecated - roles assigned in bulk)
     * @param  string|null  $precomputedPassword  Pre-computed password hash to avoid hashing per user
     * @return string|array{status: string, reason: string}|array{status: string, user_id: int}
     */
    protected function migrateUser(
        SE4User $se4User,
        bool $dryRun,
        array $prefetchedFieldValues = [],
        array $existingEmails = [],
        array $existingUsernames = [],
        array $existingMappings = [],
        ?\Spatie\Permission\Models\Role $userRole = null,
        ?string $precomputedPassword = null
    ): string|array {
        // Check if already migrated (using pre-fetched data)
        if (in_array($se4User->user_id, $existingMappings)) {
            return 'skipped';
        }

        // Check for duplicate email/username (using pre-fetched data)
        $emailExists = in_array($se4User->email, $existingEmails);
        $usernameLower = Str::lower($se4User->username ?? '');
        $usernameExists = ! empty($usernameLower) && in_array($usernameLower, $existingUsernames);

        if ($emailExists || $usernameExists) {
            $this->newLine();
            $this->warn("Skipping user {$se4User->user_id}: email or username already exists");

            return 'skipped';
        }

        // Get field values from pre-fetched data
        $userFieldValues = $prefetchedFieldValues[$se4User->user_id] ?? [];

        if ($dryRun) {
            $birthdate = $this->parseBirthdate($userFieldValues[6] ?? null, $se4User->user_id);
            $birthdateInfo = $birthdate ? "Birthdate: {$birthdate}" : 'No birthdate';

            $locationData = $this->parseLocationData($userFieldValues, $se4User->user_id);
            $city = $locationData['location_city'] ?? 'No city';
            $country = $locationData['location_country'] ?? 'No country';
            $locationInfo = "Location: {$city}, {$country}";

            $this->newLine();
            $this->line("Would migrate user: {$se4User->user_id} - {$se4User->email} - {$se4User->displayname}");
            $this->line("  {$birthdateInfo} | {$locationInfo}");

            return ['status' => 'success'];
        }

        // Use pre-computed password if provided (for batch optimization)
        $password = $precomputedPassword ?? $this->convertPassword($se4User->password, $se4User->salt);

        // Parse birthdate from pre-fetched field values
        $birthdate = $this->parseBirthdate($userFieldValues[6] ?? null, $se4User->user_id);

        // Get bio from field values (field_id = 13) and convert to HTML
        $bio = $this->convertBioToHtml($userFieldValues[13] ?? null);

        // Map SE4 fields to Laravel User fields
        $userData = [
            'username_lower' => Str::lower($se4User->displayname),
            'username' => $se4User->displayname,
            'email' => $se4User->email,
            'password' => $password,
            'name' => $se4User->displayname,
            'display_name' => $se4User->displayname,
            'bio' => $bio,
            'email_verified_at' => null, // Force null - migrated users must verify email
            'profile_completed_at' => null, // Force null - migrated users must complete onboarding
            'created_at' => $se4User->creation_date,
            'updated_at' => $se4User->modified_date ?: $se4User->creation_date,
        ];

        // Only add birthdate if we found one (it's nullable)
        if ($birthdate) {
            $userData['birthdate'] = $birthdate;
        }

        // Handle account status
        if (! $se4User->enabled) {
            $userData['suspended_at'] = $se4User->modified_date ?: now();
            $userData['suspended_reason'] = 'Migrated from SE4 - Account was disabled';
        }

        if (! $se4User->approved) {
            $userData['suspended_at'] = $userData['suspended_at'] ?? ($se4User->modified_date ?: now());
            $userData['suspended_reason'] = ($userData['suspended_reason'] ?? '').' | Account was not approved';
        }

        // Parse location data from pre-fetched field values
        // Field ID 61 = City, Field ID 64 = Country
        $locationData = $this->parseLocationData($userFieldValues, $se4User->user_id);
        if (! empty($locationData)) {
            $userData = array_merge($userData, $locationData);
        }

        // Create the user (transaction handled at batch level)
        // Disable Scout indexing during migration - we'll re-index all users after migration completes
        $user = User::withoutSyncingToSearch(function () use ($userData) {
            return User::create($userData);
        });

        // Create migration mapping
        MigrationMapping::setMapping(
            'user',
            $se4User->user_id,
            User::class,
            $user->id,
            [
                'se4_photo_id' => $se4User->photo_id,
                'se4_cover_id' => $se4User->cover_id,
                'se4_level_id' => $se4User->level_id,
            ]
        );

        // Return success with user ID for bulk role assignment
        return [
            'status' => 'success',
            'user_id' => $user->id,
        ];
    }

    /**
     * Get a shared password hash for all migrated users.
     *
     * OPTIMIZATION: Since all migrated users will need to reset their password anyway
     * (we can't reverse SE4's MD5 hashing), we use a single shared password hash.
     * This eliminates the need to hash 500 passwords per batch, saving 50-150 seconds per batch!
     */
    protected function getSharedPasswordHash(): string
    {
        // Cache the hash in a static property so we only generate it once for the entire migration
        static $sharedHash = null;

        if ($sharedHash === null) {
            // Generate a secure random password hash once
            // All migrated users will get this same hash, but they'll need to reset anyway
            $sharedHash = Hash::make(Str::random(64));
        }

        return $sharedHash;
    }

    /**
     * Convert SE4 password to Laravel format.
     * SE4 uses: md5(salt . md5(password))
     * Since we can't reverse this, we'll set a random password and note it needs reset.
     *
     * @deprecated Use getSharedPasswordHash() instead for better performance
     */
    protected function convertPassword(string $se4Password, string $salt): string
    {
        // This method is kept for backward compatibility but should not be used during migration
        // Use getSharedPasswordHash() instead
        return $this->getSharedPasswordHash();
    }

    /**
     * Generate a username from email if username is missing.
     */
    protected function generateUsername(string $email): string
    {
        $base = Str::before($email, '@');
        $username = Str::slug($base);
        $counter = 1;

        while (User::where('username_lower', Str::lower($username))->exists()) {
            $username = $base.$counter;
            $counter++;
        }

        return $username;
    }

    /**
     * Parse location data from pre-fetched field values.
     * Field ID 61 = City, Field ID 64 = Country.
     *
     * @param  array<int, string>  $fieldValues
     * @return array<string, mixed>
     */
    protected function parseLocationData(array $fieldValues, int $userId): array
    {
        $data = [
            'location_city' => null,
            'location_country' => null,
            'location_region' => null,
            'location_latitude' => null,
            'location_longitude' => null,
        ];

        try {
            // Get city (field_id = 61)
            if (isset($fieldValues[61]) && ! empty(trim($fieldValues[61]))) {
                $data['location_city'] = trim($fieldValues[61]);
            }

            // Get country (field_id = 64)
            if (isset($fieldValues[64]) && ! empty(trim($fieldValues[64]))) {
                $data['location_country'] = trim($fieldValues[64]);
            }

            // Only return data if we have at least city or country
            // Otherwise return empty array so fields stay null
            if (empty($data['location_city']) && empty($data['location_country'])) {
                return [];
            }

            return $data;
        } catch (\Exception $e) {
            // Error parsing - log but don't fail migration
            $this->warn("Error parsing location for user {$userId}: {$e->getMessage()}");

            return [];
        }
    }

    /**
     * Parse birthdate from pre-fetched field value.
     * Field ID 6 = Birthdate.
     */
    protected function parseBirthdate(?string $fieldValue, int $userId): ?string
    {
        try {
            if (empty($fieldValue)) {
                return null;
            }

            $value = trim($fieldValue);

            // SE4 might store birthdate in various formats (timestamp, date string, etc.)
            // Try to parse it as a date
            try {
                // If it's a numeric string, it might be a Unix timestamp
                if (is_numeric($value)) {
                    $date = \Carbon\Carbon::createFromTimestamp((int) $value);
                } else {
                    $date = \Carbon\Carbon::parse($value);
                }

                // Ensure it's a reasonable date (not in the future, not too old)
                if ($date->isFuture() || $date->year < 1900) {
                    $this->warn("Invalid birthdate for user {$userId}: {$value}");

                    return null;
                }

                return $date->format('Y-m-d');
            } catch (\Exception $e) {
                // If parsing fails, log and return null
                $this->warn("Could not parse birthdate for user {$userId}: {$value} - {$e->getMessage()}");

                return null;
            }
        } catch (\Exception $e) {
            // Database error - log but don't fail migration
            $this->warn("Error fetching birthdate for user {$userId}: {$e->getMessage()}");

            return null;
        }
    }

    /**
     * Convert plain text bio to HTML, preserving newlines as <br> tags.
     * Only uses tags allowed by RichTextEditor: strong, em, u, s, br
     */
    protected function convertBioToHtml(?string $plainText): ?string
    {
        if (empty($plainText) || empty(trim($plainText))) {
            return null;
        }

        $text = trim($plainText);

        // Escape HTML entities to prevent XSS
        $text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');

        // Normalize line endings
        $text = str_replace(["\r\n", "\r"], "\n", $text);

        // Convert newlines to <br> tags (this is what RichTextEditor uses)
        // Use nl2br with false to output <br> not <br />
        $html = nl2br($text, false);

        return $html ?: null;
    }

    /**
     * Simplify error messages to show only the meaningful part.
     */
    protected function simplifyErrorMessage(string $errorMessage): string
    {
        // Extract field name from "Field 'fieldname' doesn't have a default value"
        if (preg_match("/Field '([^']+)' doesn't have a default value/", $errorMessage, $matches)) {
            return "Missing required field: {$matches[1]}";
        }

        // Extract field name from duplicate entry errors
        if (preg_match("/Duplicate entry .+ for key '([^']+)'/", $errorMessage, $matches)) {
            $key = $matches[1];
            if (str_contains($key, 'email')) {
                return 'Duplicate email address';
            }
            if (str_contains($key, 'username')) {
                return 'Duplicate username';
            }

            return "Duplicate entry for key: {$key}";
        }

        // Extract constraint violation
        if (preg_match('/UNIQUE constraint failed: ([^)]+)/', $errorMessage, $matches)) {
            return 'Unique constraint violation: '.$matches[1];
        }

        // Extract NOT NULL constraint
        if (preg_match('/NOT NULL constraint failed: ([^)]+)/', $errorMessage, $matches)) {
            return 'Required field is null: '.$matches[1];
        }

        // For SQLSTATE errors, extract just the meaningful part
        if (preg_match("/SQLSTATE\[.*?\]: (.+?)(?: \(Connection:|$)/", $errorMessage, $matches)) {
            $message = trim($matches[1]);
            // Remove the SQL query part if present
            if (str_contains($message, 'SQL:')) {
                $message = substr($message, 0, strpos($message, 'SQL:'));
            }

            return trim($message);
        }

        // If it's a long message, try to get the first sentence
        if (strlen($errorMessage) > 200) {
            $firstSentence = explode('.', $errorMessage)[0];
            if (strlen($firstSentence) < 200) {
                return $firstSentence;
            }
        }

        // Return first 150 characters if still too long
        if (strlen($errorMessage) > 150) {
            return substr($errorMessage, 0, 147).'...';
        }

        return $errorMessage;
    }
}
