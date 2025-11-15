<?php

namespace App\Console\Commands;

use App\Services\Verification\VerificationService;
use Illuminate\Console\Command;

class CheckIdVerificationExpirations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verification:check-expirations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check ID verification expirations and handle renewals and creator status disabling';

    /**
     * Execute the console command.
     */
    public function handle(VerificationService $verificationService): int
    {
        $this->info('Checking for expiring verifications...');
        $verificationService->checkExpirations();
        $this->info('Expiring verifications processed.');

        $this->info('Disabling creator status for expired verifications...');
        $verificationService->disableExpiredCreatorStatus();
        $this->info('Creator status checks completed.');

        return Command::SUCCESS;
    }
}
