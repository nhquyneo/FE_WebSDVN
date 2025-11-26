import React, { useState } from "react";
import "./Error.css";
import ErrorStatsTab from "./ErrorStatsTab";
import ErrorAnalysisTab from "./ErrorAnalysisTab";

export default function ErrorTabs() {
  const [activeTab, setActiveTab] = useState("analysis");
  const [loading, setLoading] = useState(false);

  const changeTab = (tab) => {
    if (tab === activeTab) return;

    setLoading(true);

    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => setLoading(false), 150);
    }, 200);
  };

  return (
    <div className="error-tabs-wrapper">
      {/* Thanh TAB */}
      <div className="error-tabs-nav">
        <button
          className={`error-tab ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => changeTab("analysis")}
        >
          Phân Tích Lỗi
        </button>

        <button
          className={`error-tab ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => changeTab("stats")}
        >
          Thống Kê Lỗi
        </button>
      </div>

      {/* Khối Card */}
      <div className="error-card">
        {/* Overlay loading nằm trong card và luôn canh giữa card */}
        {loading && (
          <div className="overlay-loading">
            <div className="spinner"></div>
          </div>
        )}

        {/* Nội dung tab */}
        {activeTab === "analysis" && <ErrorAnalysisTab />}
        {activeTab === "stats" && <ErrorStatsTab />}
      </div>
    </div>
  );
}