import {
  TPaginationOptions,
  TPaginationReturn,
} from "../interfaces/pagination.js";

export const calculatePagination = (
  options: TPaginationOptions
): TPaginationReturn => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder || "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const getPagination = (query: Partial<TPaginationOptions>): TPaginationReturn => {
  return calculatePagination({
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
};