export interface TRegisterUser {
  name: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string;
  role: "CUSTOMER" | "TECHNICIAN";

  bio?: string;
  yearsOfExperience?: number;
}

export interface TLoginUser {
  email: string;
  password: string;
}

export interface TUpdateMyProfile {
  name?: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  yearsOfExperience?: number;
}