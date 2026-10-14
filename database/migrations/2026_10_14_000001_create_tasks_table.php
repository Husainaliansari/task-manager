<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * See docs/DATABASE.md for the EXPLAIN output behind each index.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            // CASCADE: a task without an owner makes no sense.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            // ENUM: 1 byte per row, and MySQL itself rejects unknown values.
            $table->enum('status', ['todo', 'in_progress', 'done'])->default('todo');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->date('due_date')->nullable();
            $table->timestamps();

            // InnoDB appends the primary key (id) to every secondary index, so
            // these are really (user_id, status, id) and (status, id). That lets
            // "ORDER BY id DESC LIMIT n" read rows already sorted and stop early.
            $table->index(['user_id', 'status'], 'tasks_user_status_index'); // my tasks by status, per-status counts
            $table->index(['user_id', 'id'], 'tasks_user_recent_index');     // all my tasks, newest first
            $table->index('status', 'tasks_status_index');                   // admin: everyone's tasks by status
        });

        // Last line of defence against blank titles, even if the API is bypassed.
        // (MySQL enforces CHECK constraints from 8.0.16.)
        DB::statement('ALTER TABLE tasks ADD CONSTRAINT tasks_title_not_blank CHECK (CHAR_LENGTH(TRIM(title)) > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
