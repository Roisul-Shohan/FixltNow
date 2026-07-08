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