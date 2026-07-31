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

// The app targets Bangladesh (UTC+6). All "today" calculations use this
// timezone so a slot generated for "today" in Asia/Dhaka is never mistakenly
// treated as past because the server's UTC clock has crossed midnight.
const APP_TIMEZONE = "Asia/Dhaka";

const getStartOfToday = (): Date => {
  // Intl gives us the Y-M-D parts in the target timezone. We then build a
  // Date at UTC midnight on that YMD so that Prisma's @db.Date stores the
  // correct calendar day. (The previous implementation subtracted 6h, which
  // caused the stored YMD to fall on the previous UTC day and made "today"
  // queries compare against yesterday.)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "01";

  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));

  return new Date(Date.UTC(y, m - 1, d));
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const toDateKey = (date: Date): string =>
  date.toISOString().split("T")[0]!;

/**
 * Ensure the technician has availability for the rolling 7-day window
 * starting today. The window is [today, today + 6]. Days the technician
 * has already customized are left untouched. Days that have already
 * passed are deleted.
 */
const ensureNextSevenDaysAvailability = async (
  technicianId: string
) => {
  const today = getStartOfToday();

  // 1. Drop anything older than today. These slots are no longer bookable
  // and would otherwise show up in the API if the cron missed a day.
  await prisma.availability.deleteMany({
    where: {
      technicianId,
      date: {
        lt: today,
      },
    },
  });

  // 2. Find which of the next 7 days already have rows. We never overwrite
  // these — technicians may have customized their schedule and we must
  // respect that.
  const windowEnd = addDays(today, 6);

  const existing = await prisma.availability.findMany({
    where: {
      technicianId,
      date: {
        gte: today,
        lte: windowEnd,
      },
    },
    select: {
      date: true,
    },
    distinct: ["date"],
  });

  const existingDates = new Set(
    existing.map((item) => toDateKey(item.date))
  );

  // 3. Fill missing days with the default morning/afternoon slots.
  const createData: {
    technicianId: string;
    date: Date;
    startTime: string;
    endTime: string;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const key = toDateKey(date);

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

/**
 * Roll the 7-day window for every technician in the system. Intended to be
 * run once at startup (to clean up any stale data) and then on a daily cron.
 */
const runAvailabilityRollForAllTechnicians = async () => {
  const technicians = await prisma.technicianProfile.findMany({
    select: { id: true },
  });

  for (const t of technicians) {
    try {
      await ensureNextSevenDaysAvailability(t.id);
    } catch (err) {
      // Log and continue — a single technician failure shouldn't block the
      // rest of the roll.
      console.error(
        `[availability-roll] failed for technician ${t.id}:`,
        err
      );
    }
  }

  console.log(
    `[availability-roll] completed for ${technicians.length} technician(s) at ${new Date().toISOString()}`
  );
};

/**
 * Compute the delay (ms) until the next 00:00 in the app timezone, then
 * schedule the roll. After each run we reschedule for the following day.
 */
const scheduleDailyAvailabilityRoll = () => {
  const scheduleNext = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? "0");

    const y = get("year");
    const mo = get("month");
    const d = get("day");

    // Next midnight in app timezone, expressed as a UTC instant.
    const nextMidnightApp = new Date(Date.UTC(y, mo - 1, d + 1, 0, 0, 0) - 6 * 60 * 60 * 1000);
    const delay = nextMidnightApp.getTime() - now.getTime();

    const fire = async () => {
      try {
        await runAvailabilityRollForAllTechnicians();
      } catch (err) {
        console.error("[availability-roll] scheduled run failed:", err);
      } finally {
        scheduleNext();
      }
    };

    setTimeout(fire, Math.max(delay, 1000));
  };

  scheduleNext();
};

const getAvailability = async (technicianId: string) => {
  await ensureNextSevenDaysAvailability(technicianId);

  const today = getStartOfToday();

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
  ensureNextSevenDaysAvailability,
  runAvailabilityRollForAllTechnicians,
  scheduleDailyAvailabilityRoll,
};