<?php

use App\Http\Controllers\Api\Admin\ActivityController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskAssistantController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

/*
| Every route here is prefixed with /api.
| Requests without a valid token get 401; logged-in users without
| permission get 403 (from the TaskPolicy or the "admin" middleware).
*/

// Public. Throttled to slow down password guessing.
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/tasks/stats', [TaskController::class, 'stats']);
    Route::apiResource('tasks', TaskController::class);

    Route::get('/assistant', [TaskAssistantController::class, 'status']);
    Route::post('/assistant/suggest', [TaskAssistantController::class, 'suggest'])->middleware('throttle:10,1');

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);
        Route::get('/activity', [ActivityController::class, 'index']);
    });
});
