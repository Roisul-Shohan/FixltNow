import { NextFunction, Request, Response } from "express";
import jwt, { Jwt, JwtPayload}  from "jsonwebtoken";
import { UserRole } from "../../prisma/generated/prisma/enums";
import catchAsync from "../utils/catchAsync";
import AppError from "../errors/AppErrors";
import config from "../config";
import httpStatus from "http-status";
import { prisma } from "../lib/prisma";


declare global {
    namespace Express {
        interface Request {
            user?: {
                email: string;
                name: string;
                id: string;
                role: UserRole;
            }
        }
    }
}

export const auth = (...requiredRoles : UserRole[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
       const token =
            req.cookies?.accessToken ||
            req.headers.authorization?.replace("Bearer ", "");

        if(!token){
            throw new AppError( httpStatus.UNAUTHORIZED, "Unauthorized. No token provided");
        }

       let decoded : JwtPayload;

       try{
         decoded = jwt.verify(token,config.jwt_access_secret!) as JwtPayload;
       }catch{

        throw new AppError( httpStatus.UNAUTHORIZED, "Invalid or expired token."  );
       
       }

       const { id} = decoded;

       const user = await prisma.user.findUnique({
             where: { id },
       });

       if(!user){
          throw new AppError(httpStatus.NOT_FOUND,"User not found ");
       }

       if(user.status === 'BLOCKED'){
          throw new AppError(httpStatus.FORBIDDEN,"Your account has been bloked");
       }

       if(requiredRoles.length && !requiredRoles.includes(user.role)) {
         throw new AppError (httpStatus.FORBIDDEN, "You are not authorized to acess this resource");
       }

       req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
      };

       
        next();
        
    }
)
}