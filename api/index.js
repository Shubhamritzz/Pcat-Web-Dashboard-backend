import serverless from "serverless-http";
import app from "../src/index.js";   

export const config = {
  runtime: "nodejs20.x",
};

export default serverless(app);
