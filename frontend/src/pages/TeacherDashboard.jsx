import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "react-router-dom";
import api, { API_URL } from "../api";
import { logout } from "../App";

export default function TeacherDashboard() {
  const [scheduled, setScheduled] = useState(null);
  const [session, setSession] = useState(null);
  const [code, setCode] = useState("------");
  const [present, setPresent] = useState([]);
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState(false); // once true, stop the QR/code
  const socketRef = useRef(null);

  useEffect(() => {
    api.get("/teacher/current-session").then(({ data }) => setScheduled(data.scheduled));
  }, []);

  // rotating code refresh + live socket. Stops when saved.
  useEffect(() => {
    if (!session || saved) return;

    const codeTimer = setInterval(async () => {
      try {
        const { data } = await api.get(`/teacher/session/${session.sessionId}/code`);
        setCode(data.code);
      } catch {
        /* session closed/expired - ignore */
      }
    }, 2000);

    const socket = io(API_URL);
    socketRef.current = socket;
    socket.emit("join_session", session.sessionId);
    socket.on("student_marked", (s) =>
      setPresent((p) => (p.some((x) => x.rollNo === s.rollNo) ? p : [...p, s]))
    );

    return () => {
      clearInterval(codeTimer);
      socket.disconnect();
    };
  }, [session, saved]);

  async function startSession() {
    const { data } = await api.post("/teacher/session/start", {
      timetableId: scheduled._id,
    });
    setSession(data);
    setSaved(false);
  }

  async function save() {
    const { data } = await api.post(`/teacher/session/${session.sessionId}/save`);
    setSaved(true); // stops polling + hides the QR card
    setMsg(
      `Saved. Present ${data.present}/${data.total}. Parent alerts queued: ${data.alertsQueued}.`
    );
    // disconnect the live socket too
    if (socketRef.current) socketRef.current.disconnect();
  }

  function downloadExcel() {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/teacher/session/${session.sessionId}/excel`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((b) => {
        const url = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = url;
        a.download = "attendance.xlsx";
        a.click();
      });
  }

  const studentLink = session
    ? `${window.location.origin}/attend/${session.shortCode}`
    : "";

  return (
    <div className="wrap">
      <header className="topbar">
        <h2>Teacher</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn ghost" to="/analytics">Analytics</Link>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      {!scheduled && (
        <div className="card"><p>No class scheduled for you right now.</p></div>
      )}

      {scheduled && !session && (
        <div className="card">
          <h3>{scheduled.subject} — {scheduled.section}</h3>
          <p className="muted">{scheduled.room} · {scheduled.startTime}-{scheduled.endTime}</p>
          <button className="btn" onClick={startSession}>Start attendance</button>
        </div>
      )}

      {session && (
        <>
          {/* QR / rotating code card - hidden once saved */}
          {!saved && (
            <div className="card" style={{ textAlign: "center" }}>
              <h3>{session.subject} — {session.section}</h3>
              <p className="muted">Show this to the class — students scan it (it changes every few seconds)</p>
              <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
                <QRCodeCanvas value={code} size={180} includeMargin />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 5 }}>{code}</div>
              <p className="muted" style={{ fontSize: 11 }}>(students can also type this code)</p>
              <p className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>
                Student link: {studentLink}
              </p>
            </div>
          )}

          <div className="card">
            <h3>Present ({present.length})</h3>
            <ul>
              {present.map((s, i) => (
                <li key={i}>{s.rollNo} — {s.name}</li>
              ))}
            </ul>
            {!saved ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={save}>Save & alert parents</button>
                <button className="btn ghost" onClick={downloadExcel}>Download Excel</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn ghost" onClick={downloadExcel}>Download Excel</button>
              </div>
            )}
            {msg && <p style={{ color: "#0a0", marginTop: 10 }}>{msg}</p>}
            {saved && (
              <p className="muted" style={{ marginTop: 6 }}>
                Session closed. Attendance is locked.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
