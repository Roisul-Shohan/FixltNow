import { prisma } from "../../lib/prisma.js";


const DEFAULT_SLOTS = [
  {
    startTime: "09:00",
    endTime: "12:00",
  },
  {
    startTime: "14:00",
    endTime: "17:00",
  },
];

const ensureNextSevenDaysAvailability = async (
  technicianId: string
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  await prisma.availability.deleteMany({
    where: {
      technicianId,
      date: {
        lt: today,
      },
    },
  });

  // get existing dates
  const existing = await prisma.availability.findMany({
    where: {
      technicianId,
      date: {
        gte: today,
      },
    },
    select: {
      date: true,
    },
    distinct: ["date"],
  });

  const existingDates = new Set(
    existing.map((item) => item.date.toISOString().split("T")[0])
  );

  const createData = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const key = date.toISOString().split("T")[0];

    if (existingDates.has(key)) continue;

    for (const slot of DEFAULT_SLOTS) {
      createData.push({
        technicianId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }
  }

  if (createData.length) {
    await prisma.availability.createMany({
      data: createData,
    });
  }
};

const getAvailability = async (technicianId: string) => {
  await ensureNextSevenDaysAvailability(technicianId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.availability.findMany({
    where: {
      technicianId,
      date: {
        gte: today,
      },
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });
};

export const AvailabilityService = {
  getAvailability,
};