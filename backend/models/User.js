const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    collegeId: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },
    passwordHash: { type: String, required: true },
    email: { type: String },

    // student-only fields
    rollNo: { type: String },
    section: { type: String },
    parentPhone: { type: String },
    // 128-dimensional face embedding captured at enrollment
    faceEmbedding: { type: [Number], default: null },
    // device binding: the one device this student is allowed to mark from
    deviceId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
