import { Router } from "express";
import { addnewProduct, deleteProduct, getproduct, updateProduct } from "../controllers/product.controller.js";
import { upload } from './../middleweres/Multer.middleware.js';

const router = Router()

router.route('/addnewproduct').post(
  upload.fields([
    { name: "viewImage", maxCount: 1 },
    { name: "hoverImage", maxCount: 1 }
  ])
  , addnewProduct)

router.route('/updateproduct/:id').put(
  upload.fields([
    { name: "viewImage", maxCount: 1 },
    { name: "hoverImage", maxCount: 1 }
  ]),
  updateProduct
)
router.route('/deleteproduct/:id').delete(deleteProduct)
router.route('/getproduct').get(getproduct)

export default router