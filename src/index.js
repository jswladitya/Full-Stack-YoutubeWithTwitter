//CONNECTING TO DATABASE
// require('dotenv').config({path: './env'}) //resolve it with import
import dotenv from "dotenv"
import connectDB from "./db/index.js"; //from db 

//configure .env 
dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , ()=>{
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
