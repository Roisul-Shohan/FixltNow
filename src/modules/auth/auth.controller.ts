import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { AuthService } from "./auth.service.js";
import httpStatus from "http-status";



const registerUser = catchAsync(async (req, res) =>{

    const result = await AuthService.registerUser(req.body);

    sendResponse(res,{
        success :true,
        statusCode : httpStatus.CREATED,
        message : "User registered successfully",
        data : result
    });
});

const loginUser = catchAsync ( async(req, res)=>{
    
    const {accessToken,refreshToken,user} = await AuthService.loginUser(req.body);
    
    res.cookie("accessToken", accessToken, {
        httpOnly : true,
        secure : false,
        sameSite : "none",
        maxAge : 1000 * 60 * 60 * 24
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly : true,
        secure : false,
        sameSite : "none",
        maxAge : 1000 * 60 * 60 * 24 * 7 
    })

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User logged in successfully",
        data: { accessToken, refreshToken,user }
    });


})

const logout = catchAsync(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "none",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "none",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully.",
    data: null,
  });
});


const getMyProfile = catchAsync( async(req , res )=>{
   
    const id =req.user?.id as string;
    const result =await AuthService.getMyProfile(id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User profile fetched successfully",
        data: result
    });


})


export  const AuthController= {
    registerUser,
    loginUser,
    getMyProfile,
    logout,
}

