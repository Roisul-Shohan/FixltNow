import { Prisma } from "@prisma/client";

export interface ICreateService {
   userId : string;
   categoryId: string;
   title: string;
   description?: string;
   location: string;
   hourlyRate: number;
   image?: string;
}


export interface IgetService extends Prisma.ServiceWhereInput {
    searchTerm?: string
    page?: string
    limit?: string
    sortOrder?: "asc"|"desc"
    sortBy?: string 
    rating?:string

}