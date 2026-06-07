import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import qs from "querystring";

const router = express.Router();

/* ===================== */
/* STEP 1: REDIRECT */
/* ===================== */
router.get("/google", (req, res) => {
  const {
    GOOGLE_CLIENT_ID,
  } = process.env;

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).send("Missing GOOGLE_CLIENT_ID");
  }

  const redirect_uri = "http://localhost:5000/auth/google/callback";

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
});

/* ===================== */
/* STEP 2: CALLBACK */
/* ===================== */
router.get("/google/callback", async (req, res) => {
  try {
    const {
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      JWT_SECRET,
    } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !JWT_SECRET) {
      return res.status(500).send("Server ENV missing");
    }

    const code = req.query.code;
    if (!code) return res.redirect("http://localhost:5173/login");

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:5000/auth/google/callback",
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { id_token } = tokenRes.data;

    if (!id_token) {
      return res.redirect("http://localhost:5173/login");
    }

    const payload = JSON.parse(
      Buffer.from(id_token.split(".")[1], "base64").toString()
    );

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        email: payload.email,
        password: "google-auth",
        role: "user",
      });
    }

   const token = jwt.sign(
  { id: user._id, email: user.email, role: user.role }, // ✅ ADD EMAIL
  JWT_SECRET,
  { expiresIn: "7d" }
);

    return res.redirect(
      `http://localhost:5173/google-success?token=${token}`
    );

  } catch (err) {
    console.error("GOOGLE ERROR:", err.message);
    return res.redirect("http://localhost:5173/login");
  }
});

export default router;