node_modules/.bin/prisma db push --schema=packages/database/prisma/schema.prisma 2>&1
echo "EXIT_CODE: $?"
