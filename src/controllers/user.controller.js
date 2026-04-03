import {asyncHandler} from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/User.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshTokens =async (userId) => {
    try {
        const user=await User.findById(userId);
        const accessToken=await user.generateAccessToken();
        const refreshToken=await user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};
        
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh tokens")
    }
}

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

const loginUser = asyncHandler(async (req, res) => {
    // login user controller logic will be here
    const {email,username,password}=req.body;

    if(!email || !password){
        throw new ApiError(400, "Email and password are required")
    }

    const user=await User.findOne({
        $or:[
            {email},
            {username}
        ]
    })

    if(!user){
        throw new ApiError(404, "User not found with this email or username")
    }

    const isPasswordVlaid=await user.isPasswordCorrect(password);
    if(!isPasswordVlaid){
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id);

    const loggedInUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200,{user: loggedInUser, accessToken, refreshToken}, "User logged in successfully", "user logged in successfully")
    )
});

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,{}, "User logged out successfully")
    )
});

export { registerUser,loginUser, logoutUser };