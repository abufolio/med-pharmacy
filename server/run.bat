@echo off
cd /d "%~dp0"
echo Running Prisma push...
call npx prisma db push --schema=packages/database/prisma/schema.prisma
echo.
echo Starting API server...
call npx nest start api --watch
pause
