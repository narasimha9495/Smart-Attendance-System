import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import api from "../api";
import { logout } from "../App";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [section, setSection] = useState("CSE-B");

  async function load() {
    const { data } = await api.get(`/analytics/summary?section=${encodeURIComponent(section)}`);
    setData(data);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="wrap">
      <header className="topbar">
        <h2>Attendance Analytics</h2>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </header>

      <div className="card">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input className="input" style={{ maxWidth: 160 }} value={section}
            onChange={(e) => setSection(e.target.value)} placeholder="Section" />
          <button className="btn" onClick={load}>Load</button>
        </div>
      </div>

      {data && (
        <>
          <div className="stat-row">
            <div className="stat"><div className="stat-num">{data.classAverage}%</div><div className="muted">Class average</div></div>
            <div className="stat"><div className="stat-num">{data.totalStudents}</div><div className="muted">Students</div></div>
            <div className="stat"><div className="stat-num" style={{ color: "#b00" }}>{data.defaulters.length}</div><div className="muted">Below 75%</div></div>
          </div>

          <div className="card">
            <h3>Attendance % per student</h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={data.students.map((s) => ({ name: s.rollNo || s.name, pct: s.percentage }))}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip />
                  <ReferenceLine y={75} stroke="#b00" strokeDasharray="4 4" label="75%" />
                  <Bar dataKey="pct">
                    {data.students.map((s, i) => (
                      <Cell key={i} fill={s.percentage < 75 ? "#e05353" : "#1e2f56"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3>Defaulters (below 75%)</h3>
            {data.defaulters.length === 0 ? (
              <p className="muted">None 🎉</p>
            ) : (
              <table className="table">
                <thead><tr><th>Roll</th><th>Name</th><th>Present/Total</th><th>%</th></tr></thead>
                <tbody>
                  {data.defaulters.map((d, i) => (
                    <tr key={i}>
                      <td>{d.rollNo}</td><td>{d.name}</td>
                      <td>{d.present}/{d.total}</td>
                      <td style={{ color: "#b00", fontWeight: 600 }}>{d.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
