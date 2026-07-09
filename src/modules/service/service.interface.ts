import { ServiceWhereInput } from "../../../prisma/generated/prisma/models";

export interface ICreateService {
   userId : string;
   categoryId: string;
   title: string;
   description?: string;
   location: string;
   hourlyRate: number;
}


export interface IgetService extends ServiceWhereInput{
    searchTerm?: string
    page?: string
    limit?: string
    sortOrder?: "asc"|"desc"
    sortBy?: string 
    rating?:string

}