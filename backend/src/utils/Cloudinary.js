import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLODINARY_CLOUD_NAME,
    api_key: process.env.CLODINARY_API_KEY,
    api_secret: process.env.CLODINARY_KEY_SECRET
});

const uploadImagetoCloudinary = async (filePath) => {
    try {
        if (!filePath) return null
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto',
        })
        fs.unlinkSync(filePath) // remove file from local uploads folder for our server cleanup and fs is filesystem module it comes with nodejs by default unlinkSync is used to delete file synchronously means hona hi chiye ye
        //  console.log('after file uploded successfully',response.url);
        return response

    } catch (error) {
        fs.unlinkSync(filePath) // remove file from local uploads folder for our server cleanup and fs is filesystem module it comes with nodejs by default unlinkSync is used to delete file synchronously means hona hi chiye ye
        console.log('error while uploading file to cloudinary', error + 'clodinary');
        return null
    }
}

export { uploadImagetoCloudinary }