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
    description:{
        type: String
    },
    Images:[{
        type: String
    }],
    Specifications:[{
        specTitle: {type: String},
        specDesc: {type: String}
    }],

    KeyFeatures: [{type:String}]


}, { timestamps: true })

export const SingleProduct = mongoose.model('SingleProduct', singleProductSchema)