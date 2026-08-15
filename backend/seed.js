require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Timetable = require("./models/Timetable");
const Session = require("./models/Session");
const Attendance = require("./models/Attendance");

async function run() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Timetable.deleteMany({}),
    Session.deleteMany({}),
    Attendance.deleteMany({}),
  ]);

  const hash = await bcrypt.hash("password123", 10);

  const admin = await User.create({
    name: "Admin",
    collegeId: "ADMIN01",
    role: "admin",
    passwordHash: hash,
  });

  const teacher = await User.create({
    name: "Prof. Rao",
    collegeId: "TCH01",
    role: "teacher",
    passwordHash: hash,
  });

  const students = await User.insertMany([
    {
      name: "Asha",
      collegeId: "S001",
      role: "student",
      passwordHash: hash,
      rollNo: "01",
      section: "CSE-B",
      parentPhone: "+910000000001",
    },
    {
      name: "Vikram",
      collegeId: "S002",
      role: "student",
      passwordHash: hash,
      rollNo: "02",
      section: "CSE-B",
      parentPhone: "+910000000002",
    },
    {
      name: "Meera",
      collegeId: "S003",
      role: "student",
      passwordHash: hash,
      rollNo: "03",
      section: "CSE-B",
      parentPhone: "+910000000003",
    },
  ]);

  // A class scheduled to be active RIGHT NOW so you can test immediately.
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${pad(now.getHours())}:${pad(Math.max(0, now.getMinutes() - 1))}`;
  const endH = now.getMinutes() + 59 >= 60 ? now.getHours() + 1 : now.getHours();
  const endM = (now.getMinutes() + 59) % 60;
  const end = `${pad(endH % 24)}:${pad(endM)}`;

  await Timetable.create({
    teacher: teacher._id,
    subject: "DBMS",
    section: "CSE-B",
    room: "Room 301",
    day: now.getDay(),
    startTime: start,
    endTime: end,
    // demo geofence centre (set to your classroom's real lat/lng later)
    roomLat: 17.385,
    roomLng: 78.4867,
    radius: 50,
  });

  console.log("Seeded.");
  console.log("Login credentials (password = password123):");
  console.log("  Admin   -> ADMIN01");
  console.log("  Teacher -> TCH01");
  console.log("  Students-> S001, S002, S003 (section CSE-B)");
  console.log(`Active class 'DBMS' scheduled ${start}-${end} today.`);
  process.exit(0);
}

run();
