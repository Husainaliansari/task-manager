<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Who may touch a task: its owner, or any admin.
 * A denied check becomes a 403 response automatically.
 */
class TaskPolicy
{
    public function view(User $user, Task $task): Response
    {
        return $this->ownerOrAdmin($user, $task);
    }

    public function update(User $user, Task $task): Response
    {
        return $this->ownerOrAdmin($user, $task);
    }

    public function delete(User $user, Task $task): Response
    {
        return $this->ownerOrAdmin($user, $task);
    }

    private function ownerOrAdmin(User $user, Task $task): Response
    {
        return $user->isAdmin() || $task->user_id === $user->id
            ? Response::allow()
            : Response::deny('You can only manage your own tasks.');
    }
}
