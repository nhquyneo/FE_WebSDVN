// src/pages/LinePage.js
import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import "./MachinePage.css";        // dùng luôn style máy
import "../Page/HomePage.css";

import LineDayPage from "../components/LineDayPage";
import LineMonthPage from "../components/LineMonthPage";
import LineYearPage from "../components/LineYearPage";
import SideNav from "../Page/SideNav";

import { linename } from "../api";

const API_BASE = "http://127.0.0.1:5000";

export default function LinePage() {
  const location = useLocation();
  const { lineId: paramLineId } = useParams();
  const navigate = useNavigate();

  const [lines, setLines] = useState([]);

  const logout = () => {
    navigate("/", { replace: true });
  };

  const normalizeLines = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      idline: row.idline ?? row.LineID,
      ten_line: row.ten_line ?? row.LineName,
    }));
  };

  useEffect(() => {
    async function loadLines() {
      try {
        const data = await linename();
        const normalized = normalizeLines(data);
        setLines(normalized);
      } catch (err) {
        console.error("Lỗi tải line (LinePage):", err);
      }
    }

    loadLines();
  }, []);

  const handleSelectMachineFromSideNav = (machine) => {
    // nếu click máy từ SideNav → chuyển sang MachinePage
    navigate(`/machine/${machine.id}`, { state: { machine } });
  };

  // ========= LOGIC LINE =========
  const lineFromState = location.state?.line || null;

  const resolvedLineId = lineFromState?.idline ?? paramLineId ?? null;
  const resolvedLineName =
    lineFromState?.ten_line ??
    (resolvedLineId ? `Line ${resolvedLineId}` : "Không có line");

  const [activeTab, setActiveTab] = useState("day");

  const [dayFilter, setDayFilter] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [monthFilter, setMonthFilter] = useState(
    (new Date().getUTCMonth() + 1).toString()
  );
  const [yearFilter, setYearFilter] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMetric, setSelectedMetric] = useState("ALL");

  const line = resolvedLineId
    ? { id: resolvedLineId, name: resolvedLineName }
    : null;

  async function handleExportYear() {
    if (!line || !yearFilter) {
      alert("Chưa chọn line hoặc năm");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("year", yearFilter);
      if (selectedMetric) {
        params.set("data", selectedMetric);
      }

      const url = `${API_BASE}/api/lines/${line.id}/year-export?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        const txt = await res.text();
        console.error("Export year line fail:", res.status, txt);
        alert("Không xuất được file Excel năm (line)");
        return;
      }

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${line.name}_${yearFilter}_line.xlsx`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error("Export year line error:", err);
      alert("Không xuất được file Excel năm (line)");
    }
  }

  async function handleExportMonth() {
    if (!line || !monthFilter) {
      alert("Chưa chọn line hoặc tháng");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("month", monthFilter);
      if (selectedMetric) {
        params.set("data", selectedMetric);
      }

      const url = `${API_BASE}/api/lines/${line.id}/month-export?${params.toString()}`;

      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${line.name}_${monthFilter}_line.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export month line excel lỗi:", err);
      alert("Không xuất được file Excel tháng (line).");
    }
  }

  const tabCaption =
    activeTab === "day"
      ? "Theo ngày"
      : activeTab === "month"
      ? "Theo tháng"
      : "Theo năm";

  return (
    <div className="container">
      <SideNav
        lines={lines}
        onSelectMachine={handleSelectMachineFromSideNav}
        onLogout={logout}
      />

      <main className="main">
        <div className="content-container machine-page-container">
          <div className="machine-page">
            {/* HEADER */}
            <div className="machine-page-header">
              <div className="machine-page-header-left">
                <div>
                  <h2 className="machine-page-title">{resolvedLineName}</h2>
                  <div className="machine-page-subtitle">
                    Tổng hợp OEE / Output / Activity cho toàn bộ máy trong line
                    theo ngày, tháng, năm
                  </div>

                  {line && (
                    <div className="machine-page-meta">
                      <span className="machine-chip">
                        ID line: <strong>{line.id}</strong>
                      </span>
                      <span className="machine-chip">
                        Chế độ hiển thị: <strong>{tabCaption}</strong>
                      </span>
                      <span className="machine-chip">
                        Ngày xem: <strong>{dayFilter}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="machine-page-header-right">
                <span className="machine-status-pill">LINE OEE</span>
              </div>
            </div>

            <div className="machine-page-content">
              {!line ? (
                <div className="machine-page-empty">
                  Không có thông tin line. Vui lòng chọn line từ menu bên trái.
                </div>
              ) : (
                <>
                  {/* Topbar gồm Tabs + toolbar */}
                  <div className="machine-page-topbar">
                    <div className="popup-tabs">
                      <div className="machine-tab-list">
                        <button
                          className={`popup-tab-btn ${
                            activeTab === "day" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("day")}
                        >
                          Ngày
                        </button>
                        <button
                          className={`popup-tab-btn ${
                            activeTab === "month" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("month")}
                        >
                          Tháng
                        </button>
                        <button
                          className={`popup-tab-btn ${
                            activeTab === "year" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("year")}
                        >
                          Năm
                        </button>
                      </div>

                      <div className="machine-tab-caption">
                        {tabCaption.toUpperCase()}
                      </div>
                    </div>

                    {/* DAY toolbar */}
                    {activeTab === "day" && (
                      <div className="toolbar-row">
                        <div className="toolbar-group">
                          <span className="toolbar-label">DAY:</span>
                          <input
                            type="date"
                            className="toolbar-select"
                            value={dayFilter}
                            onChange={(e) => setDayFilter(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* MONTH toolbar */}
                    {activeTab === "month" && (
                      <div className="toolbar-row">
                        <div className="toolbar-group">
                          <span className="toolbar-label">MONTH:</span>
                          <select
                            className="toolbar-select"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="toolbar-group">
                          <span className="toolbar-label">DATA:</span>
                          <select
                            className="toolbar-select"
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                          >
                            <option value="ALL">All</option>
                            <option value="OEE RATIO">OEE Ratio</option>
                            <option value="OK PRODUCT RATIO">
                              OK Product ratio
                            </option>
                            <option value="OUTPUT RATIO">Output Ratio</option>
                            <option value="ACTIVITY RATIO">
                              Activity Ratio
                            </option>
                          </select>
                        </div>

                        <div className="toolbar-actions">
                          <button
                            className="toolbar-btn export"
                            onClick={handleExportMonth}
                          >
                            Export Excel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* YEAR toolbar */}
                    {activeTab === "year" && (
                      <div className="toolbar-row">
                        <div className="toolbar-group">
                          <span className="toolbar-label">YEAR:</span>
                          <select
                            className="toolbar-select"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                          >
                            {Array.from({ length: 8 }).map((_, idx) => {
                              const y = 2022 + idx;
                              return (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="toolbar-group">
                          <span className="toolbar-label">DATA:</span>
                          <select
                            className="toolbar-select"
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                          >
                            <option value="ALL">All</option>
                            <option value="OEE RATIO">OEE Ratio</option>
                            <option value="OK PRODUCT RATIO">
                              OK Product ratio
                            </option>
                            <option value="OUTPUT RATIO">Output Ratio</option>
                            <option value="ACTIVITY RATIO">
                              Activity Ratio
                            </option>
                          </select>
                        </div>

                        <div className="toolbar-actions">
                          <button
                            className="toolbar-btn export"
                            onClick={handleExportYear}
                          >
                            Export Excel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nội dung theo tab */}
                  <div className="popup-content-box">
                    {activeTab === "day" && (
                      <LineDayPage line={line} day={dayFilter} />
                    )}
                    {activeTab === "month" && (
                      <LineMonthPage
                        line={line}
                        month={Number(monthFilter)}
                        dataType={selectedMetric}
                      />
                    )}
                    {activeTab === "year" && (
                      <LineYearPage
                        line={line}
                        year={yearFilter}
                        dataType={selectedMetric}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
