import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create users
  await prisma.user.upsert({
    where: { email: "owner@balance.coffee" },
    update: {},
    create: {
      email: "owner@balance.coffee",
      password: bcryptjs.hashSync("owner123", 10),
      name: "Аслан",
      role: "OWNER",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@balance.coffee" },
    update: {},
    create: {
      email: "manager@balance.coffee",
      password: bcryptjs.hashSync("manager123", 10),
      name: "Менеджер",
      role: "MANAGER",
    },
  });

  console.log("Users seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
