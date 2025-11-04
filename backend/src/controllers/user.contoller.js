import { asynchandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asynchandler(async (req, res) => {

    // getting data from frontend with req.body
    const { fullName, userName, email, password } = req.body
    // console.log(req.body);


    // validation of data It returns a boolean (true or false) test if any element matches condition ,
    // map returns a new array with the results
    if ([fullName, userName, email, password].some((filed) => filed?.trim() === "")) {
        throw new ApiError(400, "all fields are required")
    }

    //Return one where either the userName matches OR the email matches.
    const existedUser = await User.findOne({ $or: [{ userName }, { email }] })
    // const existedUser=User.findOne({userName} && {email}) wil not work
    // console.log(existedUser);


    if (existedUser) {
        throw new ApiError(409, "user already exists")
    }

    
    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password,
    })

    const userCreated = await User.findById(user._id).select('-password -refreshToken')

    if (!userCreated) throw new ApiError(500, ' something wrong while registering')

    return res.status(201).json(
        new ApiResponse(200, userCreated, 'successfully registerd')
    )


})


const loginUser = asynchandler(async (req, res) => {


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


export { registerUser, loginUser, logoutUser, changePassword, getCurrentUser,updateUserDetails}