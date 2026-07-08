import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
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


export  const AuthController= {
    registerUser,
    loginUser
}

