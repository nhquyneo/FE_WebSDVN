import React, { useState } from "react";
import ErrorAnalysisDayTab from "./ErrorAnalysisDayTab";
import ErrorAnalysisMonthTab from "./ErrorAnalysisMonthTab";
import ErrorAnalysisYearTab from "./ErrorAnalysisYearTab";

export default function ErrorAnalysisTab() {
  const [subTab, setSubTab] = useState("day"); // day | month | year

  return (
    <>
      {/* --- 3 TAB CON: NGÀY / THÁNG / NĂM --- */}
      <div className="error-subtabs-nav">
        <button
          className={`error-subtab ${subTab === "day" ? "active" : ""}`}
          onClick={() => setSubTab("day")}
        >
         Ngày
        </button>
        <button
          className={`error-subtab ${subTab === "month" ? "active" : ""}`}
          onClick={() => setSubTab("month")}
        >
          Tháng
        </button>
        <button
          className={`error-subtab ${subTab === "year" ? "active" : ""}`}
          onClick={() => setSubTab("year")}
        >
          Năm
        </button>
      </div>

      {/* Nội dung từng sub-tab phân tích */}
      <div className="error-subtab-content">
        {subTab === "day" && <ErrorAnalysisDayTab />}
        {subTab === "month" && <ErrorAnalysisMonthTab />}
        {subTab === "year" && <ErrorAnalysisYearTab />}
      </div>
    </>
  );
}