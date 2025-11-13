<?php

namespace App\Http\Requests\Ads;

use App\Enums\Ads\CampaignStatus;
use App\Enums\Ads\PacingStrategy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(CampaignStatus::class)],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'total_budget' => ['required', 'integer', 'min:1'],
            'currency' => ['required', 'string', 'size:3'],
            'pacing_strategy' => ['sometimes', Rule::enum(PacingStrategy::class)],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
