<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class PaymentFailedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $customer,
        public string $itemDescription,
        public string $amount,
        public string $failureReason,
        public string $paymentMethod,
        public string $last4,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Action Required: Your payment failed',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-failed',
            with: [
                'customerName' => $this->customer->display_name ?? $this->customer->username,
                'itemDescription' => $this->itemDescription,
                'amount' => $this->amount,
                'failureReason' => $this->failureReason,
                'retryDate' => Carbon::now()->addDays(3)->format('F j, Y'),
                'paymentMethod' => $this->paymentMethod,
                'last4' => $this->last4,
            ],
        );
    }
}

