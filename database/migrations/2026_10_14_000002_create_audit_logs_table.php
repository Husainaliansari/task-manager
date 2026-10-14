<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // SET NULL: the trail must survive even if the admin's account is deleted.
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50);       // e.g. task.updated, user.role_changed
            $table->string('subject_type', 50); // table name of what was changed
            $table->unsignedBigInteger('subject_id');
            $table->json('details')->nullable(); // title, owner, { field: { from, to } }, ...
            $table->timestamp('created_at')->nullable();

            $table->index(['subject_type', 'subject_id']); // "history of this task"
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
