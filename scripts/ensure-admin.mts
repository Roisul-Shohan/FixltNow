import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Plain-text admin password that the Quick Login shortcut uses.
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "aaaaaaaaaaaaaaa"; // 15 a's — matches the navbar shortcut

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!existing) {
    console.log(`[create] ${ADMIN_EMAIL} not found — creating with bcrypt hash`);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: ADMIN_EMAIL,
        password: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`[done]  created admin with bcrypt("${ADMIN_PASSWORD}")`);
    return;
  }

  // If the row is already a bcrypt hash, verify it matches our target. If not, rehash.
  const isBcrypt = existing.password.startsWith("$2");
  if (isBcrypt) {
    const ok = await bcrypt.compare(ADMIN_PASSWORD, existing.password);
    if (ok) {
      console.log(`[ok]    ${ADMIN_EMAIL} already bcrypt-hashes "${ADMIN_PASSWORD}"`);
      return;
    }
    console.log(`[warn]  ${ADMIN_EMAIL} has a bcrypt hash but it does NOT match "${ADMIN_PASSWORD}" — re-hashing`);
  } else {
    console.log(`[warn]  ${ADMIN_EMAIL} has a legacy plain-text password — promoting to bcrypt hash`);
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: { password: await bcrypt.hash(ADMIN_PASSWORD, 12) },
  });
  console.log(`[done]  re-hashed ${ADMIN_EMAIL} with bcrypt("${ADMIN_PASSWORD}")`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
