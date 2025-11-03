import { Navbar } from "../models/navbar.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asyncHandler.js";
import { uploadImagetoCloudinary } from "../utils/Cloudinary.js";


const updateNavbar = asynchandler(async (req, res) => {
    try {
        const data = req.body
        // console.log(data);
        
        if (!data) { throw new ApiError(400, 'fields required') }

        const localPathoflogo = req.file?.path
        console.log(localPathoflogo,'localpath of img');
        

        if (!localPathoflogo && !data.logo.url) { throw new ApiError(400, 'image is required') }

        let logoData
        if (localPathoflogo) {
            const uploadlogoonCloud = await uploadImagetoCloudinary(localPathoflogo)
            console.log(uploadlogoonCloud.url,'cloudinary url');
            
            if (!uploadlogoonCloud?.url) throw new ApiError(400, 'image is reqired')

            logoData = {
                url: uploadlogoonCloud?.url,
                altText: data.logo.altText
            }
        }
        console.log(logoData,'logoData');
        

        const updatedData={
            ...data,
            ...(logoData ? {logo:logoData}:{})

        }
        // console.log(updatedData,'updateddata');
        



        const navbar = await Navbar.findOneAndUpdate({}, updatedData, {
            new: true,
            upsert: true
        })

        return res.
            status(200)
            .json(
                new ApiResponse(200, navbar, 'updated Navbar')
            )
    } catch (error) {
        // console.log(error,'error while updating NavBar');
        throw new ApiError(400, error, 'error while updating NavBar')

    }
})

const getNavbar = asynchandler(async (req, res) => {
    try {
        const navbar = await Navbar.findOne()
        return res.
            status(200)
            .json(
                new ApiResponse(200, navbar, 'data is fetched successfully')
            )
    } catch (error) {
        // console.log(error,'error while fetch data from db in backend to show getNavbar');
        throw new ApiError(400, error, 'error while fetch data from db in backend to show getNavbar')

    }
})

export { updateNavbar, getNavbar }