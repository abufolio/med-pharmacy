import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const login = process.env.SUPER_ADMIN_LOGIN || 'admin';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
  const fullName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.superAdmin.findUnique({ where: { login } });

  if (existing) {
    console.log(`Super admin "${login}" already exists, skipping.`);
    return;
  }

  await prisma.superAdmin.create({
    data: { login, passwordHash, fullName },
  });

  console.log(`Super admin "${login}" created successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
