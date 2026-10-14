<?php

namespace Database\Seeders;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Fills the tasks table with ~20,000 rows across 50 extra users, so the
 * EXPLAIN plans in docs/DATABASE.md reflect a realistically sized table.
 *
 *   php artisan db:seed --class=BulkTaskSeeder
 */
class BulkTaskSeeder extends Seeder
{
    private const USERS = 50;

    private const TASKS_PER_USER = 400;

    public function run(): void
    {
        $users = User::factory(self::USERS)->create();
        $now = now()->toDateTimeString();

        foreach ($users as $user) {
            $rows = [];

            for ($i = 1; $i <= self::TASKS_PER_USER; $i++) {
                $rows[] = [
                    'user_id' => $user->id,
                    'title' => "Bulk task {$i} for {$user->name}",
                    'description' => null,
                    'status' => fake()->randomElement(TaskStatus::values()),
                    'priority' => fake()->randomElement(TaskPriority::values()),
                    'due_date' => fake()->optional()->date(),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Plain multi-row INSERTs: far quicker than 20,000 Eloquent saves.
            DB::table('tasks')->insert($rows);
        }

        DB::statement('ANALYZE TABLE tasks'); // refresh index statistics for the optimizer
    }
}
