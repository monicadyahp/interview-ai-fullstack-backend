import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import env from "./config/env.js";
import { connectDB } from "./config/database.js";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

connectDB().catch((err) =>
  console.error("[boot] DB connect failed:", err.message),
);

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
});

app.use(errorHandler);

if (env.NODE_ENV !== "production") {
  app.listen(env.PORT, () => {
    console.log(`[server] running at http://${env.HOST}:${env.PORT}`);
    console.log(`[server] api root: http://${env.HOST}:${env.PORT}/api`);
  });
}

export default app;
