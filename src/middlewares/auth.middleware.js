//it will just varify ki user he ya nahi he
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        // ya to cookies me se token lelo ya authorization se lelo
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {  
            // Discussion about Frontend
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
        // next() -> verifyJWT run ho chuka he ab next method run karo eg.., logout 
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})