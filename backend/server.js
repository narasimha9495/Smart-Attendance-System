require("dotenv").config();
const checkEnv = require("./config/checkEnv");
checkEnv();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { apiLimiter, authLimiter, markLimiter } = require("./middleware/rateLimit");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const io = new Server(server, { cors: { origin: true } });

// --- security middleware ---
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));
app.use(mongoSanitize()); // strips $ and . from keys -> blocks NoSQL injection
app.use("/api", apiLimiter);

app.set("io", io);

// --- routes (stricter limiters on sensitive ones) ---
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/teacher", require("./routes/teacher"));
app.use("/api/student", markLimiter, require("./routes/student")(io));
app.use("/api/analytics", require("./routes/analytics"));

app.get("/", (_req, res) => res.json({ ok: true, service: "smart-attendance-api" }));
app.get("/api/health", (_req, res) => res.json({ status: "up", time: new Date() }));

// --- 404 ---
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// --- central error handler ---
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  if (err.type === "entity.too.large")
    return res.status(413).json({ error: "Payload too large" });
  res.status(500).json({ error: "Server error" });
});

io.on("connection", (socket) => {
  socket.on("join_session", (sessionId) => socket.join(`session_${sessionId}`));
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
