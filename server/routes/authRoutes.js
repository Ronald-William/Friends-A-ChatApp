import express from 'express';
import { register, login, logout, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();
router.get("/me", protect, getMe);
router.post("/register",register);
router.post("/login", login);
router.post("/logout", logout);

export default router;