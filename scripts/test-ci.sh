#!/bin/bash
# Run the same commands that GitHub Actions runs for tests

set -e

echo "🧪 Running CI tests locally..."

# Set environment variables (same as GitHub Actions)
export REDIS_HOST=127.0.0.1
export QUEUE_CONNECTION=sync
export DB_CONNECTION=sqlite
export DB_DATABASE=":memory:"
export APP_ENV=testing

# Run tests
php artisan test

echo "✅ Tests passed!"

