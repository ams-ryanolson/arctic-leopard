<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PayoutProcessedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $creator,
        public string $amount,
        public string $payoutMethod,
        public string $estimatedArrival,
        public string $periodStart,
        public string $periodEnd,
        public string $subscriptionEarnings,
        public string $tipEarnings,
        public string $platformFee,
        public string $netAmount,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "💰 Your {$this->amount} payout is on its way!",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payout-processed',
            with: [
                'creatorName' => $this->creator->display_name ?? $this->creator->username,
                'amount' => $this->amount,
                'payoutMethod' => $this->payoutMethod,
                'estimatedArrival' => $this->estimatedArrival,
                'periodStart' => $this->periodStart,
                'periodEnd' => $this->periodEnd,
                'subscriptionEarnings' => $this->subscriptionEarnings,
                'tipEarnings' => $this->tipEarnings,
                'platformFee' => $this->platformFee,
                'netAmount' => $this->netAmount,
            ],
        );
    }
}

