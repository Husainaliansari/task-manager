<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            // RESTRICT: a role can't be deleted while people still have it.
            $table->unsignedTinyInteger('role_id');
            $table->foreign('role_id')->references('id')->on('roles')->restrictOnDelete();
            $table->string('name', 100);
            // 190 chars keeps the unique index inside InnoDB's key-size limit with utf8mb4.
            $table->string('email', 190)->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
