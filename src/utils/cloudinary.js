import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (filePath) => {
    try {
        if(!filePath){
            return null
        }
        //upload file to cloudinary
        const response = await cloudinary.uploader.upload(filePath,{
            resource_type: "auto"
        })
        //file has been uploaded to cloudinary, now we can remove it from local storage
        // console.log('file uploaded to cloudinary successfully, now removing it from local storage',response.url)
        fs.unlinkSync(filePath) //remove the file from local storage
        return response;

    } catch (error) {
    console.error("Cloudinary upload error:", error); // 👈 IMPORTANT

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    return null;
}
}

export { uploadOnCloudinary };