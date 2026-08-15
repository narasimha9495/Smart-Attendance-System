const express = require("express");
const Timetable = require("../models/Timetable");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");
const { newSecret, currentCode, newShortCode } = require("../utils/otp");
const { buildSessionWorkbook } = require("../utils/excel");
const { sendAbsentAlertsBatch } = require("../utils/whatsapp");

const router = express.Router();
router.use(auth, requireRole("teacher"));

function hmToMinutes(hm) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

// GET /api/teacher/current-session
// Returns the timetable entry this teacher is scheduled for RIGHT NOW.
router.get("/current-session", async (req, res) => {
  const now = new Date();
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();

  const entries = await Timetable.find({ teacher: req.user.id, day });
  const active = entries.find(
    (e) => mins >= hmToMinutes(e.startTime) && mins <= hmToMinutes(e.endTime)
  );

  if (!active)
    return res.json({ scheduled: null, message: "No class scheduled right now" });

  res.json({ scheduled: active });
});

// POST /api/teacher/session/start  { timetableId }
router.post("/session/start", async (req, res) => {
  const entry = await Timetable.findOne({
    _id: req.body.timetableId,
    teacher: req.user.id,
  });
  if (!entry)
    return res.status(403).json({ error: "Not your scheduled class" });

  // window: until the scheduled end time (or 15 min, whichever is sooner logic can be added)
  const now = new Date();
  const [eh, em] = entry.endTime.split(":").map(Number);
  const expiresAt = new Date(now);
  expiresAt.setHours(eh, em, 0, 0);
  if (expiresAt <= now) expiresAt.setTime(now.getTime() + 15 * 60 * 1000);

  // ensure the short code is unique
  let shortCode;
  for (let i = 0; i < 5; i++) {
    shortCode = newShortCode(6);
    const exists = await Session.findOne({ shortCode });
    if (!exists) break;
  }

  const session = await Session.create({
    timetable: entry._id,
    teacher: req.user.id,
    subject: entry.subject,
    section: entry.section,
    room: entry.room,
    roomLat: entry.roomLat,
    roomLng: entry.roomLng,
    radius: entry.radius,
    otpSecret: newSecret(),
    shortCode,
    expiresAt,
  });

  res.json({
    sessionId: session._id,
    shortCode,
    expiresAt,
    subject: entry.subject,
    section: entry.section,
    room: entry.room,
  });
});

// GET /api/teacher/session/:id/code  -> current rotating in-room code
router.get("/session/:id/code", async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session || String(session.teacher) !== req.user.id)
    return res.status(404).json({ error: "Session not found" });
  res.json({ code: currentCode(session.otpSecret) });
});

// GET /api/teacher/session/:id/live -> present list so far
router.get("/session/:id/live", async (req, res) => {
  const session = await Session.findById(req.params.id).populate(
    "presentStudents",
    "name rollNo"
  );
  if (!session || String(session.teacher) !== req.user.id)
    return res.status(404).json({ error: "Session not found" });
  res.json({ present: session.presentStudents, open: session.open });
});

// POST /api/teacher/session/:id/save
// Closes the session, marks everyone not present as absent, fires parent alerts.
router.post("/session/:id/save", async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session || String(session.teacher) !== req.user.id)
    return res.status(404).json({ error: "Session not found" });

  session.open = false;
  await session.save();

  const date = new Date().toISOString().slice(0, 10);
  const classStudents = await User.find({
    role: "student",
    section: session.section,
  });

  const presentSet = new Set(session.presentStudents.map((s) => String(s)));
  const alerts = [];

  for (const stu of classStudents) {
    const isPresent = presentSet.has(String(stu._id));
    await Attendance.findOneAndUpdate(
      { session: session._id, student: stu._id },
      {
        session: session._id,
        student: stu._id,
        subject: session.subject,
        section: session.section,
        date,
        status: isPresent ? "present" : "absent",
        markedAt: isPresent ? new Date() : undefined,
      },
      { upsert: true, new: true }
    );

    if (!isPresent && stu.parentPhone) {
      alerts.push({
        parentPhone: stu.parentPhone,
        info: { name: stu.name, subject: session.subject, date },
      });
    }
  }

  // fire-and-forget so Save returns immediately
  sendAbsentAlertsBatch(alerts);

  res.json({
    saved: true,
    present: presentSet.size,
    total: classStudents.length,
    alertsQueued: alerts.length,
  });
});

// GET /api/teacher/session/:id/excel -> download xlsx
router.get("/session/:id/excel", async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session || String(session.teacher) !== req.user.id)
    return res.status(404).json({ error: "Session not found" });

  const records = await Attendance.find({ session: session._id }).populate(
    "student",
    "name rollNo"
  );
  const rows = records.map((r) => ({
    rollNo: r.student?.rollNo,
    name: r.student?.name,
    subject: r.subject,
    section: r.section,
    date: r.date,
    status: r.status,
    markedAt: r.markedAt,
  }));

  const buf = buildSessionWorkbook(rows, { subject: session.subject });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="attendance_${session.subject}_${session.section}.xlsx"`
  );
  res.send(buf);
});

module.exports = router;
