<?php

namespace App\Http\Controllers\Api;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\AuditLog;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * GET /api/tasks?status=todo&user_id=3&page=2&per_page=10
     *
     * Regular users only ever get their own tasks. Admins get everyone's,
     * and can narrow the list down to one person with user_id.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(TaskStatus::class)],
            'user_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $ownerId = $this->ownerFilter($request, $filters['user_id'] ?? null);
        $status = $filters['status'] ?? null;

        $tasks = Task::query()
            ->when($ownerId, fn ($query) => $query->where('user_id', $ownerId))
            ->when($status, fn ($query) => $query->where('status', $status))
            // One person's tasks with no status filter: MySQL would pick (user_id, status)
            // and sort all of that person's rows. (user_id, id) is already in newest-first
            // order, so it can stop after one page. See docs/DATABASE.md, query 1b.
            ->when($ownerId && ! $status, fn ($query) => $query->useIndex('tasks_user_recent_index'))
            ->with('owner')
            ->latest('id') // newest first; id is unique, so pages never overlap
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();

        return TaskResource::collection($tasks);
    }

    /**
     * GET /api/tasks/stats?user_id=3
     *
     * How many tasks are in each status, e.g. { total: 5, todo: 3, in_progress: 1, done: 1 }.
     */
    public function stats(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'user_id' => ['nullable', 'integer'],
        ]);

        $ownerId = $this->ownerFilter($request, $filters['user_id'] ?? null);

        $counts = Task::query()
            ->when($ownerId, fn ($query) => $query->where('user_id', $ownerId))
            ->selectRaw('status, COUNT(*) AS total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $stats = ['total' => (int) $counts->sum()];
        foreach (TaskStatus::cases() as $status) {
            $stats[$status->value] = (int) ($counts[$status->value] ?? 0);
        }

        return response()->json(['data' => $stats]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $actor = $request->user();

        $task = DB::transaction(function () use ($request, $actor) {
            $task = Task::create([
                ...$request->validated(),
                'user_id' => $request->validated('user_id', $actor->id),
            ]);

            if ($task->user_id !== $actor->id) {
                AuditLog::record($actor, 'task.created', $task, [
                    'title' => $task->title,
                    'owner' => $task->owner->name,
                ]);
            }

            return $task;
        });

        return TaskResource::make($task->load('owner'))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Task $task): TaskResource
    {
        Gate::authorize('view', $task);

        return TaskResource::make($task->load('owner'));
    }

    /** Handles both PUT (full form) and PATCH (e.g. just the status). */
    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        Gate::authorize('update', $task);

        $actor = $request->user();
        $originalOwner = $task->owner;

        $task->fill($request->validated());
        $changes = $this->describeChanges($task);

        DB::transaction(function () use ($task, $actor, $originalOwner, $changes) {
            $task->save();

            $touchesSomeoneElse = $originalOwner->id !== $actor->id || $task->user_id !== $actor->id;
            if ($changes && $touchesSomeoneElse) {
                AuditLog::record($actor, 'task.updated', $task, [
                    'title' => $task->title,
                    'owner' => $originalOwner->name,
                    'changes' => $changes,
                ]);
            }
        });

        return TaskResource::make($task->load('owner'));
    }

    public function destroy(Request $request, Task $task): Response
    {
        Gate::authorize('delete', $task);

        $actor = $request->user();

        DB::transaction(function () use ($task, $actor) {
            if ($task->user_id !== $actor->id) {
                AuditLog::record($actor, 'task.deleted', $task, [
                    'title' => $task->title,
                    'owner' => $task->owner->name,
                ]);
            }

            $task->delete();
        });

        return response()->noContent();
    }

    /**
     * Whose tasks this request may list. Regular users: always their own,
     * whatever they ask for. Admins: the person they picked, or everyone (null).
     */
    private function ownerFilter(Request $request, ?int $requestedUserId): ?int
    {
        $user = $request->user();

        return $user->isAdmin() ? $requestedUserId : $user->id;
    }

    /**
     * What is about to change, as { field: { from, to } }, for the audit log.
     * Must be called after fill() and before save().
     */
    private function describeChanges(Task $task): array
    {
        $changes = [];

        foreach ($task->getDirty() as $field => $newValue) {
            $changes[$field] = ['from' => $task->getRawOriginal($field), 'to' => $newValue];
        }

        // "owner: Priya → Rahul" reads better in the log than "user_id: 3 → 5".
        if (isset($changes['user_id'])) {
            $changes['owner'] = [
                'from' => User::find($changes['user_id']['from'])?->name,
                'to' => User::find($changes['user_id']['to'])?->name,
            ];
            unset($changes['user_id']);
        }

        return $changes;
    }
}
