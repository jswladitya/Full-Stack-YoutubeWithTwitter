import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


//by passing the userid , this method will automatically find the user based on userid & it will generate access & refresh token , refresh token will get saved to database
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // since yaha user ek object he toh hamne bas ek naya entry ie refreshToken add kardia he
        user.refreshToken = refreshToken

        // user ko DB me save bhi karana hota he
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


//Register user
// const registerUser = asyncHandler()
const registerUser = asyncHandler(async (req, res) => {
    // HOW TO REGISTER USER 
    // 1. get user details from frontend or postman
    // 2. user ne details correct format me bheja he ya nahi --validation: by not empty
    // 3. check if user already exists : by username, email -taki baad me msg show kar paye ki aapka account toh already exist karta he
    // 4. check for images , check for avatar
    // 5. if he to upload them to cloudinary, check avatar upload on cloudinary
    // 6. create user object - create entry in db
    // 7. remove password & refresh token field from response 
    // 8. check for user creation
    // 9. return response


    //lets begin
    //1. got these user details from frontend
    // yaha ham file handling nahi karrahe wo ham karenga directly routes me
    const { fullName, email, username, password } = req.body
    //form se ya direct json se data aa raha he to req.body ke ander data mil jayega
    //    console.log("email :" , email);


    //2. validation
    if (
        // inme se koi bhi field ager trim hone ke baad bhi empty ayi he 
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    //3. check for user exists or not
    const existedUser = await User.findOne({
        //it is like ye username ya email already exists karta he aap dusra use karo
        //use $or parameter & jitni bhi cheeze check karni he un sabhi ko check karalo in the object
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists")
    }


    // 4. check for images , check for avatar
    // since we are using multer so multer req.files ka access deta he
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // avatar ka path jo multer ne upload kara he server pe wo hame mil jayega kyuki hamne mention kia he multer ke code me

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }



    // 5. if he to upload them to cloudinary, check avatar upload
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }



    // 6. create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, password,
        username: username.toLowerCase()
    })

    // 7. remove password & refresh token field from response 
    //NOTE: jo apne new user ki entry create kari he n db me MnogoDB har ek entry ke sath _id naam ka field add kar deta he  
    const createdUser = await User.findById(user._id).select(
        // user ka saara data chahiye but password aur refresh token nahi chahiye
        "-password -refreshToken"
    )

    // 8. checking user successfully create hua he ya nahi
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while regestering the user")
    }


    // 9. return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User regestered Successfully")
    )
})


//Login user
const loginUser = asyncHandler(async (req, res) => {
    // 1. req.body se data le aao
    // 2. username or email check
    // 3. Find the user
    // 4. if user he to password check karwao
    // 5. if password check ho gya toh generate access & refresh token 
    // 6. send them to user in form of secure cookies

    // 1. req.body se data le aao
    const { email, username, password } = req.body
    // console.log(email);

    // 2. username or email check
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }


    // 3. Find the user
    const user = await User.findOne({
        // i want to find user in a database based on username or email 
        $or: [{ username }, { email }]
    })

    //if firbhi user nahi mila
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // 4. user he to password check karwao
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }


    // 5. if password exists then generate access & refresh token 
    // since hame is method se dono tokens milenge so, hamne destructure karke le lia
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    //6. send them to user in form of secure cookies
    const options = {
        // in options ka matlab ye cookies sirf server se modifyable hoti he
        httpOnly: true,
        secure: true
    }

    // cookie(key, value, other 3rd parameter)
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    // user: loggedInUser,
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
})



//Logout user
const logoutUser = asyncHandler(async (req, res) => {
    //taking use of auth middleware because we dont have user access so we did is , aap login the ,aapka access token tha, mene database me query mari ek req.user add kar dia 
    await User.findByIdAndUpdate(
        // 1. remove refreshToken 
        req.user._id,
        {
            $set: {
                refreshToken: undefined
                // this removes the field from document
            }
        },
        {
            new: true
            // return me jo value milega wo new updated value hogi
        }
    )

    // 2. remove cookies from server
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})


// jab user login karta he toh us point per ek naya access token generate kia jata he us user ke lie wo ho pata he ager user ke pass ya uske browser me already refreshToken ho taki user ko baar baar apna username ya password na dena pade login karwane ke lie
//coz yaha pe frontend wala endpoint pe ek aur req bhej ke access token ko refresh karwa leta he
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        //hamne yaha new access & refresh token generate karwaya & refreshToken ko DB me save karwa lia
        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // const { oldPassword, newPassword, confPassword } = req.body

    // if(!(newPassword === confPassword)){
    //     throw new ApiError(400, "Try entering the same password in both fields")
    // }

    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    //user object ke ander password wali field ko modify kar rahe he
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            //mongoDB operator
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true } //update hone ke baad wali information return hoti he

    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
});
//Till now we have worked with text based data ie..Add, delete, update

//now, we are working with files based data
const updateUserAvatar = asyncHandler(async (req, res) => {
    //here we are taking just one file so use req.file
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading an avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

     //TODO: delete old image from database - assignment

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
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
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    //TODO: delete old image from database - assignment
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // assuming mera channel he & aise milega mere subscribers 
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            // assuming mera channel he & aise milega mene kitne channels ko subscribe kia he
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            // user field me 2 fields aur add krdia
            $addFields: {
                // yaha we are counting the documents
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },

                // button ko subscribed dikhana he ya subscribe dikhana he wo logic 
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
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
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
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

//testing controller through postman 