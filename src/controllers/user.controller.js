import {asyncHandler} from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/User.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

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

    if(!(username || email)){
        throw new ApiError(400, "Username or email are required")
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
                refreshToken: 1
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(400, "Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(404, "invalid refresh token")
        }
    
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure:true,
        }
    
        const {accessToken, newrefreshToken}=await generateAccessAndRefreshTokens(user._id);
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options).json(
            new ApiResponse(200,{accessToken, newrefreshToken}, "Access token refreshed successfully", "access token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid refresh token")
    }


})

const changePassword = asyncHandler(async (req, res) => {
    // change password controller logic will be here
    const {currentPassword, newPassword}=req.body;

    const user=await User.findById(req.user?._id);
    const isPasswordCorrect=await user.isPasswordCorrect(currentPassword);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Current password is incorrect")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(
        new ApiResponse(200,{}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, {user: req.user}, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {email, fullname} = req.body;
    if(!(email || fullname)){
        throw new ApiError(400, "Email or fullname is required to update account details")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{email:email,
                fullname:fullname}
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, {user}, "Account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarPath = req.file?.path;
    if(!avatarPath){
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarPath);

    if(!avatar.url){
        throw new ApiError(500, "something went wrong while uploading avatar image")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{avatar: avatar.url}
        },
        {
            new: true
        }
    )
    return res.status(200).json(
        new ApiResponse(200, {user}, "Avatar updated successfully"))     
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImagePath = req.file?.path;
    if(!coverImagePath){
        throw new ApiError(400, "Cover image is required")
    }

    const coverImage = await uploadOnCloudinary(coverImagePath);

    if(!coverImage.url){
        throw new ApiError(500, "something went wrong while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{coverImage: coverImage.url}
        },
        {
            new: true
        }
    )
    return res.status(200).json(
        new ApiResponse(200, {user}, "Cover image updated successfully"))
})
//aggregation pipelines
const getUserChannelProfile = asyncHandler(async (req, res) => {

    const {username}=req.params;

    if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }      
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" }
            }
        }
    ])

    if(!channel.length){
        throw new ApiError(404, "Channel not found")
    }

    return res.status(200).json(
        new ApiResponse(200, {user: channel[0]}, "Channel profile fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user=await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistoryVideos",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, {watchHistory: user[0].watchHistoryVideos}, "Watch history fetched successfully")) 
})

export { registerUser,loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails , updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory};