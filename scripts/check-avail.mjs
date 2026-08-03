import { prisma } from "../src/lib/prisma.js";

const techId = "58c9fe77-c54c-4a88-805d-b04c89b922e4";

const rows = await prisma.availability.findMany({
  where: { technicianId: techId },
  orderBy: [{ date: "asc" }, { startTime: "asc" }],
});

console.log("count:", rows.length);
const dates = [...new Set(rows.map((r) => r.date.toISOString().split("T")[0]))];
console.log("distinct dates:", dates);

await prisma.$disconnect();