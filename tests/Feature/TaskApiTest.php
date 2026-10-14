<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_create_a_task(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/api/tasks', [
            'title' => 'Book dentist appointment',
            'priority' => 'low',
            'due_date' => '2026-12-01',
        ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Book dentist appointment')
            ->assertJsonPath('data.status', 'todo') // default
            ->assertJsonPath('data.priority', 'low')
            ->assertJsonPath('data.due_date', '2026-12-01')
            ->assertJsonPath('data.user_id', $user->id);

        $this->assertDatabaseHas('tasks', ['title' => 'Book dentist appointment', 'user_id' => $user->id]);
    }

    public function test_invalid_input_is_rejected_with_field_errors(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/tasks', [
            'title' => '   ',
            'status' => 'someday',
            'priority' => 'urgent',
            'due_date' => '2026-02-30',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'status', 'priority', 'due_date']);
    }

    public function test_the_list_is_paginated_newest_first(): void
    {
        $user = $this->actingAsUser();
        $tasks = Task::factory(5)->for($user, 'owner')->create();

        $this->getJson('/api/tasks?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $tasks->last()->id)
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.last_page', 3);
    }

    public function test_the_list_can_be_filtered_by_status(): void
    {
        $user = $this->actingAsUser();
        Task::factory(2)->for($user, 'owner')->create(['status' => 'done']);
        Task::factory(3)->for($user, 'owner')->create(['status' => 'todo']);

        $this->getJson('/api/tasks?status=done')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.status', 'done');

        $this->getJson('/api/tasks?status=nonsense')->assertUnprocessable();
    }

    public function test_stats_count_tasks_per_status(): void
    {
        $user = $this->actingAsUser();
        Task::factory(3)->for($user, 'owner')->create(['status' => 'todo']);
        Task::factory(1)->for($user, 'owner')->create(['status' => 'done']);

        $this->getJson('/api/tasks/stats')
            ->assertOk()
            ->assertExactJson(['data' => ['total' => 4, 'todo' => 3, 'in_progress' => 0, 'done' => 1]]);
    }

    public function test_a_user_can_update_a_whole_task_or_just_its_status(): void
    {
        $user = $this->actingAsUser();
        $task = Task::factory()->for($user, 'owner')->create(['status' => 'todo']);

        $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'Renamed',
            'description' => 'More detail',
            'status' => 'in_progress',
            'priority' => 'high',
            'due_date' => null,
        ])->assertOk()->assertJsonPath('data.title', 'Renamed');

        $this->patchJson("/api/tasks/{$task->id}", ['status' => 'done'])
            ->assertOk()
            ->assertJsonPath('data.status', 'done')
            ->assertJsonPath('data.title', 'Renamed'); // untouched fields stay as they were
    }

    public function test_a_user_can_delete_a_task(): void
    {
        $user = $this->actingAsUser();
        $task = Task::factory()->for($user, 'owner')->create();

        $this->deleteJson("/api/tasks/{$task->id}")->assertNoContent();

        $this->assertModelMissing($task);
    }

    public function test_a_missing_task_returns_404(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/tasks/999999')->assertNotFound();
    }
}
