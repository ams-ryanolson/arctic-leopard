<?php

namespace App\Http\Requests\Polls;

use App\Models\PostPoll;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePollVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var PostPoll|null $poll */
        $poll = $this->route('poll');

        return $poll !== null && $this->user()?->can('vote', $poll);
    }

    public function rules(): array
    {
        /** @var PostPoll|null $poll */
        $poll = $this->route('poll');

        return [
            'option_id' => [
                'required',
                'integer',
                Rule::exists('post_poll_options', 'id')->where(static function ($query) use ($poll): void {
                    if ($poll !== null) {
                        $query->where('post_poll_id', $poll->getKey());
                    }
                }),
            ],
            'ip_address' => ['nullable', 'string', 'max:45'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
