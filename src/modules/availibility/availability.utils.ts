import AppError from "../../errors/AppErrors";
import httpStatus from "http-status"


const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);

  return hour !* 60 + minute !;
};

export const validateSlots = (
  slots: {
    startTime: string;
    endTime: string;
  }[]
) => {

  const sorted = [...slots].sort(
    (a, b) =>
      timeToMinutes(a.startTime) -
      timeToMinutes(b.startTime)
  );

  for (let i = 0; i < sorted.length; i++) {

    if (
      timeToMinutes(sorted[i]!.startTime) >=
      timeToMinutes(sorted[i]!.endTime)
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "End time must be greater than start time"
      );
    }

    if (
      i > 0 &&
      timeToMinutes(sorted[i]!.startTime) <
        timeToMinutes(sorted[i - 1]!.endTime)
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Availability slots overlap"
      );
    }
  }
};