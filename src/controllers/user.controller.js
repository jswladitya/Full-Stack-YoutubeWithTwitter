import { asyncHandler } from "../utils/asyncHandler.js";

// const registerUser = asyncHandler()
const registerUser = asyncHandler( async(req, res)=>{
    // we send json response with a status code 200 
    res.status(200).json({
        message: "chai aur code"
    })
} )


export {registerUser}