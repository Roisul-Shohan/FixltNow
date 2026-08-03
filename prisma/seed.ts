/**
 * Seed script — creates an ADMIN user for FixItNow.
 *
 * Why this exists:
 *   - The /api/auth/register endpoint only allows CUSTOMER / TECHNICIAN roles.
 *   - All roles (including ADMIN) now use bcrypt.compare for password verification.
 *
 * So we cannot register an admin via the API. We insert one directly into
 * the database with a bcrypt-hashed password. Running this script is idempotent:
 * running it twice won't create duplicates.
 *
 * Usage:
 *   cd FixltNow-Backend
 *   npx tsx prisma/seed.ts
 *
 * After running, you can log in with:
 *   email:    admin@fixitnow.com
 *   password: Admin@12345
 */

import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Configure backend/.env first.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "admin@fixitnow.com";
const ADMIN_PASSWORD = "Admin@12345";
const ADMIN_NAME = "Platform Admin";
const BCRYPT_SALT_ROUNDS = 12;

async function main() {
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    // Reset to known-good state: ensure role is ADMIN, status is ACTIVE,
    // and password is the expected bcrypt-hashed value (so the user can log in).
    const updated = await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        role: "ADMIN",
        status: "ACTIVE",
        password: hashed,
        name: existing.name?.trim() ? existing.name : ADMIN_NAME,
      },
    });
    console.log(`✓ Admin already existed — refreshed in place.`);
    console.log(`  id     : ${updated.id}`);
    console.log(`  email  : ${updated.email}`);
    console.log(`  role   : ${updated.role}`);
    console.log(`  status : ${updated.status}`);
  } else {
    const created = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashed,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`✓ Admin user created.`);
    console.log(`  id     : ${created.id}`);
    console.log(`  email  : ${created.email}`);
    console.log(`  role   : ${created.role}`);
    console.log(`  status : ${created.status}`);
  }

  console.log("\nLogin credentials:");
  console.log(`  email    : ${ADMIN_EMAIL}`);
  console.log(`  password : ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });