const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signLogin } = require("../utils/token");
const { auth } = require("../middleware/auth");
const { validate, rules } = require("../middleware/validate");

const router = express.Router();

// POST /api/auth/login  { collegeId, password }
router.post("/login", rules.login, validate, async (req, res) => {
  const { collegeId, password } = req.body;
  if (!collegeId || !password)
    return res.status(400).json({ error: "collegeId and password required" });

  const user = await User.findOne({ collegeId });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signLogin(user);
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId,
      section: user.section,
      hasFace: Array.isArray(user.faceEmbedding) && user.faceEmbedding.length > 0,
    },
  });
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  res.json({ user });
});

module.exports = router;
