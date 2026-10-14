<?php

namespace Tests\Feature;

use App\Services\TaskAssistant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

/** The real Claude API is never called from tests; the service is mocked. */
class TaskAssistantTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_assistant_reports_itself_disabled_without_an_api_key(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/assistant')->assertOk()->assertJson(['enabled' => false]);

        $this->postJson('/api/assistant/suggest', ['text' => 'Call the bank tomorrow'])
            ->assertServiceUnavailable();
    }

    public function test_the_note_is_validated(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/assistant/suggest', ['text' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('text');
    }

    public function test_a_suggestion_is_returned_for_the_users_local_date(): void
    {
        $this->actingAsUser();

        $suggestion = [
            'title' => 'Call the bank',
            'description' => null,
            'priority' => 'medium',
            'due_date' => '2026-10-15',
            'reason' => 'You said tomorrow, and nothing sounded urgent.',
        ];

        $this->mock(TaskAssistant::class, function (MockInterface $mock) use ($suggestion) {
            $mock->shouldReceive('suggestTask')
                ->once()
                ->with('Call the bank tomorrow', '2026-10-14')
                ->andReturn($suggestion);
        });

        $this->postJson('/api/assistant/suggest', ['text' => 'Call the bank tomorrow', 'today' => '2026-10-14'])
            ->assertOk()
            ->assertExactJson(['data' => $suggestion]);
    }
}
