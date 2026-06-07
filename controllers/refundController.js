import axios from "axios";
import Order from "../models/Order.js";

export const refundOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "refunded") {
      return res.status(400).json({ message: "Already refunded" });
    }

    if (!order.reference) {
      return res.status(400).json({ message: "Missing transaction reference" });
    }

    const response = await axios.post(
      "https://api.paystack.co/refund",
      {
        transaction: order.reference,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    order.status = "refunded";
    order.refundedAt = new Date();
    order.refundReason = req.body.reason || "Admin refund";

    await order.save();

    res.json({
      success: true,
      message: "Refund processed",
      data: response.data,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      message: "Refund failed",
    });
  }
};
