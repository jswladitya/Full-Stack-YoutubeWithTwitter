//setting up server & configurations
import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'

const app = express()

//configuring cors
app.use(cors({
    // it means backend server is origin se request accept kar raha he
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


//since backend ke ander kai gajah se data aa sakta he like url se, kuch log json me data bhej sakte he

//so, lets configure express server
app.use(express.json({limit: "16kb"})) //we are accepting json data of atmost 16kb

app.use(express.urlencoded({extended:true, limit:"16kb"})) // accepting url data 

// static -> most of the times we need to store files, pdf etc in my server , so  public folder me wo sab store rakhte he jinhe koi bhi access karsata he as assets
app.use(express.static("public"))
app.use(cookieParser())
//cookieparser : our server needs to access users browser cookies & set them too, we keep secure cookies to users browser jise sirf server hi read & remove karsakta he


//import routes
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter) //'/users' pe koi bhi ayega to userRouter pe pass on kardenge and if waha pe '/register' hit hua to call hoga registerUser method
//http://localhost:8000/api/v1/users/register

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)



export {app}