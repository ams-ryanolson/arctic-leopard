<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ExpireUserWarnings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:expire-warnings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire user warnings that are older than 90 days';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Expiring user warnings...');

        $listener = new \App\Listeners\Users\ExpireWarnings;
        $listener->handle();

        $this->info('User warnings expired successfully.');

        return self::SUCCESS;
    }
}
