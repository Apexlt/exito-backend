import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import axios from "axios";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import compression from "compression";

import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/authRoutes.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import feedbackRoutes from "./routes/feedback.js";

import Order from "./models/Order.js";

const app = express();

/* ===================== */
/* ✅ CORS (FIXED FOR PRODUCTION) */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://exito-kitchen.vercel.app", // 🔥 REPLACE THIS
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(compression());

/* ===================== */
/* ✅ HEALTH CHECK (IMPORTANT FOR RENDER) */
app.get("/", (req, res) => {
  res.send("API is running...");
});

/* ===================== */
/* ENV CHECK */
const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "PAYSTACK_SECRET_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV: ${key}`);
    process.exit(1);
  }
});

/* ===================== */
/* DB CONNECT */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });

/* ===================== */
/* ROUTES */
app.use("/auth", authRoutes);
app.use("/auth", googleAuthRoutes);
app.use("/admin", adminRoutes);
app.use("/feedback", feedbackRoutes);

/* ===================== */
/* VERIFY PAYMENT */
app.post("/verify-payment", async (req, res) => {
  try {
    const { reference, cart, email, location, token } = req.body;

    if (!reference || !cart || !email) {
      return res.status(400).json({ success: false });
    }

    const existing = await Order.findOne({ reference });
    if (existing) return res.json({ success: true, order: existing });

    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {}
    }

    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = paystackRes.data.data;

    if (data.status !== "success") {
      return res.status(400).json({ message: "Payment failed" });
    }

    const total = cart.reduce(
      (acc, item) =>
        acc + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );

    const newOrder = await Order.create({
      userId,
      reference,
      email,
      amount: total,
      location,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        inHouse: item.inHouse === true,
      })),
      status: "paid",
      paystackTransactionId: data.id,
    });

    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("VERIFY ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===================== */
/* USER ORDERS */
app.get("/user/orders", async (req, res) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.json([]);
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const orders = await Order.find({ userId: decoded.id }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch {
    res.json([]);
  }
});

/* ===================== */
/* ✅ GLOBAL ERROR HANDLER (VERY IMPORTANT) */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

/* ===================== */
/* PORT */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
