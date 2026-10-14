<?php

namespace App\Http\Requests;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    /**
     * Only admins may give a task to somebody else.
     * Returning false here makes Laravel answer with 403.
     */
    public function authorize(): bool
    {
        $ownerId = $this->input('user_id');

        return $ownerId === null
            || (int) $ownerId === $this->user()->id
            || $this->user()->isAdmin();
    }

    protected function failedAuthorization(): void
    {
        throw new AuthorizationException('Only admins can assign tasks to other people.');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => [Rule::enum(TaskStatus::class)],
            'priority' => [Rule::enum(TaskPriority::class)],
            'due_date' => ['nullable', 'date_format:Y-m-d'],
            'user_id' => ['integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Give your task a title.',
            'due_date.date_format' => 'Pick a valid date (YYYY-MM-DD).',
            'status.enum' => 'Status must be one of: '.implode(', ', TaskStatus::values()).'.',
            'priority.enum' => 'Priority must be one of: '.implode(', ', TaskPriority::values()).'.',
        ];
    }
}
