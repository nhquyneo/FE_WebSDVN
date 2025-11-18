import { useState } from "react";
import "./MachinePopup.css";
import MachineDayPage from "./MachineDayPage";
import MachineMonthPage from "./MachineMonthPage";
import MachineYearPage from "./MachineYearPage";
export default function MachinePopup({ open, onClose, machine }) {
  // Tabs
  const [activeTab, setActiveTab] = useState("day");

  // Bộ lọc
  const [dayFilter, setDayFilter] = useState(
    new Date().toISOString().slice(0, 10) // yyyy-MM-dd
  );
  const [monthFilter, setMonthFilter] = useState((new Date().getUTCMonth() + 1).toString());
  const [yearFilter, setYearFilter] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMetric, setSelectedMetric] = useState("ALL");
  const API_BASE = "http://127.0.0.1:5000";
  if (!open || !machine) return null;
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
      a.download = `${machine.name}_${yearFilter}.xlsx`; // server đã set tên file
      a.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error("Export year error:", err);
      alert("Không xuất được file Excel năm");
    }
  }
  async function handleExportMonth() {
    if (!machine || !monthFilter) return;
  
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
    <div className="popup-backdrop" onClick={onClose}>
      <div className="popup-body" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="popup-header">
          <h3 className="popup-title">{machine.name}</h3>
          <button className="popup-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="popup-content">
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

          {/* 🔹 Toolbar cho DAY */}
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

              <div className="toolbar-actions">
                {/* <button className="toolbar-btn apply" onClick={handleSearch}>
                  Apply
                </button> */}
                {/* <button
                  className="toolbar-btn export"
                  onClick={handleExportExcel}
                >
                  Export Excel
                </button> */}
              </div>
            </div>
          )}

          {/* 🔹 Toolbar cho MONTH */}
          {(activeTab === "month") && (
            <div className="toolbar-row">
              {/* MONTH */}
              <div className="toolbar-group">
                <span className="toolbar-label">MONTH:</span>
                <select
                  className="toolbar-select"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  {/* <option value="">--</option> */}
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATA */}
              <div className="toolbar-group">
                <span className="toolbar-label">DATA:</span>
                <select
                  className="toolbar-select"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <option value="ALL">All</option>
                  <option value="OEE RATIO">OEE Ratio</option>
                  <option value="OK PRODUCT RATIO">OK Product ratio</option>
                  <option value="OUTPUT RATIO">Output Ratio</option>
                  <option value="ACTIVITY RATIO">Activity Ratio</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="toolbar-actions">
                {/* <button className="toolbar-btn apply" onClick={handleSearch}>
                  Apply
                </button> */}
                <button
                  className="toolbar-btn export"
                  onClick={handleExportMonth}
                >
                  Export Excel
                </button>
              </div>
            </div>
          )}
          {(activeTab === "year") && (
            <div className="toolbar-row">
              {/* YEAR */}
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

              {/* DATA */}
              <div className="toolbar-group">
                <span className="toolbar-label">DATA:</span>
                <select
                  className="toolbar-select"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <option value="ALL">All</option>
                  <option value="OEE RATIO">OEE Ratio</option>
                  <option value="OK PRODUCT RATIO">OK Product ratio</option>
                  <option value="OUTPUT RATIO">Output Ratio</option>
                  <option value="ACTIVITY RATIO">Activity Ratio</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="toolbar-actions">
                {/* <button className="toolbar-btn apply" onClick={handleSearch}>
                  Apply
                </button> */}
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
               month={Number(monthFilter)}   // 1..12
               dataType={selectedMetric}          // "OEE RATIO" / ...
             />
            )}

            {activeTab === "year" && (
              <MachineYearPage
              machine={machine}
              year={yearFilter}          // state bạn đang dùng cho năm (ví dụ 2024, 2025)
              dataType={selectedMetric}  // giống Month
            />
            )}
          </div>
        </div>

        {/* FOOTER */}
        {/* <div className="popup-footer">
          <button className="popup-btn" onClick={onClose}>
            Đóng
          </button>
        </div> */}
      </div>
    </div>
  );
}