<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TaskAssistant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Task 7: "describe a task in your own words" (powered by Claude). */
class TaskAssistantController extends Controller
{
    public function __construct(private readonly TaskAssistant $assistant) {}

    /** Lets the frontend hide the feature when no API key is configured. */
    public function status(): JsonResponse
    {
        return response()->json(['enabled' => $this->assistant->isEnabled()]);
    }

    public function suggest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'min:3', 'max:1000'],
            // The browser's local date, so "tomorrow" means the user's tomorrow.
            'today' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return response()->json([
            'data' => $this->assistant->suggestTask($data['text'], $data['today'] ?? now()->toDateString()),
        ]);
    }
}
