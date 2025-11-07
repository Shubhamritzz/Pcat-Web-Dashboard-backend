import { Router } from "express";
import { uploads } from "../services/S3_Services.js";
import {
    getSEOPages,
    getSEOPage,
    getSEOPageBySlug,
    createSEOPage,
    updateSEOPage,
    deleteSEOPage,
    removeSEOIcon,
} from "../controllers/seo.controller.js";

const router = Router();

// ==================== SEO ROUTES ====================

// Get all SEO pages
router.route("/getAll").get(getSEOPages);

// Get single SEO page
router.route("/get/:id").get(getSEOPage);

// Get SEO page by slug (for frontend use)
router.route("/slug/:slug").get(getSEOPageBySlug);

// Create SEO page
router
    .route("/create")
    .post(uploads.single("icon"), createSEOPage);

// Update SEO page
router
    .route("/update/:id")
    .put(uploads.single("icon"), updateSEOPage);

// Delete SEO page
router.route("/delete/:id").delete(deleteSEOPage);

// Remove SEO icon
router.route("/remove-icon/:id/icon").delete(removeSEOIcon);

export default router;
