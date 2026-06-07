import express from "express";
import { refundOrder } from "../controllers/refundController.js";

const router = express.Router();

// 💳 REFUND ROUTE
router.put("/orders/:id/refund", refundOrder);

export default router;
