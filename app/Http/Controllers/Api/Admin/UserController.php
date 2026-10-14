<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /** Everyone on the team, with how many tasks they have in each status. */
    public function index(): AnonymousResourceCollection
    {
        $users = User::query()
            ->with('role')
            ->withCount([
                'tasks',
                'tasks as todo_count' => fn ($query) => $query->where('status', TaskStatus::Todo),
                'tasks as in_progress_count' => fn ($query) => $query->where('status', TaskStatus::InProgress),
                'tasks as done_count' => fn ($query) => $query->where('status', TaskStatus::Done),
            ])
            ->orderBy('name')
            ->get();

        return UserResource::collection($users);
    }

    public function updateRole(Request $request, User $user): UserResource
    {
        $data = $request->validate([
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $admin = $request->user();

        // Stops the last admin from locking everyone out by demoting themselves.
        abort_if($user->is($admin), 403, "You can't change your own role.");

        $from = $user->role->name;

        if ($from !== $data['role']) {
            DB::transaction(function () use ($user, $admin, $from, $data) {
                $user->role()->associate(Role::named($data['role']))->save();

                AuditLog::record($admin, 'user.role_changed', $user, [
                    'user' => $user->name,
                    'from' => $from,
                    'to' => $data['role'],
                ]);
            });
        }

        return UserResource::make($user->load('role'));
    }
}
