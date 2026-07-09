export interface ICreateService {
   userId : string;
   categoryId: string;
   title: string;
   description?: string;
   location: string;
   hourlyRate: number;
}