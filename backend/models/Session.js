const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    timetable: { type: mongoose.Schema.Types.ObjectId, ref: "Timetable", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    subject: String,
    section: String,
    room: String,
    roomLat: Number,
    roomLng: Number,
    radius: Number,

    // secret used to derive the rotating in-room code (TOTP-style)
    otpSecret: { type: String, required: true },

    // short, human-friendly code used in the student link (e.g. /attend/A7X9QK)
    shortCode: { type: String, required: true, unique: true, index: true },

    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    open: { type: Boolean, default: true },

    presentStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
