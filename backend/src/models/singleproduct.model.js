import mongoose, { Schema } from "mongoose";

const singleProductSchema = new Schema({

    category: {
        type: String
    },
    submenu: {
        type: String
    },
    productName:{
        type:String
    },
    title:{
        type: String,
    },
    title2:{
        type: String,
    },
    description:{
        type: String
    },
    description2:{
        type: String
    },
    bannerImage:{
        type: String
    },

    productDetails: [{
        title:{
            type: String
        },
        description:{
            type: String
        },
        productimage:{
            type: String
        },
    }]


}, { timestamps: true })

export const SingleProduct = mongoose.model('SingleProduct', singleProductSchema)