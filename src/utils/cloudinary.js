//file hamare server pe toh aa chucki he ab ham use cloudinary pe uplaod karwa rahe he
// and ager server pe file upload ho gayi he toh us file ko hamare server pe rakhne ka koi point nahi he use remove karana padega
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
// fs : to manage file system


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


//ek method bana lete he usme aap mujhe us localfile ka path doge , wo method us file ko upload kardega & ager successfully file upload ho gaya to file ko unlink kar dunga mere server pe se
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
            // it can be image, raw, video : "auto" detect by yourself
        })
        // file has been uploaded successfully
        //console.log("file is uploaded on cloudinary ", response.url); //upload hone ke baad jo public url he wo milega

        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}