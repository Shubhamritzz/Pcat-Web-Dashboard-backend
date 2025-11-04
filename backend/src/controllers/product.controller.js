
import { Navbar } from "../models/navbar.model.js";
import { Product } from "../models/products.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asyncHandler.js";
import { uploadImagetoCloudinary } from "../utils/Cloudinary.js";


export const addnewProduct = asynchandler(async (req, res) => {
    try {
        const { title, description, url, categoryTitle, submenuTitle } = req.body;

        // from multer 
        const viewImagePath = req.files?.viewImage?.[0]?.path;
        const hoverImagePath = req.files?.hoverImage?.[0]?.path;


        if (!viewImagePath || !hoverImagePath) throw new ApiError(400, 'Both images are required')

        // upload on cloudinary
        const viewImageUpload = await uploadImagetoCloudinary(viewImagePath);
        const hoverImageUpload = await uploadImagetoCloudinary(hoverImagePath);

        //  Find navbar that contains the category by its title
        const navbar = await Navbar.findOne({ "menuItems.title": categoryTitle });
        if (!navbar) throw new ApiError(400, 'Category not found')


        // Extract the specific category (menu item)
        const category = navbar.menuItems.find(item => item.title === categoryTitle);
        if (!category) throw new ApiError(400, 'Category not found')

        // Find submenu within that category
        const submenu = category.subItems.find(sub => sub.title === submenuTitle);
        if (!submenu) throw new ApiError(404, 'Submenu not found in this category')

        const existingProduct = await Product.findOne({ title });
        if (existingProduct) throw new ApiError(400, 'Product name is already there')

        // Create new product
        const product = new Product({
            title,
            description,
            viewImage: viewImageUpload.url,
            hoverImage: hoverImageUpload.url,
            url,
            category: category.title,
            submenu: submenu.title
        });

        await product.save();

        res.status(201).json(
            new ApiResponse(200, product, "Product created successfully")
        );
    } catch (error) {
        console.error("Error creating product:", error);
        throw new ApiError(500, error.message)
    }
});

export const updateProduct = asynchandler(async (req, res) => {
    try {

        const { title, description, url, categoryTitle, submenuTitle } = req.body;
        const { id } = req.params

        const viewImagePath = req.files?.viewImage?.[0]?.path
        const hoverImagePath = req.files?.hoverImage?.[0]?.path

        const updateData = {
            title,
            description,
            url,
            categoryTitle,
            submenuTitle
        }

        if (viewImagePath) {
            const uploadviewImage = await uploadImagetoCloudinary(viewImagePath)
            if (!uploadviewImage) throw new ApiError(400, 'error on uplaoding img on cloud')
            updateData.viewImage = uploadviewImage.url
        }

        if (hoverImagePath) {
            const uploadhoverImage = await uploadImagetoCloudinary(hoverImagePath)
            if (!uploadhoverImage) throw new ApiError(400, 'error on uplaoding img on cloud')
            updateData.hoverImage = uploadhoverImage.url
        }

        const updateProduct = await Product.findByIdAndUpdate(id,
            { $set: updateData },
            { new: true }
        )

        if (!updateProduct) throw new ApiError(404, 'Product not found')

        return res
            .status(200)
            .json(
                new ApiResponse(200, updateData, 'product is updated ')
            )

    } catch (error) {
        throw new ApiError(400, error.message)
    }


})

export const deleteProduct = asynchandler(async (req, res) => {

    try {
        const { id } = req.params

        const product = await Product.findById(id)
        if (!product) throw new ApiError(400, 'Product not found')

        await Product.findByIdAndDelete(id)

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Product deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message)
    }

})

export const getproduct = asynchandler(async (req, res) => {
    try {
        const data = await Product.findOne()
        if(!data) new ApiResponse (400, 'product not available')
        return res.
            status(200)
            .json(
                new ApiResponse(200, data, 'data is fetched successfully')
            )
    } catch (error) {
        throw new ApiError(400, error.message)
    }
})