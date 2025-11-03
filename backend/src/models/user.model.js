import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const userShcema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },


}, {
    timestamps: true
})

// hash password before saving user
userShcema.pre('save', async function (next) { // pre is a mongoose middleware that runs before saving the document "save" is the event name ita can be save,update,delete etc its a mongoose method
    if (!this.isModified('password')) return next() // this is for if only password is modified then only run isModified is used to check if the field is modified or not it is a mongoose method 
    this.password = await bcrypt.hash(this.password, 10) // 10 is the salt rounds 
    next()
})

// method to compare password
userShcema.methods.isPasswordCorrect = async function (password) { // here we are creating a method to compare password this is an instance method this we created by using methods and inject in userSchema
    return await bcrypt.compare(password, this.password)
}



export const User = mongoose.model('User', userShcema)