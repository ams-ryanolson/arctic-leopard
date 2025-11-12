<?php

namespace App\Console\Commands\Payments;

use App\Enums\Payments\PaymentStatus;
use App\Enums\Payments\PostPurchaseStatus;
use App\Models\Payments\Payment;
use App\Models\PostPurchase;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MigrateLegacyPurchasesCommand extends Command
{
    protected $signature = 'payments:migrate-legacy-purchases
        {--chunk=100 : Number of records to process per chunk}
        {--dry-run : Output the purchases that would be migrated}';

    protected $description = 'Backfill existing post purchases into the payments ledger.';

    public function handle(): int
    {
        $chunkSize = max(10, (int) $this->option('chunk'));

        $query = PostPurchase::query()
            ->with('post.user')
            ->whereNull('payment_id');

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info('No legacy post purchases require migration.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->table(
                ['Purchase ID', 'Buyer', 'Post ID', 'Creator', 'Amount', 'Currency', 'Status'],
                $query->limit($chunkSize)->get()->map(fn (PostPurchase $purchase): array => [
                    'purchase_id' => $purchase->id,
                    'buyer_id' => $purchase->user_id,
                    'post_id' => $purchase->post_id,
                    'creator_id' => $purchase->post?->user_id,
                    'amount' => $purchase->amount,
                    'currency' => $purchase->currency,
                    'status' => $purchase->status->value,
                ])->all()
            );

            $this->info("{$total} purchases would be migrated.");

            return self::SUCCESS;
        }

        $migrated = 0;

        DB::transaction(function () use (&$migrated, $query, $chunkSize): void {
            $query->chunkById($chunkSize, function ($purchases) use (&$migrated): void {
                /** @var PostPurchase $purchase */
                foreach ($purchases as $purchase) {
                    $status = $this->mapStatus($purchase->status);
                    $creatorId = $purchase->post?->user_id;

                    $payment = Payment::query()->create([
                        'payable_type' => PostPurchase::class,
                        'payable_id' => $purchase->id,
                        'payer_id' => $purchase->user_id,
                        'payee_id' => $creatorId,
                        'type' => 'one_time',
                        'status' => $status,
                        'amount' => $purchase->amount,
                        'fee_amount' => 0,
                        'net_amount' => $purchase->amount,
                        'currency' => $purchase->currency,
                        'method' => $purchase->metadata['method'] ?? null,
                        'provider' => $purchase->metadata['provider'] ?? 'legacy',
                        'provider_payment_id' => $purchase->metadata['provider_payment_id'] ?? null,
                        'metadata' => array_merge($purchase->metadata ?? [], [
                            'migrated_at' => Carbon::now()->toIso8601String(),
                        ]),
                        'authorized_at' => $purchase->created_at,
                        'captured_at' => $this->capturedTimestamp($status, $purchase),
                        'succeeded_at' => $this->capturedTimestamp($status, $purchase),
                        'refunded_at' => $status === PaymentStatus::Refunded ? $purchase->updated_at : null,
                    ]);

                    $purchase->forceFill(['payment_id' => $payment->id])->save();
                    $migrated++;
                }
            });
        });

        $this->info("Migrated {$migrated} legacy purchases into payments.");

        return self::SUCCESS;
    }

    protected function mapStatus(PostPurchaseStatus $status): PaymentStatus
    {
        return match ($status) {
            PostPurchaseStatus::Pending => PaymentStatus::Pending,
            PostPurchaseStatus::Completed => PaymentStatus::Captured,
            PostPurchaseStatus::Refunded => PaymentStatus::Refunded,
            PostPurchaseStatus::Cancelled => PaymentStatus::Cancelled,
            PostPurchaseStatus::Failed => PaymentStatus::Failed,
        };
    }

    protected function capturedTimestamp(PaymentStatus $status, PostPurchase $purchase): ?Carbon
    {
        return in_array($status, [PaymentStatus::Captured, PaymentStatus::Refunded, PaymentStatus::Settled], true)
            ? $purchase->fulfilled_at ?? $purchase->updated_at
            : null;
    }
}
