<?php

namespace App\Http\Requests;

class UpdateTaskRequest extends StoreTaskRequest
{
    /**
     * Same rules as creating a task, but every field is optional,
     * so a PATCH can send just { "status": "done" }.
     */
    public function rules(): array
    {
        return array_map(
            fn (array $rules) => ['sometimes', ...$rules],
            parent::rules(),
        );
    }
}
