import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js "
import {uploadOncloudinary} from "../utils/cloudnary.js "
import { apiResponse } from "../utils/apiResponse.js";


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

export {
    registerUser
}