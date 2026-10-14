<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_register_and_gets_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Kavya Iyer',
            'email' => 'kavya@example.com',
            'password' => 'Secret123',
            'password_confirmation' => 'Secret123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'kavya@example.com')
            ->assertJsonPath('user.role', 'user')
            ->assertJsonStructure(['token', 'expires_at']);

        $user = User::where('email', 'kavya@example.com')->first();
        $this->assertNotSame('Secret123', $user->password, 'Passwords must never be stored in plain text.');
        $this->assertTrue(Hash::check('Secret123', $user->password));
    }

    public function test_registration_rejects_weak_passwords_and_duplicate_emails(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/register', [
            'name' => 'Someone',
            'email' => 'taken@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_a_user_can_log_in_with_the_right_password(): void
    {
        User::factory()->create(['email' => 'priya@example.com', 'password' => 'Password123']);

        $this->postJson('/api/login', ['email' => 'priya@example.com', 'password' => 'Password123'])
            ->assertOk()
            ->assertJsonPath('user.email', 'priya@example.com')
            ->assertJsonStructure(['token', 'expires_at']);
    }

    public function test_a_wrong_password_is_rejected_with_401(): void
    {
        User::factory()->create(['email' => 'priya@example.com', 'password' => 'Password123']);

        $this->postJson('/api/login', ['email' => 'priya@example.com', 'password' => 'wrong-password'])
            ->assertUnauthorized();
    }

    public function test_task_endpoints_need_a_token(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
        $this->postJson('/api/tasks', ['title' => 'Sneaky'])->assertUnauthorized();
    }

    public function test_logging_out_revokes_the_token(): void
    {
        $token = User::factory()->create()->createToken('web')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $this->getJson('/api/user', $headers)->assertOk();
        $this->postJson('/api/logout', [], $headers)->assertNoContent();

        $this->app['auth']->forgetGuards(); // make the next request re-check the token
        $this->getJson('/api/user', $headers)->assertUnauthorized();
    }

    public function test_an_expired_token_is_rejected(): void
    {
        $token = User::factory()->create()->createToken('web', ['*'], now()->addMinutes(30))->plainTextToken;

        $this->travel(31)->minutes();

        $this->getJson('/api/user', ['Authorization' => "Bearer {$token}"])->assertUnauthorized();
    }
}
