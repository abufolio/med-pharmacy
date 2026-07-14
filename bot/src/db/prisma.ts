/**
 * Prisma Client singleton for the bot
 */

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

/**
 * Graceful shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
