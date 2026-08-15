const express = require("express");
const User = require("../models/User");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const { auth, requireRole } = require("../middleware/auth");
const { verifyCode } = require("../utils/otp");
const { isMatch } = require("../utils/faceMatch");
const { isInsideGeofence } = require("../utils/geo");
const { validate, rules } = require("../middleware/validate");

module.exports = function (io) {
  const router = express.Router();
  router.use(auth, requireRole("student"));

  // POST /api/student/enroll-face  { embedding: [128 floats], deviceId }
  router.post("/enroll-face", rules.enrollFace, validate, async (req, res) => {
    const { embedding, deviceId } = req.body;
    if (!Array.isArray(embedding) || embedding.length !== 128)
      return res.status(400).json({ error: "A 128-length embedding is required" });

    const student = await User.findById(req.user.id);

    // Duplicate-face check: block enrolling a face already tied to another ID
    const others = await User.find({
      _id: { $ne: student._id },
      role: "student",
      faceEmbedding: { $ne: null },
    });
    for (const o of others) {
      const { match } = isMatch(o.faceEmbedding, embedding, Number(process.env.FACE_THRESHOLD) || 0.5);
      if (match)
        return res.status(409).json({ error: "This face is already enrolled under another ID" });
    }

    student.faceEmbedding = embedding;
    if (deviceId) student.deviceId = deviceId;
    await student.save();
    res.json({ enrolled: true });
  });

  // GET /api/student/session/:shortCode -> validate short link code, return what to verify
  router.get("/session/:shortCode", async (req, res) => {
    const session = await Session.findOne({ shortCode: req.params.shortCode });
    if (!session || !session.open || session.expiresAt < new Date())
      return res.status(410).json({ error: "Session closed or expired" });
    res.json({
      sessionId: session._id,
      subject: session.subject,
      section: session.section,
      room: session.room,
      roomLat: session.roomLat,
      roomLng: session.roomLng,
      radius: session.radius,
    });
  });

  // POST /api/student/mark
  // { shortCode, embedding, livenessPassed, roomCode, lat, lng, deviceId }
  router.post("/mark", rules.mark, validate, async (req, res) => {
    const { shortCode, embedding, livenessPassed, roomCode, lat, lng, deviceId } =
      req.body;

    // 0. session valid + open
    const session = await Session.findOne({ shortCode });
    if (!session || !session.open || session.expiresAt < new Date())
      return res.status(410).json({ error: "Session closed or expired" });

    const student = await User.findById(req.user.id);

    // section must match the class
    if (student.section !== session.section)
      return res.status(403).json({ error: "You are not in this class/section" });

    // already marked?
    if (session.presentStudents.some((s) => String(s) === String(student._id)))
      return res.json({ marked: true, message: "Already marked present" });

    // 1. device binding
    if (student.deviceId && deviceId && student.deviceId !== deviceId)
      return res.status(403).json({ error: "This is not your registered device" });

    // 2. liveness
    if (!livenessPassed)
      return res.status(403).json({ error: "Liveness check failed" });

    // 3. face match against enrolled embedding
    if (!student.faceEmbedding)
      return res.status(400).json({ error: "Enroll your face first" });
    const { match, distance } = isMatch(
      student.faceEmbedding,
      embedding,
      Number(process.env.FACE_THRESHOLD) || 0.5
    );
    if (!match)
      return res.status(403).json({ error: `Face did not match (distance ${distance})` });

    // 4. in-room rotating code
    if (!verifyCode(session.otpSecret, roomCode))
      return res.status(403).json({ error: "Wrong or expired in-room code" });

    // 5. geofence (secondary)
    if (typeof lat === "number" && typeof lng === "number") {
      const geo = isInsideGeofence(lat, lng, session.roomLat, session.roomLng, session.radius);
      if (!geo.inside)
        return res
          .status(403)
          .json({ error: `Outside classroom radius (${geo.distance} m away)` });
    }

    // all layers passed -> mark present
    session.presentStudents.push(student._id);
    await session.save();

    const date = new Date().toISOString().slice(0, 10);
    await Attendance.findOneAndUpdate(
      { session: session._id, student: student._id },
      {
        session: session._id,
        student: student._id,
        subject: session.subject,
        section: session.section,
        date,
        status: "present",
        markedAt: new Date(),
      },
      { upsert: true }
    );

    // live update to teacher dashboard
    io.to(`session_${session._id}`).emit("student_marked", {
      name: student.name,
      rollNo: student.rollNo,
    });

    res.json({ marked: true });
  });

  return router;
};
