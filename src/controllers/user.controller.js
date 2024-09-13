import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


//by passing the userid , this method will automatically find the user based on userid & it will generate access & refresh token , refresh token will get saved to database
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //access token toh ham user ko dedete he & we save refresh token to aur database too , just to make sure baar baar password na puchna pade user se
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


//Register user
// const registerUser = asyncHandler()
const registerUser = asyncHandler( async(req, res)=>{
   // HOW TO REGISTER USER 
   // 1. get user details from frontend
   // 2. user ne details correct format me bheja he ya nahi --validation: by not empty
   // 3. check if user already exists : by username, email
   // 4. check for images , check for avatar
   // 5. if he to upload them to cloudinary, check avatar upload
   // 6. create user object - create entry in db
   // 7. remove password & refresh token field from response 
   // 8. check for user creation
   // 9. return response


   //lets begin
   //1. get user details from frontend
   const {fullName, email, username, password} = req.body 
   //form se ya direct json se data aa raha he to req.body ke ander data mil jayega
   //ham postman se email bhej rahe as a request server pe & use print krwa rah he
//    console.log("email :" , email);


    //2. validation
    if(
        // inme se koi bhi field ager trim hone ke baad bhi empty ayi he 
        [fullName, email, username, password].some((field)=> field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    //3. check for user exists or not
    const existedUser = await User.findOne({
        //it is like ye username ya email already exists karta he app dusra use karo
        //use $or parameter & jitni bhi cheeze check karni he un sabhi ko check karalo in the object
        $or : [{username}, {email}]
    })
    if (existedUser){
        throw new ApiError(409, "user with email or username already exists")
    }



    // 4. check for images , check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }



    // 5. if he to upload them to cloudinary, check avatar upload
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
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

    // 7 , 8
    //checking user successfully create hua he ya nahi
    const createdUser = await User.findById(user._id).select(
        // kya kya nahi chahiye
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while regestering the user")
    }


    // 9. return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User regestered Successfully")
    )
} )


//Login user
const loginUser = asyncHandler ( async (req, res) => {
    // 1. req.body se data le aao
    // 2. username or email check
    // 3. Find the user
    // 4. if user he to password check karwao
    // 5. if password check ho gya toh generate access & refresh token 
    // 6. send them to user in form of secure cookies

    // 1. req.body se data le aao
    const {email, username, password} = req.body
    console.log(email);

    // 2. username or email check
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }


    // 3. Find the user
    const user = await User.findOne({
        // i want to find user in a database based on username or email 
        $or: [{username}, {email}]
    })

    //if firbhi user nahi mila
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // 4. if user he to password check karwao
   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }


    // 5. if password exists then user exists so,  generate access & refresh token -> we made a method for that at the top because it gonna be used many times
   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    //6. send them to user in form of secure cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
} )


//Logout user
const logoutUser = asyncHandler


export {registerUser, loginUser}

//testing controller through postman 