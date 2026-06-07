import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: String,
    message: String,
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);