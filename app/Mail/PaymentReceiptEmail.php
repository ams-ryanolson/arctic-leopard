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

class PaymentReceiptEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $customer,
        public string $transactionId,
        public string $subtotal,
        public string $total,
        public string $paymentMethod,
        public string $last4,
        public ?string $tax = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Real Kink Men Receipt - {$this->total}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-receipt',
            with: [
                'customerName' => $this->customer->display_name ?? $this->customer->username,
                'transactionId' => $this->transactionId,
                'date' => Carbon::now()->format('F j, Y'),
                'subtotal' => $this->subtotal,
                'tax' => $this->tax ?? '$0.00',
                'total' => $this->total,
                'paymentMethod' => $this->paymentMethod,
                'last4' => $this->last4,
            ],
        );
    }
}

