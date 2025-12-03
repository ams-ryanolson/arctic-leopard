<?php

namespace App\Http\Requests\Messaging;

use App\Models\AdminSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMessagingSettingsRequest extends FormRequest
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
        $signalsEnabled = (bool) AdminSetting::get('feature_signals_enabled', false);

        $rules = [
            'message_request_mode' => [
                'required',
                'string',
                Rule::in(['no-one', 'verified', 'following', 'verified-and-following', 'everyone']),
            ],
            'filter_low_quality' => ['required', 'boolean'],
        ];

        // Only validate allow_subscriber_messages if Signals feature is enabled
        if ($signalsEnabled) {
            $rules['allow_subscriber_messages'] = ['required', 'boolean'];
        }

        return $rules;
    }
}
