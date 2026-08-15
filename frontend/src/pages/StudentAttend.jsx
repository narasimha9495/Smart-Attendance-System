import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../api";
import FaceCapture from "../components/FaceCapture";
import QrScanner from "../components/QrScanner";
import { logout } from "../App";

// Simple per-browser device id for device binding
function deviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2);
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// Student home: enroll face
export function StudentHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [msg, setMsg] = useState("");

  async function enroll({ embedding }) {
    try {
      await api.post("/student/enroll-face", { embedding, deviceId: deviceId() });
      setMsg("Face enrolled. You can now mark attendance from your class link.");
    } catch (e) {
      setMsg(e.response?.data?.error || "Enrollment failed");
    }
  }

  return (
    <div className="wrap">
      <header className="topbar">
        <h2>Hi, {user.name}</h2>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </header>
      <div className="card">
        <h3>Enroll your face (one time)</h3>
        <p className="muted">This is stored as a numeric embedding, not a photo.</p>
        <FaceCapture mode="enroll" onResult={enroll} />
        {msg && <p style={{ color: "#0a0" }}>{msg}</p>}
      </div>
      <div className="card">
        <p className="muted">
          To mark attendance, open the link your teacher shares in class.
        </p>
      </div>
    </div>
  );
}

// Attend flow: /attend/:shortCode
export function StudentAttend() {
  const { shortCode } = useParams();
  const [searchParams] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState("");
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [step, setStep] = useState("face"); // face -> code -> done
  const [face, setFace] = useState(null);
  const [pos, setPos] = useState(null);
  const [result, setResult] = useState("");

  useEffect(() => {
    api
      .get(`/student/session/${shortCode}`)
      .then(({ data }) => setInfo(data))
      .catch((e) => setErr(e.response?.data?.error || "Invalid link"));
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setPos(null),
      { enableHighAccuracy: true }
    );
  }, [shortCode]);

  function onFace(r) {
    setFace(r);
    if (r.livenessPassed) setStep("code");
  }

  async function submit() {
    try {
      const { data } = await api.post("/student/mark", {
        shortCode,
        embedding: face.embedding,
        livenessPassed: face.livenessPassed,
        roomCode: code,
        lat: pos?.lat,
        lng: pos?.lng,
        deviceId: deviceId(),
      });
      if (data.marked) {
        setStep("done");
        setResult(data.message || "Attendance marked. You're present!");
      }
    } catch (e) {
      setErr(e.response?.data?.error || "Could not mark attendance");
    }
  }

  if (err) return <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}><p style={{ color: "#b00" }}>{err}</p></div>;
  if (!info) return <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>Loading...</div>;

  return (
    <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h3>{info.subject} — {info.section}</h3>
      <p className="muted">{info.room}</p>

      {step === "face" && (
        <>
          <p>Step 1: Scan your face (blink when asked)</p>
          <FaceCapture mode="verify" onResult={onFace} />
        </>
      )}

      {step === "code" && (
        <>
          <p>Step 2: Scan the classroom QR (or type the code)</p>
          <QrScanner onScan={(v) => setCode(v)} />
          <input
            className="input"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <p className="muted" style={{ fontSize: 12 }}>
            {pos ? "Location detected" : "Location not available (GPS is a backup check)"}
          </p>
          <button className="btn" onClick={submit}>Mark attendance</button>
        </>
      )}

      {step === "done" && <p style={{ color: "#0a0", fontWeight: 600 }}>{result}</p>}
    </div>
  );
}