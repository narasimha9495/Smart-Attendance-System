const XLSX = require("xlsx");

// Build a per-session attendance sheet as an .xlsx buffer.
// rows: [{ rollNo, name, subject, section, date, status, markedAt }]
function buildSessionWorkbook(rows, meta) {
  const header = [
    "Roll No",
    "Name",
    "Subject",
    "Section",
    "Date",
    "Status",
    "Marked At",
  ];
  const data = rows.map((r) => [
    r.rollNo || "",
    r.name || "",
    r.subject || "",
    r.section || "",
    r.date || "",
    r.status || "",
    r.markedAt ? new Date(r.markedAt).toLocaleString() : "",
  ]);

  const present = rows.filter((r) => r.status === "present").length;
  const total = rows.length;
  const summary = [
    [],
    [`Present: ${present} / ${total}`],
    [`Percentage: ${total ? Math.round((present / total) * 100) : 0}%`],
  ];

  const ws = XLSX.utils.aoa_to_sheet([header, ...data, ...summary]);
  ws["!cols"] = header.map(() => ({ wch: 16 }));

  const wb = XLSX.utils.book_new();
  const sheetName = (meta && meta.subject ? meta.subject : "Attendance").slice(0, 28);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

module.exports = { buildSessionWorkbook };
