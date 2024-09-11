//setting up server & configurations
import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'

const app = express()

//configuring cors
app.use(cors({
    // it means backend is origin se request accept kar raha he
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


//since backend ke ander kai gajah se data aa sakta he like url se, kuch log json me data bhej sakte he
//so, lets configure express server
app.use(express.json({limit: "16kb"})) //we are accepting json data of atmost 16kb
app.use(express.urlencoded({extended:true, limit:"16kb"}))

// static -> most of the times we need to store files, pdf etc in my server , so  public folder me wo sab store rakhte he jinhe koi bhi access karsata he as assets
app.use(express.static("public"))
app.use(cookieParser())
//cookieparser : our server needs to access users browser cookies 

export {app}