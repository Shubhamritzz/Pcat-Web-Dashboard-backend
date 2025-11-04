import mongoose, { Schema } from 'mongoose'

const submenuSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    }
})


const menuSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
    },
    subItems: [submenuSchema],
    isVisible: {
        type: Boolean,
        default: false
    }
})

const navbarSchema = new Schema({
    logo: {
        url: {
            type: String,
            required: true
        },
        altText: {
            type: String,
            required: true
        }
    },
    companyDetail: {
        name: {
            type: String,
            required: true
        },
        tagline: {
            type: String,

        },
        foundyear: { type: Number }

    },
    menuItems: [menuSchema]
}, { timestamps: true })


export const Navbar = mongoose.model('Navbar', navbarSchema)