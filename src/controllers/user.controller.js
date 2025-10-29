import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js "
import {uploadOncloudinary} from "../utils/cloudnary.js "
import { apiResponse } from "../utils/apiResponse.js";
import jwt from"jsonwebtoken"
import mongoose from "mongoose";


const genrateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        return{accessToken,refreshToken}

    } catch (error){
        throw new apiError(500,"something went wrong while genrating Access and Refresh token ")
    }
}



const registerUser = asyncHandler(async (req,res) => {
    
    const {fullname,email,username,Password} = req.body
    

    if(
        [fullname,email,username,Password].some((field) => 
        field?.trim() === "")
    ){
        throw new apiError(400,"All fields are required")
    }
    const existedUser =  await User.findOne({
       $or :[{username},{email}] 
    })

    if(existedUser){
        throw new apiError(409,"User with email or username already exists")
    }
    

    const avatarLocalPath = req.files?.avatar[0].path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
     
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new apiError(400,"avatar file is required")
    }
    console.log(avatarLocalPath);
    

     const avatar = await uploadOncloudinary(avatarLocalPath)
     const coverImage = await uploadOncloudinary
     (coverImageLocalPath)

    if(!avatar){
        throw new apiError(400,"avatar file is required")
     }

     const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        Password,
        username: username,
     })

     const createdUser = await User.findById(user._id).select(
        "-Password -refreshToken"
     )

     if(!createdUser){
        throw new apiError(500, "something went wrong while registering the User")
     }

     return res.status(201).json(
        new apiResponse(200,createdUser,"User Registered successfully")
     )
     

     })



const loginUser = asyncHandler(async (req,res)=>{
    const {email,username,password} = req.body
    console.log(email);

    if(!username && !email){
        throw new apiError(400,"username or email is required")
    }
    
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    
    if(!user){
        throw new apiError(404,"user not found")
    }

    const ispasswordValid = await user.ispasswordCorrect(password)

    if(!ispasswordValid){
        throw new apiError(401,"Invalid user credentials")
    }

    const {accessToken , refreshToken} = await genrateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken,options)
    .json(
        new apiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            }
        )
    )

})

const logoutUser = asyncHandler(async(req,res) => {
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
     )

const options = {
        httpOnly:true,
        secure:true
       }

       return res
       .status(200)
       .clearCookie("AccessToken",options)
       .clearCookie("RefreshToken",options)
       .json(new apiResponse(200,{},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res) => 
     {
    
            const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        
            if(!incomingRefreshToken){
                throw new apiError(401,"unauthorized request")
            }
        
             try {
                const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
           
                const user = await User.findById(decodedToken?._id)
           
                if(!user){
                   throw new apiError(401,"invalid refresh Token")
                }
           
                if(incomingRefreshToken !== user?.refreshToken){
                   throw new apiError(401,"Invalid refresh Token")
                }
               
                const {accessToken,NewRefreshToken} = 
                await genrateAccessAndRefreshTokens(user._id)
       
                const options = {
               httpOnly:true,
               secure:true
            }
       
            return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",NewRefreshToken,options)
            .json(
               new apiResponse(
                   200,
                   {accessToken,refreshToken:NewRefreshToken},
                   "Access token refreshed"
               )
            )
             } catch (error) {
                throw new apiError(401,error?.message || "Invalid refresh Token")
             }
    })

    const changeCurrentPassword = asyncHandler(async(req,res) => {

        const {oldPassword,newPassword} = req.body

        const user = await User.findById(req.user?._id)
        const ispasswordCorrect = await user.ispasswordCorrect(oldPassword)

        if(!ispasswordCorrect){
            throw new apiError(400,"wrong password")
        }

        user.password = newPassword
         await user.save({validateBeforeSave:false})

         return res
         .status(200)
         .json(new apiResponse (
             200, {}, "Password changed successfully"
         ))
    })

    const getCurrentUser = asyncHandler(async(req,res)=>{
        return res
        .status(200)
        .json(new apiResponse(
            200,
            req.user,
            "User found"
        ))
    })

    const changeUserDetails = asyncHandler(async(req,res)=>{

           const {fullname,email} = req.body

           if(!fullname || !email){
            throw new apiError("all fields are required")
           }

             const user = await findByIdAndUpdate(
            req.user?._id,

           {
            $set :{
                fullname,
                email:email
            }
           },

           {new:true}

           ).select(-"Password")

           return res
           .status(200)
           .json(new apiResponse(
            200,
            user,
            "Account details updated successfully"
           ))
    })


    const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

   
      
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    changeUserDetails,
    updateUserAvatar,
    updateUserCoverImage
}