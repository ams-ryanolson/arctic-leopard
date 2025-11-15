<?php

namespace App\Http\Requests\Radar;

use App\Services\Radar\BoostService;
use Illuminate\Foundation\Http\FormRequest;

class StoreBoostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // User must be authenticated and have completed their profile (same requirements as viewing Radar)
        $user = $this->user();

        return $user !== null && $user->profile_completed_at !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->user() === null) {
                $validator->errors()->add('user', 'You must be authenticated to boost.');

                return;
            }

            /** @var BoostService $boostService */
            $boostService = app(BoostService::class);

            if (! $boostService->canBoost($this->user())) {
                if ($boostService->isCurrentlyBoosting($this->user())) {
                    $validator->errors()->add('boost', 'You already have an active boost.');
                } else {
                    $boostsUsedToday = $boostService->getBoostsUsedToday($this->user());
                    $dailyLimit = $boostService->getDailyBoostLimit($this->user());
                    $validator->errors()->add(
                        'boost',
                        "You have reached your daily boost limit ({$boostsUsedToday}/{$dailyLimit}).",
                    );
                }
            }
        });
    }
}
