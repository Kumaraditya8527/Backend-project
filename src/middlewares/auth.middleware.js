import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    // verify JWT token middleware logic will be here
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized, token is missing")
        }
    
        const decodedToken = jwt.verify(token, process.env.Access_TOKEN_SECRET);//verify the token using the secret key defined in the environment variables, which will return the decoded token if the verification is successful or throw an error if it fails
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "invalid token, user not found")
        }
    
        req.user=user;//attach the user object to the request object, which can be accessed in subsequent middleware functions or route handlers to perform authorization checks or access user-specific data
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token")
    }
}); 