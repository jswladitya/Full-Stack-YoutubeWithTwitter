import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

// router.route("/register").post(registerUser) //just register ke pehle middleware laga do
router.route("/register").post(
    // jaise hi user register kar lega usse avatar aur coverImage upload karwayenge using multer middleware
    upload.fields([
        {
            name : "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post( verifyJWT ,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router