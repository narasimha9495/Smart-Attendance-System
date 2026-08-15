const mongoose = require("mongoose");

// One row = one scheduled class. A teacher can only open a session
// that matches a timetable entry for the current day and time.
const timetableSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    section: { type: String, required: true },
    room: { type: String, required: true },

    // day: 0=Sunday ... 6=Saturday
    day: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true }, // "10:00"
    endTime: { type: String, required: true }, // "10:50"

    // geofence for the room
    roomLat: { type: Number, required: true },
    roomLng: { type: Number, required: true },
    radius: { type: Number, default: 30 }, // meters
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
