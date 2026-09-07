import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const features = [
  ["Proxy-proof", "Face, liveness and an in-room code together — no photos, no link-sharing."],
  ["No hardware", "Runs in any phone browser. No fingerprint scanners or RFID readers."],
  ["Timetable-locked", "Teachers can only open the class they're scheduled to teach."],
  ["Live dashboard", "Watch students mark in, in real time, over WebSockets."],
  ["Parent alerts", "Absent students' parents get a WhatsApp message on save."],
  ["Excel reports", "One-click export and automatic 75%-rule tracking."],
];

const steps = [
  "Open the teacher's link on your phone and log in with your college ID.",
  "Scan your face — a blink check proves it's a live person, not a photo.",
  "Scan the rotating code shown in the classroom (GPS backs it up).",
  "All layers pass, and you're marked present live on the teacher's dashboard.",
];

export default function Landing() {
  const nav = useNavigate();
  const [online, setOnline] = useState(null);

  useEffect(() => {
    api.get("/health").then(() => setOnline(true)).catch(() => setOnline(false));
  }, []);

  const dotColor = online === null ? "#d1a300" : online ? "#16a34a" : "#dc2626";
  const statusText =
    online === null ? "Checking system..." : online ? "System online" : "Backend offline";

  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <span className="pill">MERN · Face Recognition · Geofencing</span>
          <div className="status">
            <span className="status-dot" style={{ background: dotColor }} />
            {statusText}
          </div>
          <h1>Attendance that can't be faked.</h1>
          <p className="hero-sub">
            A student is marked present only when their college login, live face scan,
            liveness check and physical presence in the classroom all pass at once.
          </p>
          <div className="hero-actions">
            <button className="btn" onClick={() => nav("/login")}>Get started</button>
            <a
              className="btn ghost"
              href="https://github.com/narasimha9495/Smart-Attendance-System"
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="features">
        {features.map(([t, d]) => (
          <div className="feature" key={t}>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>

      <section className="how">
        <h2>How a student marks attendance</h2>
        <ol>
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <footer className="landing-footer">
        Built with React · Node.js · MongoDB · face-api.js · Socket.io · Twilio
      </footer>
    </div>
  );
}