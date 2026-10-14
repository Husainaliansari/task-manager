<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per admin action on someone else's data,
 * e.g. "task.updated" or "user.role_changed".
 */
#[Fillable(['actor_id', 'action', 'subject_type', 'subject_id', 'details'])]
class AuditLog extends Model
{
    public const UPDATED_AT = null; // log entries are never edited

    protected function casts(): array
    {
        return [
            'details' => 'array',
        ];
    }

    public static function record(User $actor, string $action, Model $subject, array $details = []): self
    {
        return static::create([
            'actor_id' => $actor->id,
            'action' => $action,
            'subject_type' => $subject->getTable(),
            'subject_id' => $subject->getKey(),
            'details' => $details,
        ]);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
