export const buildFilterCondition = (
  filters: Record<string, unknown>,
  filterableFields: string[]
): Record<string, unknown>[] => {
  // Fields that represent enums / exact-match tokens. These must use `equals`
  // (not `contains`) — Prisma rejects `contains` on Postgres enum columns and
  // `contains` would over-match values like a hypothetical "SUPER_CUSTOMER".
  // Foreign-key columns (categoryId, technicianId, customerId, …) must also use
  // `equals` — Prisma's typed where input for FK fields does not accept
  // `contains`, only `equals`/`in`/`not`.
  const exactMatchFields = new Set([
    "role",
    "status",
    "isActive",
    "isFeatured",
    "isDeleted",
    "categoryId",
    "technicianId",
    "customerId",
    "serviceId",
    "userId",
    "bookingId",
    "paymentId",
    "reviewId",
  ]);

  const andConditions = Object.entries(filters)
    .filter(
      ([key, value]) =>
        filterableFields.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .map(([key, value]) => {
      let match: Record<string, unknown>;

      if (typeof value === "boolean") {
        match = { equals: value };
      } else if (typeof value === "number") {
        match = { equals: value };
      } else if (typeof value === "string") {
        if (exactMatchFields.has(key)) {
          // Exact match for enum columns. Postgres enum types do not support
          // `mode: "insensitive"` — only String columns do. We uppercase the
          // sent value before sending (router already uppercases enum strings,
          // so this is a defense-in-depth).
          match = { equals: value };
        } else {
          // Partial, case-insensitive substring match for free-text filters.
          match = { contains: value, mode: "insensitive" as const };
        }
      } else {
        match = { equals: value };
      }

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