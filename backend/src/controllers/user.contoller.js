import { asynchandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadImagetoCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asynchandler(async (req, res) => {

    // getting data from frontend with req.body
    const { fullName, userName, email, password } = req.body
    // console.log(req.body);


    // validation of data It returns a boolean (true or false) test if any element matches condition ,
    // map returns a new array with the results
    if ([fullName, userName, email, password].some((filed) => filed?.trim() === "")) {
        throw new ApiError(400, "all fields are required")
    }

    // check if user already exists :username,email 
    //$or (MongoDB / Mongoose operator) ,|| (JavaScript logical OR operator)
    //Look at documents in the User collection.
    //Return one where either the userName matches OR the email matches.
    const existedUser = await User.findOne({ $or: [{ userName }, { email }] })
    // const existedUser=User.findOne({userName} && {email}) wil not work
    // console.log(existedUser);


    if (existedUser) {
        throw new ApiError(409, "user already exists")
    }

    // take cover imag and avtar upload on cloudinary 
    // here we use multer as a middleware to upload a file middleware here add more filds in req like here we have req.files
    // const avatarlocalpath = req.files?.avatar[0]?.path // this is not in cloud this is now in our local we say to multer to save the file in our public avatar is name of our file to take it written in upload files in in user.router
    // console.log(avatarlocalpath,'path');


    // here cover image is optional that why this code
    // let coverImagelocalpath
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) { //both working 1 for refrence
        // coverImagelocalpath = req.files?.coverImage[0]?.path
    // }

    // const coverImagelocalpath2 = req.files?.coverImage?.[0]?.path ?? undefined // both working 2

    // normal check if not then throw error
    // if (!avatarlocalpath) {
    //     throw new ApiError(400, 'avatar img required')
    // }
    // console.log(avatarImg,coverImage);

    // upload on cloudinary
    // const avatarImg = await uploadImagetoCloudinary(avatarlocalpath)
    // const coverImage = await uploadImagetoCloudinary(coverImagelocalpath)

    // await uploadImagetoCloudinary(coverImagelocalpath)
    // console.log('avatar img',avatarImg);

    // if (!avatarImg) throw new ApiError(400, 'avatarImg required')

    // created object and send to DB
    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password,
        // avatar: avatarImg.url,
        // coverImage: coverImage?.url || '',
    })

    // check user is created in db and checking data from DB then we take response in that we dont want to send this pass and token we can directly undefine in user but from DB is better in select means all select in parameter we have to which we dont want
    const userCreated = await User.findById(user._id).select('-password -refreshToken')

    if (!userCreated) throw new ApiError(500, ' something wrong while registering')

    //returning the response we have already created a response class for statndadized response we can only send one response per request
    return res.status(201).json(
        new ApiResponse(200, userCreated, 'successfully registerd')
    )


    // steps to take register a user
    //1. get user data from frontend
    //2. validation of data
    //3. check if user already exists :username,email
    //4. take cover imag and avtar upload on cloudinary
    //5. it give a url take it
    //6.create user object -> data send to db
    //7.check user is created or not
    //8.send data to frontend to show dont give then refresh token and password
})

const generateAccessRefressToken = async (userID) => {

    //accessing the user from User
    const user = await User.findById(userID)

    // console.log('user for token',user);

    // holding both in veriable
    const refreshToken = user.generateRefressToken()
    const accessToken = user.generateAccessToken()

    // now adding reffresh Token in DB
    user.refreshToken = refreshToken
    // now saving in db without validation because we check the validation before
    await user.save({ validateBeforeSave: false })

    // now return both
    return { refreshToken, accessToken }


}

const loginUser = asynchandler(async (req, res) => {
    // steps for user login
    //1. take data from user req.body
    //2.checking email and username for validation
    //3.if validate find the user 
    //4.user got then check password
    //5. password match 


    const { email, password } = req.body

    if (! email) {
        throw new ApiError(400, ' email is required')
    }

    const user = await User.findOne({ email })

    if (!user) throw new ApiError(404, 'user not exist')

    // validating the password by using bycript we made method in usermodel
    const userValidate = await user.isPasswordCorrect(password)

    if (!userValidate) throw new ApiError(402, " password is wrong")


    // now we have to updaate our user because here dont have referesh token because generateAccessRefressTokem we callafter a letter we can call user but it make bd request so we update it and we dont want to send password and refresh token
    const logedInUser = await User.findById(user._id).select('-password -refreshToken')


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    user: logedInUser
                },
                'user Logedin seccessfull'
            )
        )
})

const logoutUser = asynchandler(async (req, res) => {
    // here we didnt get user data we in this send form to user to fill it then we logout so we get a data fron middleware auth.middleware.js and we use for authenticaton and get refresh and access token


    // deleting refresh token from db
    await User.findByIdAndUpdate(
        req.user?._id, // here we give id to udate  then it take object
        {
            $set: { refreshToken: undefined }  // this DB Operater for set data or update
        },
        {
            new: true // this is for after that we got new data not previous token ew got undefine
        }
    )

    //now deleting access and refresh token from cookie
    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(400)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, 'user loged out'))



})

const generatenewToken = asynchandler(async (req, res) => {
    // we generate new token for login user dont do login repetatly after access token expire and then frontend hit the endpoint for new token that wirrten in route

    // in this we take a token from cookie of user
    const incommingtoken = req.cookies?.refreshToken || req.body?.refreshToken
    if (!incommingtoken) throw new ApiError(400, 'refresh token is invalid')

    try {
        // verift the token and then decoded data of user in return of user
        const decoded = jwt.verify(incommingtoken, process.env.REFRESH_TOKEN_SECRET)

        //find the user in DB
        const user = await User.findById(decoded._id)
        if (!user) throw new ApiError(400, 'user not found')

        // if not match both user token of bd and incommingdata   
        if (incommingtoken !== user) throw new ApiError(400, 'refresh token is expired')

        const option = {
            httpOnly: true,
            secure: true
        }

        //if match then genrate new token from above written function and send response in cookie 
        const { refreshToken, accessToken } = await generateAccessRefressToken(user._id)
        return res
            .status(200)
            .cookie('refreshToken', refreshToken, option)
            .cookie('accessToken', accessToken, option) // and here i think we should save refeshtoken in db also for next time genrating token
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    'genrated new tokens'
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || 'unauthorized access')
    }


})

const changePassword = asynchandler(async (req, res) => {
    // password is taken 
    const { oldPassword, newPassword } = req.body

    // check password is there or not
    if (!oldPassword || !newPassword) throw new ApiError(400, 'all fields are required')

    // now finding user detail from DB user we get data of user
    const user = await User.findById(req.user._id)

    // check password is correct or not user.isPasswordCorrect object is written in user.model it return boolean
    const isPasswordcorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordcorrect) throw new ApiError(400, 'password is incorrect')

    // now the password is correct we set new password 
    user.password = newPassword

    //here we save the password in DB
    await user.save({ validateBeforeSave: false })

    //sending response after saving the data
    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'password change'))
})

const getCurrentUser = asynchandler(async (req, res) => {
    if (!req.user) throw new ApiError(404, 'user not found')
    console.log(req.user);
    return res
        .status(200)
        .json(200, req.user, `Current user is ${req.user.userName}`)
})

const updateUserDetails= asynchandler (async (req,res)=>{
    const {userName,fullName}=req.body

    if(!userName || !fullName) throw new ApiError(400,'all fields are required')

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{ //we only what one to change not whole object so we use set
                userName,
                fullName
            }
        },
        {new:true}
    ).select('-password -refreshToken')

    return res
    .status(200)
    .json(
        200,user,"user is updated"
    )
})

const updateAvatarImg= asynchandler(async(req,res)=>{
    const avatarlocalpath = req.file?.path

    if(!avatarlocalpath) throw new ApiError(400,'avatar img is required')
    
    const avatar = uploadImagetoCloudinary(avatarlocalpath)

    if(!avatar) throw new ApiError(400,'error on img uploading of avatar')
    
    await User.findByIdAndUpdate(req.user?._id,

        {
            $set:{
                avatar:avatar?.url
            }
        },
        {new:true}
    ).select('-password -refreshToken')

    return res
    .status(200)
    .json(
        200,{},'Avatar is updated'
    )
    
    
})

const updateCoverImg= asynchandler(async(req,res)=>{
    const coverImagelocalpath = req.file?.path

    if(!coverImagelocalpath) throw new ApiError(400,'avatar img is required')
    
    const coverImage = uploadImagetoCloudinary(coverImagelocalpath)

    if(!coverImage) throw new ApiError(400,'error on img uploading of avatar')
    
    await User.findByIdAndUpdate(req.user?._id,

        {
            $set:{
                coverImage:coverImage?.url
            }
        },
        {new:true}
    ).select('-password -refreshToken')

    return res
    .status(200)
    .json(
        200,{},'Avatar is updated'
    )
    
    
})

export { registerUser, loginUser, logoutUser, generatenewToken, changePassword, getCurrentUser,updateUserDetails,updateAvatarImg,updateCoverImg}