import { Router } from "express"
import { registerUser,loginUser, logoutUser, generatenewToken, changePassword } from "../controllers/user.contoller.js";
import { upload } from "../middleweres/Multer.middleware.js";
import { verifyJWT } from "../middleweres/auth.middleware.js";


const router = Router()

router.route("/register").post( 
    registerUser)

router.route("/login").post(loginUser)




export default router