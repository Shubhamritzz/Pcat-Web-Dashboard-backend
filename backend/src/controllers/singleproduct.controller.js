import { Navbar } from "../models/navbar.model.js";
import { Product } from "../models/products.model.js";
import { SingleProduct } from "../models/singleproduct.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asyncHandler.js";
import { uploadImagetoCloudinary } from "../utils/Cloudinary.js";

export const addSingleProduct = asynchandler(async (req, res) => {
    try {
        const {
            category,
            submenu,
            productName,
            title,
            title2,
            description,
            description2
        } = req.body;


        //  CHECK CATEGORY & SUBMENU IN NAVBAR

        const navbar = await Navbar.findOne({ "menuItems.title": category });
        if (!navbar) throw new ApiError(400, "Category not found");

        const categoryObj = navbar.menuItems.find(item => item.title === category);
        if (!categoryObj) throw new ApiError(400, "Category not found");

        const submenuObj = categoryObj.subItems.find(sub => sub.title === submenu);
        if (!submenuObj)
            throw new ApiError(404, "Submenu not found in this category");


        // CHECK PRODUCT EXISTS IN PRODUCT MODEL (MAIN PAGE)

        const existingProduct = await Product.findOne({
            category,
            submenu,
            title: productName   // matching your productSchema
        });

        if (!existingProduct) {
            throw new ApiError(404, "Product not found in main product list");
        }

        // Continue even if exists (this is required)
        console.log("Product exists in main product list. Adding single product page.");


        // UPLOAD BANNER IMAGE

        const bannerImageFile = req.files.find(f => f.fieldname === "bannerImage");
        let bannerUpload;
        if (bannerImageFile) {
            bannerUpload = await uploadImagetoCloudinary(bannerImageFile.path);
        }


        //  BUILD productDetails[]

        let productDetails = [];

        const detailIndexes = new Set();
        Object.keys(req.body).forEach(key => {
            const match = key.match(/productDetails\[(\d+)\]/);
            if (match) detailIndexes.add(match[1]);
        });

        for (let index of detailIndexes) {
            const detailTitle = req.body[`productDetails[${index}].title`] || "";
            const detailDesc = req.body[`productDetails[${index}].description`] || "";

            const file = req.files.find(
                f => f.fieldname === `productDetails[${index}].productimage`
            );

            let uploadedImage = null;
            if (file) {
                uploadedImage = await uploadImagetoCloudinary(file.path);
            }

            productDetails.push({
                title: detailTitle,
                description: detailDesc,
                productimage: uploadedImage?.url || null
            });
        }


        //  CREATE SingleProduct ENTRY

        const newSingleProduct = new SingleProduct({
            category,
            submenu,
            productName,
            title,
            title2,
            description,
            description2,
            bannerImage: bannerUpload?.url,
            productDetails
        });

        await newSingleProduct.save();

        res.status(201).json(
            new ApiResponse(200, newSingleProduct, "Single Product created successfully")
        );
    } catch (error) {
        console.error("Create Single Product Error:", error);
        throw new ApiError(500, error.message);
    }
});


export const getAllSingleProducts = asynchandler(async (req, res) => {
    try {
        const products = await SingleProduct.find();
        res.status(200).json(
            new ApiResponse(200, products, "Single Products fetched successfully")
        );

    } catch (error) {
        console.error("getting Single Product Error:", error);
        throw new ApiError(500, error.message);
    }
})

export const updateSingleProduct = asynchandler(async (req, res) => {
    try {
        const { id } = req.params;

        const {
            category,
            submenu,
            productName,
            title,
            title2,
            description,
            description2
        } = req.body;

        // FIND THE SINGLE PRODUCT
        const singleProduct = await SingleProduct.findById(id);
        if (!singleProduct) throw new ApiError(404, "Single Product not found");

        // BUILD UPDATE OBJECT
        const updateData = {
            category,
            submenu,
            productName,
            title,
            title2,
            description,
            description2
        };

        
        // UPDATE BANNER IMAGE IF PROVIDED
        
        const bannerImageFile = req.files.find(f => f.fieldname === "bannerImage");

        if (bannerImageFile) {
            const uploadBanner = await uploadImagetoCloudinary(bannerImageFile.path);
            if (!uploadBanner) throw new ApiError(400, "Banner upload failed");
            updateData.bannerImage = uploadBanner.url;
        }

        
        // HANDLE productDetails[] - UPDATE / NEW / REMOVE LOGIC
        
        let updatedDetails = [];

        const detailIndexes = new Set();
        Object.keys(req.body).forEach((key) => {
            const match = key.match(/productDetails\[(\d+)\]/);
            if (match) detailIndexes.add(match[1]);
        });

        for (let index of detailIndexes) {
            const detailTitle = req.body[`productDetails[${index}].title`] || "";
            const detailDesc = req.body[`productDetails[${index}].description`] || "";

            const file = req.files.find(
                f => f.fieldname === `productDetails[${index}].productimage`
            );

            let uploadedImage = null;

            if (file) {
                const uploadImg = await uploadImagetoCloudinary(file.path);
                uploadedImage = uploadImg?.url;
            }

            updatedDetails.push({
                title: detailTitle,
                description: detailDesc,
                productimage: uploadedImage || singleProduct.productDetails?.[index]?.productimage || null
            });
        }

        updateData.productDetails = updatedDetails;

        
        // SAVE UPDATED SINGLE PRODUCT
        
        const updatedSingleProduct = await SingleProduct.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedSingleProduct)
            throw new ApiError(404, "Single Product not found");

        return res.status(200).json(
            new ApiResponse(200, updatedSingleProduct, "Single Product updated successfully")
        );

    } catch (error) {
        console.error("Update Single Product Error:", error);
        throw new ApiError(400, error.message);
    }
});


export const deleteSingleProduct = asynchandler(async (req, res) => {
     try {
        const { id } = req.params

        const product = await SingleProduct.findById(id)
        if (!product) throw new ApiError(400, 'Product not found')

        await SingleProduct.findByIdAndDelete(id)

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Product deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message)
    }
})
