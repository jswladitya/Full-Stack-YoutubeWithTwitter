import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

// const userSchema = new mongoose.Schema({})
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true //to make this searchable in db
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
    },

    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    avatar: {
        type: String, // cloudinary url
        required: true,
    },

    coverImage: {
        type: String, // cloudinary url
    },

    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],

    password: {
        type: String,
        required: [true, 'Password is required']
    },

    refreshToken: {
        type: String
    }

}, { timestamps: true })


//ye pre middleware hook jaise hi data save ho rha hoga usse just pehle ye as a middleware chalega & password ko encrypt karega
userSchema.pre("save", async function (next) {
    // since middleware he toh next flag ka access toh hona hi chahiye, & ager kaam hogya he toh is flag ko call karna padta hi ki ab is flag ko age pass kardo

    if(!this.isModified("password")) return next(); //we need to encrypt password just once or if the user went to modify the password so, if password is not modified then do not encrypt it, just call the next middleware   

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//bycrypt even compare encrypted and userfriendly password of the same 
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


//working with jwt
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        // sabse pehle to me ise dunga payload ki kya kya data hoga us generated access token me
        {
            //payload ka naam ya key bol sakte he : ye database se aa rahi he
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema)
// this User model can directly communicate with db because it is made with mongoose 


//NOTE : installing bcrypt (helps to hash or encrypt your password)
//jsonwebtoken (like a bearer, jiske bhi pass ye token he mei use data bhej dunga) so, ye library ye tokens bana ke deti he
// refresh token hi database me store hote he access token database me store nahi hote