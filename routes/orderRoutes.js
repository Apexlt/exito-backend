import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// 🔥 SAVE ORDER
router.post("/create", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
