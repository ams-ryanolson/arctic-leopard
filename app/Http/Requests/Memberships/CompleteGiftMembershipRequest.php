<?php

namespace App\Http\Requests\Memberships;

use App\Models\Payments\PaymentIntent;
use Illuminate\Foundation\Http\FormRequest;

class CompleteGiftMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'payment_intent_id' => [
                'required',
                'integer',
                'exists:payment_intents,id',
                function ($attribute, $value, $fail) {
                    $user = $this->user();
                    if (! $user) {
                        $fail('You must be authenticated to complete a gift payment.');

                        return;
                    }

                    $paymentIntent = PaymentIntent::find($value);

                    if (! $paymentIntent) {
                        $fail('Payment intent not found.');

                        return;
                    }

                    // Verify payment intent belongs to authenticated user
                    if ($paymentIntent->payer_id !== $user->id) {
                        $fail('This payment intent does not belong to you.');

                        return;
                    }

                    // Verify it's a gift
                    if (! ($paymentIntent->metadata['is_gift'] ?? false)) {
                        $fail('This payment intent is not for a gift membership.');

                        return;
                    }

                    // Verify payment intent is in a valid state for capture
                    $validStatuses = [
                        \App\Enums\Payments\PaymentIntentStatus::RequiresMethod,
                        \App\Enums\Payments\PaymentIntentStatus::RequiresConfirmation,
                        \App\Enums\Payments\PaymentIntentStatus::Processing,
                    ];

                    if (! in_array($paymentIntent->status, $validStatuses)) {
                        $fail('This payment intent cannot be completed. It may have already been processed or cancelled.');

                        return;
                    }

                    // Check if payment intent is expired
                    if ($paymentIntent->expires_at && $paymentIntent->expires_at->isPast()) {
                        $fail('This payment intent has expired. Please create a new gift.');

                        return;
                    }
                },
            ],
            'payment_method_id' => [
                'nullable',
                'integer',
                'exists:payment_methods,id',
            ],
        ];
    }
}
