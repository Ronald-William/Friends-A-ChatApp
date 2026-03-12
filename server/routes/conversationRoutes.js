import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyConversations,
  createConversation,
  createGroup,
  addMember,
  removeMember,
  leaveGroup,
  disbandGroup
} from "../controllers/conversationController.js";

const router = express.Router();

router.get("/", protect, getMyConversations);
router.post("/", protect, createConversation);
router.post("/group", protect, createGroup);
router.post("/:convoId/members", protect, addMember);
router.delete("/:convoId/members/:userId", protect, removeMember);
router.post("/:convoId/leave", protect, leaveGroup);
router.delete("/:convoId", protect, disbandGroup);

export default router;