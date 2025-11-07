// File: services/S3_Services.js
import { DeleteObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import {s3} from "../config/S3.js";
import ffmpeg from "fluent-ffmpeg";

import path from "path";
import fs from "fs";
import { Readable } from "stream";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import axios from 'axios';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);


ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const allowedImageTypes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
  "application/pdf",
];

const uploads = multer({
  storage: multerS3({
    s3: s3,
    bucket: R2_BUCKET_NAME,
    key: (req, file, cb) => {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      cb(
        null,
        `rittz-accessories/${Date.now()}_${Math.floor(
          Math.random() * 1000000
        )}_${sanitizedName}`
      );
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: "public, max-age=31536000, immutable",
    metadata: (req, file, cb) => {
      cb(null, {
        "original-name": file.originalname,
        "upload-date": new Date().toISOString(),
      });
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 21,
    totalSize: 200 * 1024 * 1024, // 200MB total
  },
  fileFilter: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".xlsx", ".xls", ".pdf"];

    if (
      allowedImageTypes.includes(file.mimetype) ||
      allowedExtensions.includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Only JPG, JPEG, PNG, WEBP, Excel files (.xlsx, .xls), PDF and videos are allowed. Received: ${file.mimetype}`
        ),
        false
      );
    }
  },
});

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/octet-stream",
    ];
    const allowedExtensions = [".xlsx", ".xls"];

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      allowedExtensions.includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Only Excel files (.xlsx, .xls) are allowed. Received: ${file.mimetype} with extension: ${fileExtension}`
        ),
        false
      );
    }
  },
});

export const uploadSingle = (fieldName) => uploads.single(fieldName);

export const uploadFilesOnS3 = async (req, res, next) => {
  uploads.fields([
    { name: "images1" },
    { name: "images2" },
    { name: "images3" },
    { name: "images" },
    { name: "image" },
    { name: "nav_image" },
  ])(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File size exceeds the 50MB limit" });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ error: "Unexpected file field" });
        }
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const formatFile = (file) => ({
      url: `${R2_PUBLIC_URL}/${file.key}`,
      key: file.key,
      originalName: file.originalname,
      size: file.size,
      contentType: file.contentType,
    });

    const mapFiles = (files) => files?.map(formatFile) || [];

    req.imageUrls1 = mapFiles(req.files?.images1);
    req.imageUrls2 = mapFiles(req.files?.images2);
    req.imageUrls3 = mapFiles(req.files?.images3);
    req.imageUrls = mapFiles(req.files?.images);

    const imageUrl = mapFiles(req.files?.image);
    req.imageUrl = imageUrl.length ? imageUrl[0] : null;

    const navImageUrl = mapFiles(req.files?.nav_image);
    req.navImageUrl = navImageUrl.length ? navImageUrl[0] : null;

    next();
  });
};

export const deleteFileByLocationFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl || typeof fileUrl !== "string") {
      console.log("Invalid file URL provided");
      return false;
    }

    if (!fileUrl.startsWith("https://")) {
      console.log("Invalid S3 file URL format");
      return false;
    }

    if (!fileUrl.includes(R2_PUBLIC_URL)) {
      console.log("File URL is not from our CloudFront distribution");
      return false;
    }

    let fileKey = new URL(fileUrl).pathname.substring(1);
    fileKey = decodeURIComponent(fileKey);

    const params = {
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
    };

    await s3.send(new DeleteObjectCommand(params));
    console.log(`File deleted successfully: ${fileKey}`);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error.message);
    return false;
  }
};

export const deleteFileFromS3 = async (fileKey) => {
  try {
    if (!fileKey || typeof fileKey !== "string") {
      console.log("Invalid file key provided");
      return false;
    }

    const params = {
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
    };

    await s3.send(new DeleteObjectCommand(params));
    console.log(`File deleted successfully: ${fileKey}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${fileKey}:`, error.message);
    return false;
  }
};

export const getCloudFrontUrl = (files) => {
  if (!files?.image) return files;

  const _image = files.image.map((file) => {
    file.location = `${R2_PUBLIC_URL}/${file.key}`;
    return file;
  });
  files.image = _image;
  return files;
};

export const downloadAndUploadToS3 = async (videoUrl) => {
  try {
    if (!videoUrl || typeof videoUrl !== "string") {
      throw new Error("Invalid video URL provided");
    }

    console.log(`Downloading video from ${videoUrl}`);

    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "arraybuffer",
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VideoDownloader/1.0)" },
    });

    if (!response.data || response.data.byteLength === 0) {
      throw new Error("Downloaded video is empty");
    }

    const key = `uploads/instagram_${Date.now()}_${Math.floor(Math.random() * 1000000)}.mp4`;

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: response.data,
        ContentType: "video/mp4",
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: {
          source: "instagram",
          "upload-date": new Date().toISOString(),
        },
      })
    );

    console.log(`Video uploaded to S3 successfully: ${key}`);
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("Error downloading and uploading video:", error.message);
    throw new Error(`Failed to download and upload video: ${error.message}`);
  }
};

export const uploadVideosLocally = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = "temp_uploads";
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      } catch (error) {
        cb(new Error(`Failed to create upload directory: ${error.message}`));
      }
    },
    filename: (req, file, cb) => {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      cb(null, `${Date.now()}_${sanitizedName}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  },
});

export async function convertAndUpload(inputPath, originalFileName) {
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const outputFileName = `converted_${Date.now()}_${sanitizedFileName}`;
  const outputPath = path.join("temp_uploads", outputFileName);
  const s3Key = `uploads/videos/${outputFileName}`;

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file does not exist: ${inputPath}`));
    }

    ffmpeg(inputPath)
      .videoCodec("libx264")
      .format("mp4")
      .outputOptions("-movflags +faststart")
      .on("progress", (progress) => {
        console.log(`Conversion progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on("end", async () => {
        try {
          if (!fs.existsSync(outputPath)) {
            throw new Error("Conversion completed but output file not found");
          }

          const fileStream = fs.createReadStream(outputPath);
          const fileStat = fs.statSync(outputPath);

          await s3.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: s3Key,
              Body: fileStream,
              ContentType: "video/mp4",
              CacheControl: "public, max-age=31536000, immutable",
              Metadata: {
                "original-name": originalFileName,
                "converted-date": new Date().toISOString(),
                "file-size": fileStat.size.toString(),
              },
            })
          );

          try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
          } catch (cleanupError) {
            console.warn("Warning: Failed to cleanup temp files:", cleanupError.message);
          }

          resolve(`${R2_PUBLIC_URL}/${s3Key}`);
        } catch (err) {
          try {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          } catch (cleanupError) {
            console.warn("Warning: Failed to cleanup files after error:", cleanupError.message);
          }
          reject(new Error(`Upload failed: ${err.message}`));
        }
      })
      .on("error", (err) => {
        console.error("FFmpeg conversion error:", err.message);
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (cleanupError) {
          console.warn("Warning: Failed to cleanup files after FFmpeg error:", cleanupError.message);
        }
        reject(new Error(`Video conversion failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

export const uploadBufferToS3 = async (
  buffer,
  key,
  contentType = "application/octet-stream",
  metadata = {}
) => {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("Invalid buffer provided");
    }
    if (!key || typeof key !== "string") {
      throw new Error("Invalid S3 key provided");
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: {
          "upload-date": new Date().toISOString(),
          ...metadata,
        },
      })
    );

    console.log(`Buffer uploaded to S3 successfully: ${key}`);
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error(`Error uploading buffer to S3: ${error.message}`);
    throw new Error(`Failed to upload buffer to S3: ${error.message}`);
  }
};

export const checkFileExistsInS3 = async (key) => {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    if (error.name === "NotFound") {
      return false;
    }
    throw error;
  }
};

export {
  uploads,
  excelUpload,
};
