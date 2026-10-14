<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /** Hashing is slow on purpose, so hash the shared test password only once. */
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'role_id' => fn () => Role::named(Role::USER)->id,
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('Password123'),
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role_id' => Role::named(Role::ADMIN)->id]);
    }
}
