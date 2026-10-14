<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'title', 'description', 'status', 'priority', 'due_date'])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    /** Defaults for new tasks (they match the column defaults in the migration). */
    protected $attributes = [
        'status' => 'todo',
        'priority' => 'medium',
    ];

    // due_date is deliberately not cast: it stays a plain "YYYY-MM-DD" string,
    // which is exactly what the API sends and receives.
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'status' => TaskStatus::class,
            'priority' => TaskPriority::class,
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
