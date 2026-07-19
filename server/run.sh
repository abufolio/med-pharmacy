#!/bin/bash
set -e
echo "=== Prisma push ==="
npx prisma db push --schema=packages/database/prisma/schema.prisma 2>&1
echo "=== Starting API ==="
npx nest start api --watch 2>&1
