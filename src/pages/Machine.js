// src/pages/Machine.js
import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import "./MachinePage.css"; // style riêng cho trang
import "../Page/HomePage.css"; // dùng lại layout chung (container, sidebar, main, user-strip...)

import MachineDayPage from "../components/MachineDayPage";
import MachineMonthPage from "../components/MachineMonthPage";
import MachineYearPage from "../components/MachineYearPage";
import SideNav from "../Page/SideNav";

import { linename } from "../api";

const API_BASE = "http://127.0.0.1:5000";

export default function MachinePage() {
  const location = useLocation();
  const { machineId: paramMachineId } = useParams();
  const navigate = useNavigate();

  // ========= SIDENAV / LAYOUT =========
  const [lines, setLines] = useState([]);


  const logout = () => {
    // clear token nếu có
    // localStorage.removeItem("token");
    // localStorage.removeItem("user");
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
        console.error("Lỗi tải line (MachinePage):", err);
      }
    }

    loadLines();
  }, []);

  const handleSelectMachineFromSideNav = (machine) => {
    navigate(`/machine/${machine.id}`, {
      state: { machine },
    });
  };

  // ========= LOGIC MÁY =========
  // Lấy machine từ state (navigate từ SideNav / HomePage) nếu có
  const machineFromState = location.state?.machine || null;

  const resolvedMachineId = machineFromState?.id ?? paramMachineId ?? null;
  const resolvedMachineName =
    machineFromState?.name ??
    (resolvedMachineId ? `Machine ${resolvedMachineId}` : "Không có máy");

  const [activeTab, setActiveTab] = useState("day");

  const [dayFilter, setDayFilter] = useState(
    new Date().toISOString().slice(0, 10) // yyyy-MM-dd
  );
  const [monthFilter, setMonthFilter] = useState(
    (new Date().getUTCMonth() + 1).toString()
  );
  const [yearFilter, setYearFilter] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMetric, setSelectedMetric] = useState("ALL");

  const machine = resolvedMachineId
    ? { id: resolvedMachineId, name: resolvedMachineName }
    : null;

  async function handleExportYear() {
    if (!machine || !yearFilter) {
      alert("Chưa chọn máy hoặc năm");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("year", yearFilter);
      if (selectedMetric) {
        params.set("data", selectedMetric);
      }

      const url = `${API_BASE}/api/machines/${machine.id}/year-export?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        const txt = await res.text();
        console.error("Export year fail:", res.status, txt);
        alert("Không xuất được file Excel năm");
        return;
      }

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${machine.name}_${yearFilter}.xlsx`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error("Export year error:", err);
      alert("Không xuất được file Excel năm");
    }
  }

  async function handleExportMonth() {
    if (!machine || !monthFilter) {
      alert("Chưa chọn máy hoặc tháng");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("month", monthFilter);
      if (selectedMetric) {
        params.set("data", selectedMetric);
      }

      const url = `${API_BASE}/api/machines/${machine.id}/month-export?${params.toString()}`;

      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${machine.name}_${monthFilter}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export month excel lỗi:", err);
      alert("Không xuất được file Excel tháng.");
    }
  }

  return (
    <div className="container">
      {/* SIDENAV giống HomePage */}
      <SideNav
        lines={lines}
        onSelectMachine={handleSelectMachineFromSideNav}
        onLogout={logout}
      />

      {/* MAIN CONTENT giống HomePage */}
      <main className="main">
        <div className="content-container machine-page-container">
          <div className="machine-page">
            {/* HEADER */}
            <div className="machine-page-header">
              <div className="machine-page-header-left">
                <div>
                  <h2 className="machine-page-title">{resolvedMachineName}</h2>
                  <div className="machine-page-subtitle">
                    Theo dõi OEE / Output / Activity theo ngày, tháng, năm
                  </div>
                </div>
              </div>

              <div className="machine-page-header-right">
                {/* Có thể thêm info line, code máy... sau này */}
              </div>
            </div>

            <div className="machine-page-content">
              {!machine ? (
                // Trường hợp không có machineId → chỉ báo lỗi nhẹ
                <div className="machine-page-empty">
                  Không có thông tin máy. Vui lòng chọn máy từ menu bên trái.
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="popup-tabs">
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

                  {/* Toolbar DAY */}
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
                      <div className="toolbar-actions" />
                    </div>
                  )}

                  {/* Toolbar MONTH */}
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

                  {/* Toolbar YEAR */}
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

                  {/* Nội dung theo tab */}
                  <div className="popup-content-box">
                    {activeTab === "day" && (
                      <MachineDayPage machine={machine} day={dayFilter} />
                    )}

                    {activeTab === "month" && (
                      <MachineMonthPage
                        machine={machine}
                        month={Number(monthFilter)}
                        dataType={selectedMetric}
                      />
                    )}

                    {activeTab === "year" && (
                      <MachineYearPage
                        machine={machine}
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
