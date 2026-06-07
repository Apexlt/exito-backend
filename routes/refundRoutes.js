import express from "express";
import axios from "axios";
import Order from "../models/Order.js";

const router = express.Router();

/**
 * REAL PAYSTACK REFUND
 */
router.post("/refund/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "refunded") {
      return res.status(400).json({ message: "Already refunded" });
    }

    if (!order.paystackTransactionId) {
      return res.status(400).json({
        message: "Missing Paystack transaction ID",
      });
    }

    // 🔥 PAYSTACK REFUND REQUEST
    const response = await axios.post(
      "https://api.paystack.co/refund",
      {
        transaction: order.paystackTransactionId,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const refundData = response.data;

    if (!refundData.status) {
      return res.status(400).json({
        message: "Paystack refund failed",
      });
    }

    // ✅ UPDATE ORDER
    order.status = "refunded";
    order.refundedAt = new Date();
    order.refundReason = req.body.reason || "Admin refund";

    await order.save();

    res.json({
      success: true,
      message: "Refund successful",
      order,
      refund: refundData,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Refund failed",
    });
  }
});

export default router;
