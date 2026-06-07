import express from "express";
import axios from "axios";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Feedback from "../models/Feedback.js"; // ✅ ADD THIS
import mongoose from "mongoose";

import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* GET ORDERS */
/* ===================== */
router.get("/orders", authMiddleware, isAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json(orders);
  } catch (err) {
    console.error("FETCH ORDERS ERROR:", err.message);
    return res.status(500).json([]);
  }
});

/* ===================== */
/* USERS */
/* ===================== */
router.get("/users", authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(users);
  } catch (err) {
    console.error("USERS ERROR:", err.message);
    return res.status(500).json([]);
  }
});

/* ===================== */
/* FEEDBACK 🔥 FIX ADDED */
/* ===================== */
router.get("/feedback", authMiddleware, isAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json(feedback);
  } catch (err) {
    console.error("FEEDBACK ERROR:", err.message);
    return res.status(500).json([]);
  }
});

/* ===================== */
/* DELETE ORDER */
/* ===================== */
router.delete("/orders/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    await Order.findByIdAndDelete(req.params.id);

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Delete failed" });
  }
});

/* ===================== */
/* REFUND ORDER */
/* ===================== */
router.put("/orders/:id/refund", authMiddleware, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "refunded") {
      return res.status(400).json({ message: "Already refunded" });
    }

    if (order.status !== "paid") {
      return res.status(400).json({
        message: `Cannot refund order with status: ${order.status}`,
      });
    }

    if (!order.paystackTransactionId) {
      return res.status(400).json({
        message: "Missing Paystack transaction ID",
      });
    }

    await axios.post(
      "https://api.paystack.co/refund",
      { transaction: order.paystackTransactionId },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    order.status = "refunded";
    await order.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("REFUND ERROR:", err.message);
    return res.status(500).json({ message: "Refund failed" });
  }
});

export default router;