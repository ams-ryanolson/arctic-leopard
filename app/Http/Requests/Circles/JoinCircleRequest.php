<?php

namespace App\Http\Requests\Circles;

use App\Models\Circle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JoinCircleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Circle|null $circle */
        $circle = $this->route('circle');

        $rules = [
            'role' => ['required', 'string', Rule::in(['member'])],
            'facet' => ['nullable', 'string', 'max:120'],
            'preferences' => ['nullable', 'array'],
        ];

        if ($circle instanceof Circle) {
            $rules['facet'][] = Rule::exists('circle_facets', 'value')->where(function ($query) use ($circle): void {
                $query->where('circle_id', $circle->getKey());
            });
        }

        return $rules;
    }

    /**
     * Ensure defaults are applied to the incoming payload.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->filled('role')) {
            $this->merge([
                'role' => 'member',
            ]);
        }
    }
}
