import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import Analytics from "./pages/Analytics";
import { StudentHome, StudentAttend } from "./pages/StudentAttend";

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

function Protected({ role, children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
        <Route path="/teacher" element={<Protected role="teacher"><TeacherDashboard /></Protected>} />
        <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
        <Route path="/student" element={<Protected role="student"><StudentHome /></Protected>} />
        {/* attend link opened on phone; requires student login */}
        <Route path="/attend/:shortCode" element={<Protected role="student"><StudentAttend /></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}
