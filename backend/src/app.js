import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Debug log:
console.log("✅ app.js loaded");

const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// ✅ Routes
import userRoute from "./routes/user.routes.js";
import navbarRoute from "./routes/navbar.routes.js";
import productRoute from "./routes/product.route.js";
import seo from "./routes/seo.router.js";


// ✅ IMPORTANT: NO "/api" prefix here (Vercel adds it)
app.use("/v1/users", userRoute);
app.use("/v1/navbar", navbarRoute);
app.use("/v1/products", productRoute);
app.use("/v1/seo", seo);

export default app;
