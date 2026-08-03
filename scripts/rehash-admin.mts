import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const TARGET_EMAILS = ["admin@gmail.com", "admin@fixitnow.com"];
const TARGET_PASSWORD = "aaaaaaaaaaaaaaaa"; // 16 chars (legacy admin password)

async function main() {
  let touched = 0;
  for (const email of TARGET_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`[skip] ${email} not found`);
      continue;
    }
    const looksHashed = user.password.startsWith("$2");
    if (looksHashed) {
      console.log(`[ok]   ${email} already bcrypt-hashed`);
      continue;
    }
    const hash = await bcrypt.hash(TARGET_PASSWORD, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });
    console.log(`[done] ${email} password re-hashed with bcrypt`);
    touched++;
  }
  console.log(`\nUpdated ${touched} admin row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
