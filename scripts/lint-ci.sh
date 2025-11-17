#!/bin/bash
# Run the same commands that GitHub Actions runs for linting

set -e

echo "🔍 Running CI linting locally..."

# Run Pint (PHP formatter)
vendor/bin/pint

# Format Frontend
npm run format

# Lint Frontend
npm run lint

echo "✅ Linting passed!"

