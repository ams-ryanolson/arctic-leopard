<?php

namespace App\Http\Requests\Settings;

use App\Services\TemporaryUploadService;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMediaRequest extends FormRequest
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
            'avatar_upload_id' => ['nullable', 'string', 'max:255'],
            'cover_upload_id' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            /** @var TemporaryUploadService $uploads */
            $uploads = app(TemporaryUploadService::class);

            foreach (['avatar_upload_id', 'cover_upload_id'] as $field) {
                $identifier = (string) $this->input($field, '');

                if ($identifier === '') {
                    continue;
                }

                if (! $uploads->exists($identifier)) {
                    $validator->errors()->add($field, 'The selected upload has expired. Please upload again.');
                }
            }
        });
    }
}
