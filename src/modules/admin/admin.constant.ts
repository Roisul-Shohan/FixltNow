export const userSearchableFields = [
  "name",
  "technicianProfile.bio",
];

export const userFilterableFields = [
  "role",
  "status",
  "technicianProfile.yearsOfExperience",
];

export const categorySearchableFields = [
  "description",
];

export const categoryFilterableFields = [
  "name",
  "isActive",
];

export const bookingSearchableFields = [
  "customerAddress",
  "service.title",
];

export const bookingFilterableFields = [
  "status",
  "customerId",
  "technicianId",
  "serviceId",
];

// Re-exported from the service module so admin/service can use the same
// filterable/searchable field set without creating a hard dependency.
export { serviceFilterableFields, serviceSearchableFields } from "../service/service.constant.js";

export const adminReviewSearchableFields = [
  "comment",
  "service.title",
  "customer.name",
];

export const adminReviewFilterableFields = [
  "rating",
  "serviceId",
  "technicianId",
  "customerId",
];