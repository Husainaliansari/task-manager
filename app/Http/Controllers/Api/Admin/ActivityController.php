<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityController extends Controller
{
    /** The 100 most recent admin actions, newest first. */
    public function index(): AnonymousResourceCollection
    {
        $entries = AuditLog::query()
            ->with('actor')
            ->latest('id')
            ->limit(100)
            ->get();

        return AuditLogResource::collection($entries);
    }
}
