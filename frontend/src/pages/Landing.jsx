import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const features = [
  ["Proxy-proof", "Face + liveness + in-room code together — no photos, no link-sharing."],
  ["No hardware", "Runs on any phone browser. No fingerprint scanners or RFID."],
  ["Timetable-locked", "Teachers can only open the class they're scheduled to teach."],
  ["Live dashboard", "Watch students mark in real time over WebSockets."],
  ["Parent alerts", "Absent students' parents get a WhatsApp message on save."],
  ["Excel reports", "One-click export and automatic 75%-rule tracking."],
];

export default function Landing() {
  const nav = useNavigate();
  const [online, setOnline] = useState(null);

  useEffect(() => {
    api
      .get("/health")
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <span className="pill">MERN · Face Recognition · Geofencing</span>

          <div style={{ marginTop: 10, fontSize: 13, color: "#d7deee" }}>
            <span
              style={{
                display: "inline-block",
                width: 9,
                height: 9,
                borderRadius: "50%",
                marginRight: 6,
                background:
                  online === null ? "#f0ad4e" : online ? "#3ddc84" : "#e05353",
              }}
            />
            {online === null ? "Checking..." : online ? "System online" : "Backend offline"}
          </div>

          <h1>Attendance that can't be faked.</h1>
          <p>
            A proxy-proof attendance platform. A student is marked present only when
            their college login, live face scan, liveness check, and physical presence
            in the classroom all pass at once.
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
          <li>Opens the teacher's link on their phone and logs in with their college ID.</li>
          <li>Scans their face — a blink check proves it's a live person, not a photo.</li>
          <li>Scans the rotating code shown in the classroom (GPS backs it up).</li>
          <li>All layers pass → marked present, live on the teacher's dashboard.</li>
        </ol>
      </section>

      <footer className="landing-footer">
        Built with React · Node.js · MongoDB · face-api.js · Socket.io · Twilio
      </footer>
    </div>
  );
}