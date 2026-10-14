<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Roles are rows, not magic strings: adding a "manager" role later is an
 * INSERT, not a schema change. Runs before the users table, which points here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->tinyIncrements('id');
            $table->string('name', 30)->unique();
        });

        // The app can't work without these two, so they ship with the schema
        // instead of living only in a seeder.
        DB::table('roles')->insert([
            ['name' => 'admin'],
            ['name' => 'user'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
