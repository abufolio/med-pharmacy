const { execSync } = require("child_process");
const path = require("path");

const serverDir = __dirname;
process.chdir(serverDir);

console.log("=== Prisma: Pushing schema to PostgreSQL ===");
try {
  execSync("npx prisma db push --schema=packages/database/prisma/schema.prisma", {
    stdio: "inherit",
    cwd: serverDir,
  });
  console.log("\n✓ Database schema pushed successfully!");
} catch (e) {
  console.error("\n✗ Prisma push failed:", e.message);
  process.exit(1);
}
