import { asyncHandler } from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    // verify JWT token middleware logic will be here
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized, token is missing")
        }
    
        const decodedToken = jwt.verify(token, process.env.Access_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "invalid token, user not found")
        }
    
        req.user=user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token")
    }
}); 