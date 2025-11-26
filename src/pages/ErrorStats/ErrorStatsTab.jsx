import React, { useState } from "react";
import ErrorStatsDayTab from "./ErrorStatsDayTab";
import ErrorStatsMonthTab from "./ErrorStatsMonthTab";
import ErrorStatsYearTab from "./ErrorStatsYearTab";

export default function ErrorStatsTab() {
  const [subTab, setSubTab] = useState("day"); // day | month | year

  const changeSubTab = (tab) => {
    if (tab === subTab) return;
    // Chỉ đổi tab trực tiếp, KHÔNG dùng overlay ở đây nữa
    setSubTab(tab);
  };

  return (
    <div className="error-subtabs-wrapper">
      {/* --- 3 TAB NGÀY / THÁNG / NĂM --- */}
      <div className="error-subtabs-nav">
        <button
          className={`error-subtab ${subTab === "day" ? "active" : ""}`}
          onClick={() => changeSubTab("day")}
        >
          Ngày
        </button>
        <button
          className={`error-subtab ${subTab === "month" ? "active" : ""}`}
          onClick={() => changeSubTab("month")}
        >
          Tháng
        </button>
        <button
          className={`error-subtab ${subTab === "year" ? "active" : ""}`}
          onClick={() => changeSubTab("year")}
        >
          Năm
        </button>
      </div>

      {/* Nội dung từng sub-tab */}
      <div className="error-subtab-content">
        {subTab === "day" && <ErrorStatsDayTab />}
        {subTab === "month" && <ErrorStatsMonthTab />}
        {subTab === "year" && <ErrorStatsYearTab />}
      </div>
    </div>
  );
}
