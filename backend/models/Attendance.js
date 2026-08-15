const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: String,
    section: String,
    date: String, // "2026-08-14"
    status: { type: String, enum: ["present", "absent"], required: true },
    markedAt: { type: Date },
    method: { type: String, default: "face+geo" },
  },
  { timestamps: true }
);

attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
