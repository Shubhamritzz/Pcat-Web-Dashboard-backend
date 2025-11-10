import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Swagger
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../swagger-output.json"))
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Load .env
dotenv.config({ path: "./.env" });

// Connect MongoDB only once
connectDB().catch((err) => {
  console.log("DB connection failed", err);
});

export default app;
