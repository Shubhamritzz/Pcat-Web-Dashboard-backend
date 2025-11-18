import { Router } from "express";
import { upload } from "../middleweres/Multer.middleware.js";
import { addSingleProduct, deleteSingleProduct, getAllSingleProducts, updateSingleProduct } from './../controllers/singleproduct.controller.js';

const router = Router()

router.route("/addsingleproduct").post(
    upload.array("Images", 10),
    addSingleProduct
);

router.route("/getsingleproducts").get(getAllSingleProducts);
router.route("/deletesingleproduct/:id").delete(deleteSingleProduct);
router.route("/updatesingleproduct/:id").put(
    upload.array("Images", 10),
    updateSingleProduct
);

export default router