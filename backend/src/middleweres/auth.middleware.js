import jwt  from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// for user authentication
export const verifyJWT = asynchandler(async (req, res, next) => {

    try {
        // access the token from the cookies because we use cookie parser as a middleware in app.js and we give the token to cookie in login
        const token = req.cookies?.accessToken || // accessing the data from req
            req.header('Authorization')?.replace('Bearer ', '') // if we get request from mobile so we get acces like this  
    
        if (!token) throw new ApiError(401, ' Unauthorized token')
    
        // we wil verify the token and in res we will get decoded data of user
        const verifyed = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // with help of verifyed we got id now we check in our DB
        const user = await User.findById(verifyed?._id).select('-password -refreshToken')
        if (!user) throw new ApiError(402, ' Invalid accsess token')
        
        req.user=user // created new object in req 
        next()
    } catch (error) {
        throw new ApiError(403, error?.message ||' invalid token')
    }


})

