<?php

namespace Tests;

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles and permissions for each test (needed because RefreshDatabase resets the DB)
        app(RolesAndPermissionsSeeder::class)->run();
    }
}
