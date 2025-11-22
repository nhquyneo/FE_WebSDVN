import React, { useEffect, useState } from "react";
import { linename } from "../../api";  // chỉnh path theo project
import "./OverviewPage.css";
import LineChartKPI from "./LineChartKPI";
export default function OverviewPage() {
  // Lấy thời gian hiện tại làm mặc định
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dataset, setDataset] = useState("all");

  const [lines, setLines] = useState([]);
  const API_BASE = "http://127.0.0.1:5000";
  // Hàm lấy tên line từ API (tự xử lý nhiều kiểu key khác nhau)
  const getLineName = (line, index) => {
    return (
      line?.name ||
      line?.LineName ||
      line?.line_name ||
      line?.line ||
      line?.ten_line ||
      `Line ${index + 1}`
    );
  };

  // Load danh sách line từ API có sẵn
  useEffect(() => {
    async function loadLines() {
      try {
        const data = await linename();
        setLines(data);
      } catch (error) {
        console.error("Error loading line list:", error);
      }
    }
    loadLines();
  }, []);

  return (
    <div className="dashboard-card">
      <h2 className="dashboard-title">TỔNG QUAN NHÀ MÁY</h2>

      {/* FILTER BAR - CÓ SELECT THÁNG + NĂM */}
      <div className="overview-filters">

        {/* MONTH */}
        <div className="filter-group">
          <label className="filter-label">MONTH:</label>
          <select
            className="filter-select"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        {/* YEAR */}
        <div className="filter-group">
          <label className="filter-label">YEAR:</label>
          <select
            className="filter-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            <option value={year - 1}>{year - 1}</option>
            <option value={year}>{year}</option>
            <option value={year + 1}>{year + 1}</option>
          </select>
        </div>

        {/* DATASET */}
        <div className="filter-group">
          <label className="filter-label">DATA:</label>
          <select
            className="filter-select"
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
          >
            <option value="all">All</option>
            <option value="oee">OEE Ratio</option>
            <option value="ok">OK Product Ratio</option>
            <option value="output">Output Ratio</option>
            <option value="activity">Activity Ratio</option>
          </select>
        </div>

        {/* BUTTONS */}
        <div className="filter-actions">
          {/* <button className="btn-apply">Apply</button> */}
          <button className="btn-apply" 
             onClick={() => {
                const url = `${API_BASE}/api/export-kpi?month=${month}&year=${year}&data=${dataset}`;
                window.open(url, "_blank"); // gọi thô -> trình duyệt tải file
              }}
          > Excel
          </button>
        </div>
      </div>

      {/* GRID CHARTS */}
      <div className="charts-grid">
        {lines.map((line, index) => {
          const displayName = getLineName(line, index);

          return (
            <div key={line.id ?? index} className="chart-card">
              <div className="chart-title">{displayName}</div>

              <div className="chart-box">
                <LineChartKPI
                    lineName={displayName}
                    month={month}
                    year={year}
                    dataset={dataset}
                />
</div>
            </div>
          );
        })}

        {lines.length === 0 && (
          <div className="chart-empty">Đang tải danh sách line...</div>
        )}
      </div>
    </div>
  );
}
