<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_team_list_shows_task_counts_per_person(): void
    {
        $this->actingAsAdmin(['name' => 'Aaron Admin']);
        $priya = User::factory()->create(['name' => 'Priya Sharma']);
        Task::factory(2)->for($priya, 'owner')->create(['status' => 'todo']);
        Task::factory(1)->for($priya, 'owner')->create(['status' => 'done']);

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonPath('data.1.name', 'Priya Sharma')
            ->assertJsonPath('data.1.task_counts', ['total' => 3, 'todo' => 2, 'in_progress' => 0, 'done' => 1]);
    }

    public function test_an_admin_can_promote_a_user_and_it_is_audited(): void
    {
        $this->actingAsAdmin();
        $rahul = User::factory()->create(['name' => 'Rahul Verma']);

        $this->patchJson("/api/admin/users/{$rahul->id}/role", ['role' => 'admin'])
            ->assertOk()
            ->assertJsonPath('data.role', 'admin');

        $this->assertTrue($rahul->fresh()->isAdmin());
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.role_changed', 'subject_id' => $rahul->id]);

        // assertEquals, not assertSame: MySQL's JSON type doesn't keep key order.
        $details = $this->getJson('/api/admin/activity')->assertOk()->json('data.0.details');
        $this->assertEquals(['user' => 'Rahul Verma', 'from' => 'user', 'to' => 'admin'], $details);
    }

    public function test_an_admin_cannot_change_their_own_role(): void
    {
        $admin = $this->actingAsAdmin();

        $this->patchJson("/api/admin/users/{$admin->id}/role", ['role' => 'user'])->assertForbidden();

        $this->assertTrue($admin->fresh()->isAdmin());
    }

    public function test_unknown_roles_are_rejected(): void
    {
        $this->actingAsAdmin();
        $user = User::factory()->create();

        $this->patchJson("/api/admin/users/{$user->id}/role", ['role' => 'superhero'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');
    }
}
