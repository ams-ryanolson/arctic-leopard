<?php

namespace App\Http\Requests\Ads;

use App\Enums\Ads\AdStatus;
use App\Enums\Ads\PricingModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'campaign_id' => ['nullable', 'integer', 'exists:ad_campaigns,id'],
            'status' => ['sometimes', Rule::enum(AdStatus::class)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'max_impressions' => ['nullable', 'integer', 'min:1'],
            'max_clicks' => ['nullable', 'integer', 'min:1'],
            'daily_impression_cap' => ['nullable', 'integer', 'min:1'],
            'daily_click_cap' => ['nullable', 'integer', 'min:1'],
            'budget_amount' => ['nullable', 'integer', 'min:0'],
            'budget_currency' => ['required_with:budget_amount', 'nullable', 'string', 'size:3'],
            'pricing_model' => ['nullable', Rule::enum(PricingModel::class)],
            'pricing_rate' => ['nullable', 'integer', 'min:0'],
            'targeting' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'creatives' => ['sometimes', 'array', 'min:1'],
            'creatives.*.placement' => ['required', 'string'],
            'creatives.*.size' => ['required', 'string'],
            'creatives.*.asset_type' => ['required', 'string'],
            'creatives.*.asset_path' => ['nullable', 'string', 'max:2048'],
            'creatives.*.asset_url' => ['nullable', 'url', 'max:2048'],
            'creatives.*.headline' => ['nullable', 'string', 'max:255'],
            'creatives.*.body_text' => ['nullable', 'string', 'max:2000'],
            'creatives.*.cta_text' => ['nullable', 'string', 'max:100'],
            'creatives.*.cta_url' => ['required', 'url', 'max:2048'],
            'creatives.*.display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
