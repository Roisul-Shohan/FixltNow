import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { TLoginUser, TRegisterUser, TUpdateMyProfile } from "./auth.interface.js";
import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import config from "../../config/index.js";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { createDefaultAvailability } from "../../utils/createDefaultAvailability.js";

const registerUser = async (payload : TRegisterUser)=>{

    const {name,email,password,phone,role} =payload;

    const existingUser = await prisma.user.findUnique({
       where:{email}
    });

    if(existingUser) {
        throw new AppError(httpStatus.CONFLICT,"Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password,Number(config.bcrypt_salt_rounds));
    
    const result = await prisma.$transaction(async (tx)=>{
        const createdUser =await tx.user.create({
            data :{
                name ,
                email,
                password :hashedPassword,
                phone,
                role
            },
        });

        if(role === "TECHNICIAN"){
           const technician = await tx.technicianProfile.create({
                data :{
                    userId : createdUser.id,
                    bio :payload.bio,
                    yearsOfExperience : payload.yearsOfExperience,
                },
            });

            await tx.availability.createMany({
                data: createDefaultAvailability(technician.id)
            });
        }

        const user = await tx.user.findUnique({

            where:{id:createdUser.id},

            include :{
                technicianProfile :true,
            },
            
            omit :{
                password: true ,
            }
        });

        return user;
    })

    return result;
    
};

const loginUser = async(payload : TLoginUser) => {
    const {email, password}= payload;

    const user = await prisma.user.findUnique({
        where :{email},
        include: {
           technicianProfile: true,
        },
    });

    if(!user){
        throw new AppError(httpStatus.NOT_FOUND,"User not found")
    }

    if(user.status === "BLOCKED"){
        throw new AppError(httpStatus.FORBIDDEN,"Your account has been blocked. Please contact support.");
    }

    // Unified bcrypt comparison for every role (fixes plaintext ADMIN check)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials")
    }


    const jwtPayload: JwtPayload = {
        id: user.id,
        name : user.name,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwt.sign(
        jwtPayload,
        config.jwt_access_secret!,
        {
            expiresIn: config.jwt_access_expires_in as StringValue,
        }
    );

    const refreshToken = jwt.sign(
        jwtPayload,
        config.jwt_refresh_secret!,
        {
            expiresIn: config.jwt_refresh_expires_in as StringValue,
        }
    );

    const { password:_, ...userData } = user;

    return {
        accessToken,
        refreshToken,
        user: userData
    };

}

const getMyProfile = async (id : string) =>{

    const user = await prisma.user.findUnique({
        where :{id},
        include :{
            technicianProfile : true,
        },
        omit :{
            password : true,
        }
    });

    return user;
}

const refreshToken = async (payload : { refreshToken: string }) => {
    const { refreshToken: token } = payload;

    let decoded: JwtPayload;
    try {
        decoded = jwt.verify(token, config.jwt_refresh_secret!) as JwtPayload;
    } catch {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { technicianProfile: true },
        omit: { password: true },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const jwtPayload: JwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwt.sign(
        jwtPayload,
        config.jwt_access_secret!,
        {
            expiresIn: config.jwt_access_expires_in as StringValue,
        }
    );

    const newRefreshToken = jwt.sign(
        jwtPayload,
        config.jwt_refresh_secret!,
        {
            expiresIn: config.jwt_refresh_expires_in as StringValue,
        }
    );

    return { accessToken, refreshToken: newRefreshToken };
}


const updateMyProfile = async (id: string, payload: TUpdateMyProfile) => {
  const { name, phone, profileImage, bio, yearsOfExperience } = payload;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { technicianProfile: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const userUpdateData: { name?: string; phone?: string; profileImage?: string } = {};
  if (name !== undefined) userUpdateData.name = name;
  if (phone !== undefined) userUpdateData.phone = phone;
  if (profileImage !== undefined) userUpdateData.profileImage = profileImage;

  const result = await prisma.$transaction(async (tx) => {
    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id },
        data: userUpdateData,
      });
    }

    if (user.role === "TECHNICIAN") {
      if (bio !== undefined || yearsOfExperience !== undefined) {
        if (!user.technicianProfile) {
          throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
        }
        await tx.technicianProfile.update({
          where: { id: user.technicianProfile.id },
          data: {
            ...(bio !== undefined && { bio }),
            ...(yearsOfExperience !== undefined && { yearsOfExperience }),
          },
        });
      }
    } else {
      if (bio !== undefined || yearsOfExperience !== undefined) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Bio and yearsOfExperience can only be updated by technicians",
        );
      }
    }

    const updated = await tx.user.findUnique({
      where: { id },
      include: { technicianProfile: true },
      omit: { password: true },
    });

    return updated;
  });

  return result;
};

export const AuthService = {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  refreshToken,
};