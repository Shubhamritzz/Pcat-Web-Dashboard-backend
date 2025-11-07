// File: config/S3.js

import { S3Client } from "@aws-sdk/client-s3";

// ✅ Cloudflare R2 configuration
export const s3 = new S3Client({
  region: "auto", // R2 does not use specific AWS regions
  endpoint: process.env.R2_ENDPOINT, // Example: https://<account-id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});


