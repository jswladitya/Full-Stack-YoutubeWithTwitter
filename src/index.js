//CONNECTING TO DATABASE
// require('dotenv').config({path: './env'}) 
//modify to work with import
// so , just modify script in a dev script in package.json
import dotenv from "dotenv"
import connectDB from "./db/index.js"; //from db
import {app} from './app.js'

//configure .env 
dotenv.config({
    path: './.env'
})
//as soon as in your app import and configure dotenv 


//since connectDB() is async method & so async method jab complete hota he toh technically promise bhi return karta he
connectDB()
// database to connect hogya but, hamare server ne us database ka use karte hue abhi listen karna shuru nhai kia tha
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is listening at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed !!!", err);

    })



















//2nd approach -> we write all the code in DB folder import it here & just execute it here only

//1st approach
/*
import express from "express"
const app = express()

//IIFE: ()()
(async ()=> {
    //lets connect to the database
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        //Databse is now connected but incase database cannot talk with our express app
        //so we can use event listeners , to listen error event
        app.on("error", (error) => {
            console.log("Error : Database failed to connect with server", error);
            throw error     
        })

        //now let say our app is now listening
        app.listen(process.env.PORT, ()=> {
            console.log(`App is listening on port ${process.env.PORT} `);
            
        })
    } catch (error){
        console.log("Error", error);
        throw error
    }
})()
*/
