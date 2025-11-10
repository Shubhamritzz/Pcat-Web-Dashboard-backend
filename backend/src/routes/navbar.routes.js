import express from "express";
const router = express.Router();

router.get("/getnavbar", (req, res) => {
  console.log("✅ NAVBAR ROUTE HIT");
  res.json({ ok: true, route: "navbar" });
});

export default router;
