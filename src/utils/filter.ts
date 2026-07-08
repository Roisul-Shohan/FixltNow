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
      if (key.includes(".")) {
        const [relation, field] = key.split(".") as [string,string];

        return {
          [relation]: {
            [field]: value,
          },
        };
      }

      return {
        [key]: value,
      };
    });

  return andConditions;
};