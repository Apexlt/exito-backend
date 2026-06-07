import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    items: {
      type: Array,
      default: [],
    },

    cookingType: {
      type: String,
      enum: ["in-house", "delivery"],
      default: "delivery",
      index: true,
    },

    paystackTransactionId: {
      type: String,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
      index: true,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    refundReason: {
      type: String,
      default: null,
      trim: true,
    },

    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ email: 1, createdAt: -1 });
OrderSchema.index({ amount: -1 });
OrderSchema.index({ cookingType: 1, createdAt: -1 });

export default mongoose.model("Order", OrderSchema);
