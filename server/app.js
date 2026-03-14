import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js"
import msgRoutes from "./routes/msgRoutes.js"
import conversationRoutes from "./routes/conversationRoutes.js";

import friendRequestRoutes from "./routes/friendRequestRoutes.js"
import statusRoutes from "./routes/statusRoutes.js"

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use("/api/conversations", conversationRoutes);
app.use("/api/users", authRoutes);
app.use("/api/messages", msgRoutes);
app.use("/api/friends", friendRequestRoutes)
app.use("/api/status", statusRoutes);

export default app;