export const buildSearchCondition = (
  searchTerm: string|undefined,
  searchableFields: string[]
) => {
  if (!searchTerm) return {};

  return {
    OR: searchableFields.map(field => {
      if (field.includes(".")) {
        const [relation, key] = field.split(".") as [string, string];

        return {
          [relation]: {
            [key]: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        };
      }

      return {
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      };
    }),
  };
};