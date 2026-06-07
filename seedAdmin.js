import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
});

const User = mongoose.model("User", UserSchema);

async function fixAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashed = await bcrypt.hash("479108", 10);

    const user = await User.findOneAndUpdate(
      { email: "nwabugwuijiomaigwe433@gmail.com" },
      {
        email: "nwabugwuijiomaigwe433@gmail.com",
        password: hashed,
        role: "admin",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Admin fixed:", user.email);
    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

fixAdmin();
