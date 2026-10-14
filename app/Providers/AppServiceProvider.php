<?php

namespace App\Providers;

use App\Services\TaskAssistant;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TaskAssistant::class, fn () => new TaskAssistant(
            apiKey: config('services.anthropic.key'),
            model: config('services.anthropic.model'),
        ));
    }

    public function boot(): void
    {
        //
    }
}
