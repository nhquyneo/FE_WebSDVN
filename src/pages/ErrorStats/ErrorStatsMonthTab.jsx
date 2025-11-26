import React, { useEffect, useState } from "react";
import { linename, getMachinesByLine, getErrorEventsMonth } from "../../api";

const overlayStyles = {
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",   // ⬅️ thay vì "center"
    paddingTop: "200px",        // ⬅️ đẩy box xuống 100px
    zIndex: 20,
  },
  box: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 18px",
    borderRadius: 12,
    background: "#111827",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
    fontFamily:
      '"Bai Jamjuree", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2.5px solid rgba(255,255,255,0.85)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    display: "block",
    animation: "spin 0.7s linear infinite",
  },
};

export default function ErrorStatsMonthTab() {
  const [lines, setLines] = useState([]);
  const [machines, setMachines] = useState([]);

  const [lineId, setLineId] = useState(""); // idline
  const [machineId, setMachineId] = useState("All"); // id máy hoặc "All"

  const now = new Date();
  const [month, setMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  );

  const [data, setData] = useState([]); // dữ liệu thật
  const [loading, setLoading] = useState(false);

  // Load LINE lần đầu
  useEffect(() => {
    async function loadLines() {
      try {
        const result = await linename(); // [{ idline, ten_line }]
        setLines(result || []);
        if (result && result.length > 0) {
          setLineId(result[0].idline);
        }
      } catch (err) {
        console.error("Lỗi load lines (month):", err);
      }
    }
    loadLines();
  }, []);

  // Khi đổi line → load machine
  useEffect(() => {
    if (!lineId) return;

    async function loadMachines() {
      try {
        const result = await getMachinesByLine(lineId);
        const mapped =
          result?.map((m) => ({
            id: m.idmay ?? m.id,
            name: m.ten_may ?? m.name,
          })) || [];
        setMachines(mapped);
        setMachineId("All");
      } catch (err) {
        console.error("Lỗi load machines (month):", err);
      }
    }
    loadMachines();
  }, [lineId]);

  // Gọi BE lấy thống kê theo tháng
  const loadData = async () => {
    if (!lineId || !month) return;

    setLoading(true);
    try {
      const machineParam = machineId === "All" ? null : machineId;

      const result = await getErrorEventsMonth(month, lineId, machineParam);

      console.log("RESULT month:", result);
      setData(result || []);
    } catch (err) {
      console.error("Lỗi load error events month:", err);
      setData([]);
    }
    setLoading(false);
  };

  // Tự load khi đổi line / machine / month
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId, machineId, month]);

  return (
    <div
      className="error-day-wrapper"
      style={{ position: "relative" }} // để overlay phủ đúng vùng
    >
      {/* Overlay loading */}
      {loading && (
        <div style={overlayStyles.overlay}>
          <div style={overlayStyles.box}>
            <span style={overlayStyles.spinner} />
            Đang tải dữ liệu...
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="error-filter-bar">
        {/* LINE */}
        <div className="filter-group">
          <label>LINE:</label>
          <select
            className="filter-select"
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
          >
            {lines.map((l) => (
              <option key={l.idline} value={l.idline}>
                {l.ten_line}
              </option>
            ))}
          </select>
        </div>

        {/* MACHINE */}
        <div className="filter-group">
          <label>MACHINE:</label>
          <select
            className="filter-select"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
          >
            <option value="All">All</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* MONTH */}
        <div className="filter-group">
          <label>MONTH:</label>
          <select
            className="filter-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const value = String(i + 1).padStart(2, "0");
              return (
                <option key={value} value={value}>
                  {i + 1}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="error-table-container">
        <table className="error-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Machine Name</th>
              <th style={{ textAlign: "left" }}>Start Time</th>
              <th style={{ textAlign: "left" }}>End Time</th>
              <th style={{ textAlign: "left" }}>Alarm No</th>
              <th style={{ textAlign: "left" }}>Count</th>
              <th style={{ textAlign: "left" }}>Message</th>
              <th style={{ textAlign: "left" }}>Recovery Time</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 12 }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={
                    row.id ??
                    `month-row-${idx}-${
                      row.machine_name || row.machineName || ""
                    }-${row.alarm_no || row.errorCode || ""}`
                  }
                >
                  <td>{row.machine_name ?? row.machineName}</td>
                  <td>{row.start_time ?? row.firstErrorStart}</td>
                  <td>{row.end_time ?? row.lastErrorEnd}</td>
                  <td>{row.alarm_no ?? row.errorCode}</td>
                  <td style={{ textAlign: "left" }}>
                    {row.count ?? row.errorCount}
                  </td>
                  <td>{row.message ?? row.errorName}</td>
                  <td>{row.recovery_time ?? row.totalErrorDuration}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
