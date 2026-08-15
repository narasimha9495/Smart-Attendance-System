const express = require("express");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(auth, requireRole("teacher", "admin"));

// GET /api/analytics/summary?section=CSE-B
// Returns per-student attendance %, overall stats, and defaulters (<75%).
router.get("/summary", async (req, res) => {
  const section = req.query.section;
  const studentQuery = { role: "student" };
  if (section) studentQuery.section = section;

  const students = await User.find(studentQuery).select("name rollNo section");
  const ids = students.map((s) => s._id);

  const records = await Attendance.find({ student: { $in: ids } });

  const byStudent = {};
  for (const s of students) {
    byStudent[s._id] = {
      name: s.name,
      rollNo: s.rollNo,
      section: s.section,
      total: 0,
      present: 0,
    };
  }
  for (const r of records) {
    const b = byStudent[r.student];
    if (!b) continue;
    b.total += 1;
    if (r.status === "present") b.present += 1;
  }

  const rows = Object.values(byStudent).map((b) => ({
    ...b,
    percentage: b.total ? Math.round((b.present / b.total) * 100) : 0,
  }));
  rows.sort((a, b) => a.percentage - b.percentage);

  const defaulters = rows.filter((r) => r.total > 0 && r.percentage < 75);
  const classAvg = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.percentage, 0) / rows.length)
    : 0;

  // subject-wise breakdown
  const subjectMap = {};
  for (const r of records) {
    const k = r.subject || "Unknown";
    subjectMap[k] = subjectMap[k] || { subject: k, total: 0, present: 0 };
    subjectMap[k].total += 1;
    if (r.status === "present") subjectMap[k].present += 1;
  }
  const subjects = Object.values(subjectMap).map((s) => ({
    subject: s.subject,
    percentage: s.total ? Math.round((s.present / s.total) * 100) : 0,
  }));

  res.json({
    students: rows,
    defaulters,
    classAverage: classAvg,
    totalStudents: rows.length,
    subjects,
  });
});

module.exports = router;
