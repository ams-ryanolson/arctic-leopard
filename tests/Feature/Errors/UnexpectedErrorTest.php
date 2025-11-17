<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the unexpected error page for server errors', function (): void {
    Route::middleware('web')->get('/testing-error-boundary', static function () {
        throw new \RuntimeException('Test exception');
    });

    $response = $this->get('/testing-error-boundary');

    $response->assertStatus(500);
    $response->assertInertia(
        fn (Assert $page): Assert => $page
            ->component('Errors/Unexpected')
            ->where('status', 500)
    );
});

it('falls back to json when requested', function (): void {
    Route::middleware('web')->get('/testing-error-boundary-json', static function () {
        throw new \RuntimeException('JSON exception');
    });

    $response = $this->getJson('/testing-error-boundary-json');

    $response->assertStatus(500)
        ->assertJsonFragment(['exception' => 'RuntimeException']);
});
