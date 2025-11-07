
import { SeoManagement } from "../models/seo.model.js";

import {deleteFileByLocationFromS3} from "../services/S3_Services.js";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Get all SEO pages
export const getSEOPages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { page_name: { $regex: search, $options: "i" } },
        { page_slug: { $regex: search, $options: "i" } },
        { "seo.title": { $regex: search, $options: "i" } },
      ];
    }
    if (status !== undefined && status !== "") {
      filter.status = status;
    }

    const seoPages = await SeoManagement.find(filter)
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await SeoManagement.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: seoPages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error getting SEO pages:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get single SEO page
export const getSEOPage = async (req, res) => {
  try {
    const { id } = req.params;
    const seoPage = await SeoManagement.findById(id);

    if (!seoPage) {
      return res
        .status(404)
        .json({ success: false, message: "SEO page not found" });
    }

    res.status(200).json({ success: true, data: seoPage });
  } catch (error) {
    console.error("Error getting SEO page:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get SEO page by slug
export const getSEOPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const seoPage = await SeoManagement.findOne({
      page_slug: slug,
      status: "active",
    });

    if (!seoPage) {
      return res
        .status(404)
        .json({ success: false, message: "SEO page not found" });
    }

    res.status(200).json({ success: true, data: seoPage });
  } catch (error) {
    console.error("Error getting SEO page by slug:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Create SEO page
export const createSEOPage = async (req, res) => {
  try {
    const {
      page_name,
      page_slug,
      seo_title,
      seo_description,
      canonical,
      google_site_verification_name,
      google_site_verification_content,
      meta_property_og,
      meta_name_twitter,
      google_tag_manager_header,
      google_tag_manager_body,
      sitemap_loc,
      sitemap_priority,
      sitemap_changefreq,
      status,
    } = req.body;

    const existingSEOPage = await SeoManagement.findOne({ page_slug });
    if (existingSEOPage) {
      if (req.file && req.file.key) {
        await deleteFileByLocationFromS3(`${R2_PUBLIC_URL}/${req.file.key}`);
      }
      return res.status(400).json({
        success: false,
        message: "Page slug already exists",
      });
    }

    let iconData = "";
    if (req.file && req.file.key) {
      iconData = `${R2_PUBLIC_URL}/${req.file.key}`;
    }

    let parsedMetaPropertyOg = [];
    let parsedMetaNameTwitter = [];

    try {
      if (meta_property_og) {
        parsedMetaPropertyOg = JSON.parse(meta_property_og);
      }
      if (meta_name_twitter) {
        parsedMetaNameTwitter = JSON.parse(meta_name_twitter);
      }
    } catch (parseError) {
      if (req.file && req.file.key) {
        await deleteFileByLocationFromS3(`${R2_PUBLIC_URL}/${req.file.key}`);
      }
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format for meta tags",
      });
    }

    const seoPage = new SeoManagement({
      page_name,
      page_slug,
      seo: {
        title: seo_title,
        description: seo_description,
        canonical: canonical || "",
        icon: iconData,
        google_site_verification: {
          name: google_site_verification_name || "",
          content: google_site_verification_content || "",
        },
        meta_property_og: parsedMetaPropertyOg,
        meta_name_twitter: parsedMetaNameTwitter,
      },
      google_tag_manager: {
        header: google_tag_manager_header || "",
        body: google_tag_manager_body || "",
      },
      sitemap: {
        loc: sitemap_loc,
        priority: parseFloat(sitemap_priority) || 0.5,
        changefreq: sitemap_changefreq || "monthly",
      },
      status: status || "active",
    });

    await seoPage.save();

    res.status(201).json({ success: true, data: seoPage });
  } catch (error) {
    if (req.file && req.file.key) {
      await deleteFileByLocationFromS3(`${R2_PUBLIC_URL}/${req.file.key}`);
    }
    console.error("Error creating SEO page:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update SEO page
export const updateSEOPage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page_name,
      page_slug,
      seo_title,
      seo_description,
      canonical,
      google_site_verification_name,
      google_site_verification_content,
      meta_property_og,
      meta_name_twitter,
      google_tag_manager_header,
      google_tag_manager_body,
      sitemap_loc,
      sitemap_priority,
      sitemap_changefreq,
      status,
    } = req.body;

    const seoPage = await SeoManagement.findById(id);
    if (!seoPage) {
      if (req.file && req.file.key) {
        await deleteFileByLocationFromS3(`${R2_PUBLIC_URL}/${req.file.key}`);
      }
      return res
        .status(404)
        .json({ success: false, message: "SEO page not found" });
    }

    if (page_slug && page_slug !== seoPage.page_slug) {
      const existingSEOPage = await SeoManagement.findOne({
        page_slug,
        _id: { $ne: id },
      });
      if (existingSEOPage) {
        if (req.file && req.file.key) {
          await deleteFileByLocationFromS3(`${R2_PUBLIC_URL}/${req.file.key}`);
        }
        return res.status(400).json({
          success: false,
          message: "Page slug already exists",
        });
      }
    }

    if (req.file && req.file.key) {
      if (seoPage.seo.icon) {
        await deleteFileByLocationFromS3(seoPage.seo.icon);
      }
      seoPage.seo.icon = `${R2_PUBLIC_URL}/${req.file.key}`;
    }

    let parsedMetaPropertyOg = seoPage.seo.meta_property_og;
    let parsedMetaNameTwitter = seoPage.seo.meta_name_twitter;

    try {
      if (meta_property_og) {
        parsedMetaPropertyOg = JSON.parse(meta_property_og);
      }
      if (meta_name_twitter) {
        parsedMetaNameTwitter = JSON.parse(meta_name_twitter);
      }
    } catch (parseError) {
      if (req.file && req.file.key) {
        await deleteFileByLocationFromS3(`${R2_PUBLIC_URL}/${req.file.key}`);
      }
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format for meta tags",
      });
    }

    if (page_name !== undefined) seoPage.page_name = page_name;
    if (page_slug !== undefined) seoPage.page_slug = page_slug;
    if (seo_title !== undefined) seoPage.seo.title = seo_title;
    if (seo_description !== undefined)
      seoPage.seo.description = seo_description;
    if (canonical !== undefined) seoPage.seo.canonical = canonical;
    if (google_site_verification_name !== undefined)
      seoPage.seo.google_site_verification.name = google_site_verification_name;
    if (google_site_verification_content !== undefined)
      seoPage.seo.google_site_verification.content =
        google_site_verification_content;
    if (meta_property_og !== undefined)
      seoPage.seo.meta_property_og = parsedMetaPropertyOg;
    if (meta_name_twitter !== undefined)
      seoPage.seo.meta_name_twitter = parsedMetaNameTwitter;
    if (google_tag_manager_header !== undefined)
      seoPage.google_tag_manager.header = google_tag_manager_header;
    if (google_tag_manager_body !== undefined)
      seoPage.google_tag_manager.body = google_tag_manager_body;
    if (sitemap_loc !== undefined) seoPage.sitemap.loc = sitemap_loc;
    if (sitemap_priority !== undefined)
      seoPage.sitemap.priority = parseFloat(sitemap_priority);
    if (sitemap_changefreq !== undefined)
      seoPage.sitemap.changefreq = sitemap_changefreq;
    if (status !== undefined) seoPage.status = status;

    seoPage.updated_at = new Date();
    seoPage.sitemap.lastmod = new Date();

    await seoPage.save();

    res.status(200).json({ success: true, data: seoPage });
  } catch (error) {
    if (req.file && req.file.key) {
      await deleteFileByLocationFromS3(`${R2_PUBLIC_URL}/${req.file.key}`);
    }
    console.error("Error updating SEO page:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete SEO page
export const deleteSEOPage = async (req, res) => {
  try {
    const { id } = req.params;

    const seoPage = await SeoManagement.findById(id);
    if (!seoPage) {
      return res
        .status(404)
        .json({ success: false, message: "SEO page not found" });
    }

    if (seoPage.seo.icon) {
      await deleteFileByLocationFromS3(seoPage.seo.icon);
    }

    await SeoManagement.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "SEO page deleted successfully" });
  } catch (error) {
    console.error("Error deleting SEO page:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Remove icon from SEO page
 export const removeSEOIcon = async (req, res) => {
  try {
    const { id } = req.params;

    const seoPage = await SeoManagement.findById(id);
    if (!seoPage) {
      return res
        .status(404)
        .json({ success: false, message: "SEO page not found" });
    }

    if (seoPage.seo.icon) {
      await deleteFileByLocationFromS3(seoPage.seo.icon);
    }

    seoPage.seo.icon = "";
    await seoPage.save();

    res.status(200).json({ success: true, data: seoPage });
  } catch (error) {
    console.error("Error removing SEO icon:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


