import { randomUUID } from "node:crypto";

import dotenv from "dotenv";
import { hashPassword } from "better-auth/crypto";

const envFile = process.argv.includes("--production")
  ? ".env.production"
  : ".env";

dotenv.config({ path: envFile });

async function main() {
  console.log(`Using environment: ${envFile}`);

  const { db } = await import("@/server/db/prisma");

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Nature's Nectar Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await hashPassword(password);

  await db.user.upsert({
    where: {
      email,
    },
    update: {
      name,
      role: "ADMIN",
      emailVerified: true,
      accounts: {
        deleteMany: {
          providerId: "credential",
        },
        create: {
          id: randomUUID(),
          accountId: randomUUID(),
          providerId: "credential",
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
    create: {
      id: randomUUID(),
      email,
      name,
      emailVerified: true,
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: {
        create: {
          id: randomUUID(),
          accountId: randomUUID(),
          providerId: "credential",
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  console.log(`Admin user ready: ${email}`);

  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});