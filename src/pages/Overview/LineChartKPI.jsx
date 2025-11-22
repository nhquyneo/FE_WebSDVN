import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getLineKpi } from "../../api";

// Fill đủ ngày trong tháng, ngày nào không có data => 0
function fillMonthData(rawData, month, year) {
  // month: 1-12. new Date(year, month, 0) => ngày cuối cùng của tháng đó
  const daysInMonth = new Date(year, month, 0).getDate();

  const mapByDay = {};
  (rawData || []).forEach((item) => {
    const d = parseInt(item.day, 10);
    if (!Number.isNaN(d)) {
      mapByDay[d] = item;
    }
  });

  const result = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const item = mapByDay[d] || {};
    result.push({
      day: d,
      oee: item.oee ?? 0,
      ok: item.ok ?? 0,
      output: item.output ?? 0,
      activity: item.activity ?? 0,
    });
  }
  return result;
}

export default function LineChartKPI({ lineName, month, year, dataset }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // overlay

  useEffect(() => {
    async function load() {
      try { 
        setLoading(true);
        const raw = await getLineKpi(lineName, month, year, dataset);
        const filled = fillMonthData(raw, month, year);
        setData(filled);
      } catch (error) {
        console.error("Error load KPI:", error);
        // lỗi hoặc không có data -> vẫn fill đủ ngày = 0
        setData(fillMonthData([], month, year));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lineName, month, year, dataset]);

  const showAll = dataset === "all";

  return (
    <>
      {loading && (
        <div className="chart-overlay">
          Đang tải dữ liệu...
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />

          {(showAll || dataset === "oee") && (
            <Line
              type="linear"
              dataKey="oee"
              stroke="#ef4444"
              dot={{ r: 5 }}
              name="OEE Ratio"
            />
          )}
          {(showAll || dataset === "ok") && (
            <Line
              type="linear"
              dataKey="ok"
              stroke="#f97316"
              dot={{ r: 5 }}
              name="OK Product Ratio"
            />
          )}
          {(showAll || dataset === "output") && (
            <Line
              type="linear"
              dataKey="output"
              stroke="#22c55e"
              dot={{ r: 5 }}
              name="Output Ratio"
            />
          )}
          {(showAll || dataset === "activity") && (
            <Line
              type="linear"
              dataKey="activity"
              stroke="#8b5cf6"
              dot={{ r: 5 }}
              name="Activity Ratio"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}