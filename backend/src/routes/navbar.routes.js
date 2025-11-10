import { Router } from "express";
import { getNavbar, updateNavbar } from "../controllers/navbar.controller.js";
import { upload } from './../middleweres/Multer.middleware.js';

const router = Router()

router.route('/updatenavbar').put(
    upload.single("url"),
    updateNavbar)
router.route('/getnavbar').get(getNavbar)

export default router