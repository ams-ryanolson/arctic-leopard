<?php

namespace App\Http\Requests\Memberships;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class GiftMembershipRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'message' => ['nullable', 'string', 'max:500'],
            'gateway' => ['nullable', 'string'],
            'method' => ['nullable', 'string'],
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_methods,id'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $gifter = $this->user();
            $recipientId = $this->integer('recipient_id');

            // Cannot gift to self
            if ($gifter && $gifter->id === $recipientId) {
                $validator->errors()->add(
                    'recipient_id',
                    'You cannot gift a membership to yourself.'
                );
            }

            // Check if recipient has active membership
            if ($recipientId) {
                $recipient = User::find($recipientId);
                if ($recipient) {
                    $hasActiveMembership = $recipient->memberships()
                        ->where('status', 'active')
                        ->where(function ($query) {
                            $query->whereNull('ends_at')
                                ->orWhere('ends_at', '>', now());
                        })
                        ->exists();

                    if ($hasActiveMembership) {
                        $validator->errors()->add(
                            'recipient_id',
                            'The recipient already has an active membership.'
                        );
                    }
                }
            }
        });
    }
}
