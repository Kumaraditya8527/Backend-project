import {asyncHandler} from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/User.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    const {username, email, fullname, password} = req.body;
    console.log("email:", email);

    if([username, email, fullname, password].some((field)=>
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existeduser = await User.findOne({
        $or:[{ email },{ username }]
    })
    if(existeduser){
        throw new ApiError(409, "User already exists with this email or username")
    }

    const avatarPath = req.files?.avatar?.[0]?.path;
    const coverImagePath = req.files?.coverImage?.[0]?.path;

    if(!avatarPath){
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarPath);
    const coverImage =await uploadOnCloudinary(coverImagePath);

    if(!avatar){
        throw new ApiError(400, "avatar image is required")
    }

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser=await User.findById(user._1d).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, "User registered successfully", createdUser, "user registered successfully")
    )

});    

export { registerUser };