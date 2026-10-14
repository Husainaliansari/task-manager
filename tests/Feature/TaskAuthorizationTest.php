<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_only_see_their_own_tasks(): void
    {
        $me = $this->actingAsUser();
        $mine = Task::factory()->for($me, 'owner')->create();
        Task::factory(3)->create(); // other people's

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);

        $this->getJson('/api/tasks/stats')->assertJsonPath('data.total', 1);
    }

    public function test_users_cannot_peek_at_others_by_passing_a_user_id(): void
    {
        $me = $this->actingAsUser();
        Task::factory()->for($me, 'owner')->create();
        $someoneElse = User::factory()->has(Task::factory(4))->create();

        // The filter is simply ignored: you still get only your own tasks.
        $this->getJson("/api/tasks?user_id={$someoneElse->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.user_id', $me->id);

        $this->getJson("/api/tasks/stats?user_id={$someoneElse->id}")->assertJsonPath('data.total', 1);
    }

    public function test_users_get_403_on_someone_elses_task(): void
    {
        $this->actingAsUser();
        $theirs = Task::factory()->create();

        $this->getJson("/api/tasks/{$theirs->id}")->assertForbidden();
        $this->patchJson("/api/tasks/{$theirs->id}", ['status' => 'done'])->assertForbidden();
        $this->deleteJson("/api/tasks/{$theirs->id}")->assertForbidden();

        $this->assertModelExists($theirs);
    }

    public function test_users_cannot_give_tasks_to_other_people(): void
    {
        $this->actingAsUser();
        $someoneElse = User::factory()->create();

        $this->postJson('/api/tasks', ['title' => 'Not mine to give', 'user_id' => $someoneElse->id])
            ->assertForbidden();
    }

    public function test_users_cannot_open_admin_pages(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/admin/activity')->assertForbidden();
    }

    public function test_admins_see_everyones_tasks_and_can_filter_by_person(): void
    {
        $this->actingAsAdmin();
        $priya = User::factory()->create();
        Task::factory(2)->for($priya, 'owner')->create();
        Task::factory(3)->create();

        $this->getJson('/api/tasks')->assertOk()->assertJsonPath('meta.total', 5);

        $this->getJson("/api/tasks?user_id={$priya->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.owner.name', $priya->name);
    }

    public function test_admin_changes_to_other_peoples_tasks_are_audited(): void
    {
        $admin = $this->actingAsAdmin();
        $priya = User::factory()->create(['name' => 'Priya Sharma']);
        $task = Task::factory()->for($priya, 'owner')->create(['title' => 'Write report', 'status' => 'todo']);

        $this->patchJson("/api/tasks/{$task->id}", ['status' => 'done'])->assertOk();

        $entry = AuditLog::sole();
        $this->assertSame($admin->id, $entry->actor_id);
        $this->assertSame('task.updated', $entry->action);
        $this->assertSame('Priya Sharma', $entry->details['owner']);
        $this->assertEquals(['from' => 'todo', 'to' => 'done'], $entry->details['changes']['status']);
    }

    public function test_admins_editing_their_own_tasks_are_not_audited(): void
    {
        $admin = $this->actingAsAdmin();
        $task = Task::factory()->for($admin, 'owner')->create();

        $this->patchJson("/api/tasks/{$task->id}", ['status' => 'done'])->assertOk();

        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_admins_can_assign_and_delete_other_peoples_tasks(): void
    {
        $this->actingAsAdmin();
        $rahul = User::factory()->create();

        $taskId = $this->postJson('/api/tasks', ['title' => 'For Rahul', 'user_id' => $rahul->id])
            ->assertCreated()
            ->assertJsonPath('data.owner.id', $rahul->id)
            ->json('data.id');

        $this->deleteJson("/api/tasks/{$taskId}")->assertNoContent();

        $this->assertSame(
            ['task.created', 'task.deleted'],
            AuditLog::orderBy('id')->pluck('action')->all(),
        );
    }
}
