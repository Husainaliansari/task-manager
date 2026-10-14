<?php

use Illuminate\Support\Facades\Schedule;

// Clean up login tokens that expired more than a day ago.
// (Runs when `php artisan schedule:work` or a cron entry is active.)
Schedule::command('sanctum:prune-expired --hours=24')->daily();
