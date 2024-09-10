import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

//2nd approach : connecting to database
const connectDB = async () => {
    try{
        //database connect hone ke bad jo bhi response he use hold kar rahe 
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        
    } catch (error){
        console.log("MONGODB CONNECTION ERROR",error);
        // throw error
        process.exit(1)
    }
}

export default connectDB