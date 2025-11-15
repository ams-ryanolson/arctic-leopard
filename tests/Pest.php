<?php

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature', 'Unit', 'Browser');

/*
|--------------------------------------------------------------------------
| Global Test Setup
|--------------------------------------------------------------------------
|
| Fake broadcasting and HTTP requests globally to prevent hangs during tests.
| Individual tests can override these if needed.
|
*/

beforeEach(function (): void {
    // Fake only the broadcasting events that implement ShouldBroadcast to prevent hangs
    // Note: We use Event::fake() with specific events to avoid interfering with test assertions
    Event::fake([
        \App\Events\TimelineEntryBroadcast::class,
    ]);

    // Fake HTTP requests globally to prevent hangs from external API calls (e.g., CountryResolver)
    // Tests can override this by calling Http::fake() again with specific configurations
    Http::fake();
});

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}
