import { UserWhereInput } from "../../../prisma/generated/prisma/models";

export interface Igetuser extends UserWhereInput{
    searchTerm?: string
    page?: string
    limit?: string
    sortOrder?: "asc"|"desc"
    sortBy?: string

}