import { Prisma } from "../../prisma/generated/prisma/client";

export const createDefaultAvailability = (
  technicianId: string
): Prisma.AvailabilityCreateManyInput[] => {
  const availabilities: Prisma.AvailabilityCreateManyInput[] = [];

  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const formattedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    availabilities.push(
      {
        technicianId,
        date: formattedDate,
        startTime: "09:00",
        endTime: "12:00",
      },
      {
        technicianId,
        date: formattedDate,
        startTime: "14:00",
        endTime: "17:00",
      }
    );
  }

  return availabilities;
};