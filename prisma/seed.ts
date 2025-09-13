import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create a default admin user
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const user = await prisma.user.upsert({
    where: { id: "temp-user-id" },
    update: {
      name: "Demo Admin",
      role: "admin",
      title: "Sales Manager",
      isActive: true,
    },
    create: {
      id: "temp-user-id",
      email: "demo@onward.com",
      name: "Demo Admin",
      role: "admin",
      title: "Sales Manager",
      isActive: true,
    },
  });

  // Create account with password for authentication
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: user.email,
      }
    },
    update: {
      password: hashedPassword,
    },
    create: {
      providerId: "credential",
      accountId: user.email,
      userId: user.id,
      password: hashedPassword,
    },
  });

  console.log("Seed data created:", { user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });