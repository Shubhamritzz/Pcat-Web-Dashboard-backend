
import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    viewImage: {
        type: String
    },
    hoverImage: {
        type: String
    },
    url: {
        type: String
    },
    category: {
        type: String

    },
    submenu: {
        type: String

    }


}, { timestamps: true })

export const Product = mongoose.model('Product', productSchema)