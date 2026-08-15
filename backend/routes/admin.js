const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Timetable = require("../models/Timetable");
const { auth, requireRole } = require("../middleware/auth");
const { validate, rules } = require("../middleware/validate");

const router = express.Router();
router.use(auth, requireRole("admin"));

// Create a user (teacher or student)
// POST /api/admin/users
router.post("/users", rules.createUser, validate, async (req, res) => {
  try {
    const { name, collegeId, role, password, email, rollNo, section, parentPhone } =
      req.body;
    const passwordHash = await bcrypt.hash(password || "password123", 10);
    const user = await User.create({
      name,
      collegeId,
      role,
      passwordHash,
      email,
      rollNo,
      section,
      parentPhone,
    });
    res.json({ id: user._id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List users (optionally by role/section)
router.get("/users", async (req, res) => {
  const q = {};
  if (req.query.role) q.role = req.query.role;
  if (req.query.section) q.section = req.query.section;
  const users = await User.find(q).select("-passwordHash -faceEmbedding");
  res.json({ users });
});

// Create a timetable entry
// POST /api/admin/timetable
router.post("/timetable", rules.timetable, validate, async (req, res) => {
  try {
    const entry = await Timetable.create(req.body);
    res.json({ id: entry._id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List timetable
router.get("/timetable", async (req, res) => {
  const entries = await Timetable.find().populate("teacher", "name collegeId");
  res.json({ entries });
});

module.exports = router;
