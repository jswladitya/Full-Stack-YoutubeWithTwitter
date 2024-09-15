import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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
    //1. get user details from frontend
    // yaha ham file handling nahi karrahe wo ham karenga directly routes me
    const { fullName, email, username, password } = req.body
    //form se ya direct json se data aa raha he to req.body ke ander data mil jayega
    //ham postman se email bhej rahe as a request server pe & use print krwa rah he
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
    // since we are using multer so multer bhi req.files ka access deta he
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
    console.log(email);

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
    // 1. user model ke ander ka refreshToken bhi reset krna padega
    // 2. remove cookies from server

    //taking use of auth middleware because we dont have user access
    await User.findByIdAndUpdate(
        // 1. user model ke ander ka refreshToken bhi reset krna padega
        req.user._id,
        {
            $set: {
                refreshToken: undefined 
                // this removes the field from document
            }
        },
        {
            new: true
            // return me jo value milega wo ne updated value milegi
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


export { registerUser, loginUser, logoutUser }

//testing controller through postman 