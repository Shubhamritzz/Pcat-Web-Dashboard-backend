import { Router } from "express";
import { upload } from "../middleweres/Multer.middleware.js";
import { addSingleProduct, deleteSingleProduct, getAllSingleProducts, updateSingleProduct } from './../controllers/singleproduct.controller.js';

const router = Router()

router.route("/addsingleproduct").post(
    upload.any(),
    addSingleProduct
);

router.route("/getsingleproducts").get(getAllSingleProducts);
router.route("/deletesingleproduct/:id").delete(deleteSingleProduct);
router.route("/updatesingleproduct/:id").put(
    upload.any(),
    updateSingleProduct
);

export default router