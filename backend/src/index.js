import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Swagger JSON manually
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../swagger-output.json"))
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log(`Error in server after connect db : ${err}`);
      throw err;
    });

    app.listen(process.env.Port, () => {
      console.log(`Server is running on port ${process.env.Port}`);
    });
  })
  .catch((err) => {
    console.log("DB connection failed", err);
  });
