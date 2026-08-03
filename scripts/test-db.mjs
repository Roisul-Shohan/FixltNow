import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const users = await prisma.user.findMany({
  take: 10,
  select: { id: true, email: true, role: true },
});
console.log("USERS:", JSON.stringify(users, null, 2));

const cats = await prisma.category.findMany({
  take: 20,
  select: { id: true, name: true },
});
console.log("CATEGORIES:", JSON.stringify(cats, null, 2));

const services = await prisma.service.findMany({
  take: 30,
  select: {
    id: true,
    title: true,
    categoryId: true,
    technicianId: true,
    isActive: true,
    category: { select: { id: true, name: true } },
  },
});
console.log("SERVICES:", JSON.stringify(services, null, 2));

// Reset admin password so we can test the API.
import bcrypt from "bcryptjs";
const hashed = await bcrypt.hash("testpass123", 10);
await prisma.user.update({
  where: { id: "7a933c5d-7e3b-4588-9420-32d3d4c534cf" },
  data: { password: hashed },
});
console.log("admin password reset");

// Test the actual filter that admin/services uses.
const TEST_CAT_ID = "d4179c86-00df-4ae4-b308-ff6b2c1b2d6e"; // Electrical Services
const filtered = await prisma.service.findMany({
  where: {
    AND: [
      { categoryId: { contains: TEST_CAT_ID, mode: "insensitive" } },
    ],
  },
  select: { id: true, title: true, categoryId: true, category: { select: { id: true, name: true } } },
});
console.log("FILTERED (contains+insensitive):", JSON.stringify(filtered, null, 2));

const filtered2 = await prisma.service.findMany({
  where: {
    AND: [
      { categoryId: { equals: TEST_CAT_ID } },
    ],
  },
  select: { id: true, title: true, categoryId: true },
});
console.log("FILTERED (equals):", JSON.stringify(filtered2, null, 2));

const filtered3 = await prisma.service.findMany({
  where: {
    categoryId: TEST_CAT_ID,
  },
  select: { id: true, title: true, categoryId: true },
});
console.log("FILTERED (direct):", JSON.stringify(filtered3, null, 2));

await prisma.$disconnect();
