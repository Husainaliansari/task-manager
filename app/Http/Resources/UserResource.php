<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->name,
            'created_at' => $this->created_at?->toIso8601String(),

            // Only present on the admin team list, which loads the counts.
            'task_counts' => $this->whenCounted('tasks', fn () => [
                'total' => $this->tasks_count,
                'todo' => $this->todo_count,
                'in_progress' => $this->in_progress_count,
                'done' => $this->done_count,
            ]),
        ];
    }
}
