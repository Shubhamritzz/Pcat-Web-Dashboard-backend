import mongoose, { Schema } from 'mongoose'

const seoSchema = new Schema(
  {
    page_name: {
      type: String,
      required: true,
      trim: true,
    },
    page_slug: {
      type: String,
      unique: true, // example => /page_slug
      required: true,
      trim: true,
    },

    seo: {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      canonical: {
        type: String,
      },
      icon: {
        type: String, // image upload
      },
      google_site_verification: {
        name: {
          type: String,
        },
        content: {
          type: String,
        },
      },
      meta_property_og: [
        {
          property: {
            type: String,
            required: true,
          },
          content: {
            type: String,
            required: true,
          },
        },
      ],
      meta_name_twitter: [
        {
          name: {
            type: String,
            required: true,
          },
          content: {
            type: String,
            required: true,
          },
        },
      ],
    },
    google_tag_manager: {
      header: {
        type: String,
      },
      body: {
        type: String,
      },
    },
    sitemap: {
      loc: {
        type: String,
        required: true,
      },
      lastmod: {
        type: Date,
        default: Date.now,
      },
      priority: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1,
      },
      changefreq: {
        type: String,
        enum: [
          "always",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
          "never",
        ],
        default: "monthly",
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const SeoManagement  = mongoose.model("SeoManagement", seoSchema);
