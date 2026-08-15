import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [collegeId, setCollegeId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function submit() {
    setErr("");
    try {
      const { data } = await api.post("/auth/login", { collegeId, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "admin") nav("/admin");
      else if (data.user.role === "teacher") nav("/teacher");
      else nav("/student");
    } catch (e) {
      setErr(e.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 360, margin: "60px auto" }}>
      <h2>Smart Attendance</h2>
      <p className="muted">Log in with your college ID</p>
      <input
        className="input"
        placeholder="College ID"
        value={collegeId}
        onChange={(e) => setCollegeId(e.target.value)}
      />
      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {err && <p style={{ color: "#b00" }}>{err}</p>}
      <button className="btn" onClick={submit}>
        Log in
      </button>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        Demo: ADMIN01 / TCH01 / S001 — password123
      </p>
    </div>
  );
}
