import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Clear database first
  await prisma.activityItem.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.user.deleteMany({});

  const adminPassword = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      name: 'Admin Daily Activity',
      password: adminPassword,
      role: Role.ADMIN,
      division: 'IT Operations',
    },
  });

  console.log('Seeding completed successfully!');
  console.log({
    admin: { email: admin.email, role: admin.role },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
