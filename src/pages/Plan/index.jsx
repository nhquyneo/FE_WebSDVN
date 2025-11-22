import React, { useState } from "react";
import "./PlanTabs.css";
import PlanDaysTab from "./PlanDaysTab";
import PlanMonthTab from "./PlanMonthTab";

export default function PlanTabs() {
  const [activeTab, setActiveTab] = useState("day");
  const [loading, setLoading] = useState(false); // overlay

  const changeTab = (tab) => {
    if (tab === activeTab) return;

    setLoading(true); // bật overlay

    // Đổi tab sau 100ms
    setTimeout(() => {
      setActiveTab(tab);

      // Tắt overlay sau 300ms (để tab load kịp)
      setTimeout(() => {
        setLoading(false);
      }, 150);
    }, 100);
  };

  return (
    <div className="plan-tabs-wrapper">

      {/* Overlay Loading */}
      {loading && (
        <div className="overlay-loading">
          <div className="spinner"></div>
        </div>
      )}

      {/* --- TABS --- */}
      <div className="plan-tabs">
        <button
          className={`plan-tab ${activeTab === "day" ? "active" : ""}`}
          onClick={() => changeTab("day")}
        >
          Plan (Days)
        </button>

        <button
          className={`plan-tab ${activeTab === "month" ? "active" : ""}`}
          onClick={() => changeTab("month")}
        >
          Plan (Month)
        </button>
      </div>

      {/* --- HIỂN THỊ TAB --- */}
      <div className="plan-card">
        {activeTab === "day" && <PlanDaysTab />}
        {activeTab === "month" && <PlanMonthTab />}
      </div>
    </div>
  );
}