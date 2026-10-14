<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    /** Log in as a fresh regular user for the rest of the test. */
    protected function actingAsUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        Sanctum::actingAs($user);

        return $user;
    }

    /** Log in as a fresh admin for the rest of the test. */
    protected function actingAsAdmin(array $attributes = []): User
    {
        $admin = User::factory()->admin()->create($attributes);
        Sanctum::actingAs($admin);

        return $admin;
    }
}
