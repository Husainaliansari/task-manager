<?php

namespace App\Http\Resources;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AuditLog */
class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            // null when the admin's account has since been deleted
            'actor' => $this->actor ? ['id' => $this->actor->id, 'name' => $this->actor->name] : null,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'details' => $this->details,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
