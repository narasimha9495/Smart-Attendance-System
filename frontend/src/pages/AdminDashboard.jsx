import { useEffect, useState } from "react";
import api from "../api";
import { logout } from "../App";

export default function AdminDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [users, setUsers] = useState([]);

  async function load() {
    const [tt, us] = await Promise.all([
      api.get("/admin/timetable"),
      api.get("/admin/users"),
    ]);
    setTimetable(tt.data.entries);
    setUsers(us.data.users);
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="wrap">
      <header className="topbar">
        <h2>Admin</h2>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </header>

      <div className="card">
        <h3>Timetable</h3>
        <table className="table">
          <thead>
            <tr><th>Subject</th><th>Section</th><th>Room</th><th>Day</th><th>Time</th><th>Teacher</th></tr>
          </thead>
          <tbody>
            {timetable.map((e) => (
              <tr key={e._id}>
                <td>{e.subject}</td><td>{e.section}</td><td>{e.room}</td>
                <td>{e.day}</td><td>{e.startTime}-{e.endTime}</td>
                <td>{e.teacher?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Users</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>College ID</th><th>Role</th><th>Section</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td><td>{u.collegeId}</td><td>{u.role}</td><td>{u.section || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
