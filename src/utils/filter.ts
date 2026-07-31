export const buildFilterCondition = (
  filters: Record<string, unknown>,
  filterableFields: string[]
) => {
  const andConditions = Object.entries(filters)
    .filter(
      ([key, value]) =>
        filterableFields.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .map(([key, value]) => {
      // String filters use Prisma's `contains` with case-insensitive mode so
      // users can type "dhaka" or "DHAKA" and still match stored values like
      // "Dhaka". Non-string filters (numeric rating, etc.) are passed through.
      const isString = typeof value === "string";
      const match = isString
        ? { contains: value, mode: "insensitive" as const }
        : value;

      if (key.includes(".")) {
        const [relation, field] = key.split(".") as [string, string];

        return {
          [relation]: {
            [field]: match,
          },
        };
      }

      return {
        [key]: match,
      };
    });

  return andConditions;
};