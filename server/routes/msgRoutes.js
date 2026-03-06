import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  getUnreadCounts,
  markAsRead,
  deleteMessage
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/unread",protect,getUnreadCounts);
router.get("/:convoId", protect, getMessages);
router.post("/", protect, sendMessage);
router.post("/:convoId/read",protect,markAsRead);
router.delete("/:messageId", protect, deleteMessage);
export default router;