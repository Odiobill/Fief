#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Applying database migrations..."
./node_modules/.bin/prisma migrate deploy --config ./prisma.config.js

echo "Starting Next.js application..."
node server.js
