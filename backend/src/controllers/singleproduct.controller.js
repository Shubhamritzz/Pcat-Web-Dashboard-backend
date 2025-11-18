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
            description,
            Specifications,
            KeyFeatures,
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
            title: productName
        });

        if (!existingProduct) {
            throw new ApiError(404, "Product not found in main product list");
        }

        // Continue even if exists (this is required)
        console.log("Product exists in main product list. Adding single product page.");


        // UPLOAD BANNER IMAGE
        let uploadedImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const upload = await uploadImagetoCloudinary(file.path);
                uploadedImages.push(upload.secure_url);
            }
        }


        let specArray = [];

        Object.keys(req.body).forEach(key => {
            if (key.startsWith("Specifications")) {
                const match = key.match(/Specifications\[(\d+)\]\.(\w+)/);
                if (match) {
                    const index = match[1];
                    const field = match[2];

                    specArray[index] = specArray[index] || {};
                    specArray[index][field] = req.body[key];
                }
            }
        });


        //  CREATE SingleProduct ENTRY

        const newSingleProduct = new SingleProduct({
            category,
            submenu,
            productName,
            description,
            KeyFeatures,
            Specifications: specArray,
            Images: uploadedImages,
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




export const updateSingleProduct = asynchandler(async (req, res) => {
    try {
        const { id } = req.params;

        const {
            category,
            submenu,
            productName,
            description,
        } = req.body;

        // FIND THE SINGLE PRODUCT
        const singleProduct = await SingleProduct.findById(id);
        if (!singleProduct) throw new ApiError(404, "Single Product not found");

        // BUILD UPDATE OBJECT
        const updateData = {
            category,
            submenu,
            productName,
            description,

        };


        // UPDATE IMAGE IF PROVIDED

        if (req.files && req.files.length > 0) {
            const uploadedImages = [];

            for (const file of req.files) {
                const upload = await uploadImagetoCloudinary(file.path);
                uploadedImages.push(upload.secure_url);
            }

            updateData.Images = uploadedImages;
        }


        // HANDLE KeyFeatures
         if (req.body.KeyFeatures) {
            let features = req.body.KeyFeatures;

            // If only 1 element comes as string → convert to array
            if (typeof features === "string") {
                features = [features];
            }

            updateData.KeyFeatures = features;
        }

        // HANDLE Specifications
        let specArray = [];
        const specIndexes = new Set();

        Object.keys(req.body).forEach(key => {
            const match = key.match(/Specifications\[(\d+)\]\.(\w+)/);
            if (match) specIndexes.add(match[1]);
        });

        for (let index of specIndexes) {
            const title = req.body[`Specifications[${index}].specTitle`] || "";
            const desc = req.body[`Specifications[${index}].specDesc`] || "";

            specArray[index] = {
                specTitle: title,
                specDesc: desc
            };
        }

        if (specArray.length > 0) {
            updateData.Specifications = specArray;
        }


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
