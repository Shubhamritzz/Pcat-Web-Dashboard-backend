import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: "./.env" });

const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../swagger-output.json"))
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

connectDB().catch((err) => console.log("DB connection failed", err));

// ✅ Start only in local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
}

export default app;
