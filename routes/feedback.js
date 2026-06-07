import express from "express";
import Feedback from "../models/Feedback.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// USER SEND FEEDBACK
router.post("/", authMiddleware, async (req, res) => {
  try {
    // 🔥 DEBUG LOGS
    console.log("🔥 FEEDBACK ROUTE HIT");
    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    if (!req.user) {
      return res.status(401).json({
        message: "No user found in request (auth failed)",
      });
    }

    const { message, rating } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const feedback = await Feedback.create({
      userId: req.user.id,
      email: req.user.email,
      message,
      rating: rating || 5,
    });

    console.log("✅ SAVED FEEDBACK:", feedback);

    return res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });

  } catch (err) {
    console.error("❌ FEEDBACK ERROR:", err);
    return res.status(500).json({
      message: "Server error while sending feedback",
      error: err.message,
    });
  }
});

// ADMIN GET ALL FEEDBACK
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await Feedback.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("GET FEEDBACK ERROR:", err);
    res.status(500).json([]);
  }
});

export default router;