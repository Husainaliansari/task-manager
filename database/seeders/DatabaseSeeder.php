<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Demo data so the app has something to show on first run.
 *
 *   php artisan migrate:fresh --seed
 *
 * Admin: admin@example.com / Admin@123
 * Users: priya@example.com, rahul@example.com, arjun@example.com / Password123
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $admin = User::create([
            'name' => 'Neha Kapoor',
            'email' => 'admin@example.com',
            'password' => 'Admin@123',
            'role_id' => Role::named(Role::ADMIN)->id,
        ]);

        $priya = $this->regularUser('Priya Sharma', 'priya@example.com');
        $rahul = $this->regularUser('Rahul Verma', 'rahul@example.com');
        $arjun = $this->regularUser('Arjun Mehta', 'arjun@example.com');

        $this->addTasks($priya, [
            ['Prepare sprint demo', 'Walk through the new onboarding flow and collect feedback.', 'in_progress', 'high', 3],
            ['Review pull request #42', 'Check the pagination changes and the new indexes.', 'todo', 'medium', 1],
            ['Book dentist appointment', null, 'todo', 'low', 10],
            ['Update README', 'Add setup steps for the new environment variables.', 'done', 'medium', -3],
            ['Renew gym membership', null, 'todo', 'low', -1],
        ]);

        $this->addTasks($rahul, [
            ['Send Q3 invoice to Acme', 'They are waiting on it before the month closes.', 'todo', 'high', 2],
            ['Fix login rate limiting', 'Too many attempts should show a friendly message.', 'in_progress', 'high', 0],
            ['Write unit tests for the task API', null, 'done', 'medium', -5],
            ['Plan team lunch', 'Somewhere with vegetarian options.', 'todo', 'low', 14],
        ]);

        $this->addTasks($arjun, [
            ['Design the new settings page', 'Start from the wireframes Priya shared.', 'in_progress', 'medium', 5],
            ['Migrate images to the CDN', null, 'todo', 'medium', null],
            ['Read the system design book Rahul recommended', null, 'todo', 'low', null],
        ]);

        $this->addTasks($admin, [
            ['Approve leave requests', null, 'todo', 'medium', 1],
            ['Quarterly planning with the team', 'Agree on the top three goals for next quarter.', 'todo', 'high', 7],
        ]);
    }

    private function regularUser(string $name, string $email): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => 'Password123',
            'role_id' => Role::named(Role::USER)->id,
        ]);
    }

    /** Each row: [title, description, status, priority, due in N days (null = no due date)]. */
    private function addTasks(User $user, array $tasks): void
    {
        foreach ($tasks as [$title, $description, $status, $priority, $dueInDays]) {
            $user->tasks()->create([
                'title' => $title,
                'description' => $description,
                'status' => $status,
                'priority' => $priority,
                'due_date' => $dueInDays === null ? null : now()->addDays($dueInDays)->toDateString(),
            ]);
        }
    }
}
