import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { fetchMachineMonthRatio, fetchMachineMonth } from "../api";

/**
 * Props:
 *  - machine: { id, name }
 *  - month: số tháng 1..12
 *  - dataType:
 *      'ALL'
 *      'OEE RATIO'
 *      'OK PRODUCT RATIO'
 *      'OUTPUT RATIO'
 *      'ACTIVITY RATIO'
 */
export default function MachineMonthPage({ machine, month, dataType }) {
  const [ratioDays, setRatioDays] = useState([]);
  const [timeDays, setTimeDays] = useState([]);
  const [loadingRatio, setLoadingRatio] = useState(false);
  const [loadingTime, setLoadingTime] = useState(false);
  const [errorRatio, setErrorRatio] = useState("");
  const [errorTime, setErrorTime] = useState("");

  // ------------- LOAD RATIO (phụ thuộc cả dataType) -------------
  useEffect(() => {
    if (!machine || !month) return;

    let isCancelled = false;

    async function loadRatio() {
      try {
        setLoadingRatio(true);
        setErrorRatio("");

        const data = await fetchMachineMonthRatio(
          machine.id,
          month,
          dataType
        );
        if (isCancelled) return;
        setRatioDays(data.days || []);
      } catch (err) {
        console.error("Lỗi load ratio tháng:", err);
        if (!isCancelled) {
          setErrorRatio("Không tải được dữ liệu ratio theo tháng");
        }
      } finally {
        if (!isCancelled) setLoadingRatio(false);
      }
    }

    loadRatio();

    return () => {
      isCancelled = true;
    };
  }, [machine, month, dataType]);

  // ------------- LOAD TIME (lỗi) – chỉ phụ thuộc machine + month -------------
  useEffect(() => {
    if (!machine || !month) return;

    let isCancelled = false;

    async function loadTime() {
      try {
        setLoadingTime(true);
        setErrorTime("");

        const data = await fetchMachineMonth(machine.id, month);
        if (isCancelled) return;
        setTimeDays(data.days || []);
      } catch (err) {
        console.error("Lỗi load time tháng:", err);
        if (!isCancelled) {
          setErrorTime("Không tải được dữ liệu thời gian theo tháng");
        }
      } finally {
        if (!isCancelled) setLoadingTime(false);
      }
    }

    loadTime();

    return () => {
      isCancelled = true;
    };
  }, [machine, month]);

  const monthLabel = `Tháng ${String(month || "").padStart(2, "0")}`;
  const normalizedType = (dataType || "ALL").toUpperCase().trim();
  const showOverlay = (loadingRatio || loadingTime) && machine && month;
  // ------------- MAP RATIO CHO LINE CHART (useMemo) -------------
  const ratioChartData = useMemo(
    () =>
      ratioDays.map((d) => {
        let dayNumber = parseInt(String(d.day).slice(-2), 10);
        if (Number.isNaN(dayNumber)) dayNumber = d.day;

        return {
          day: dayNumber,
          OEE: d.oee ?? 0,
          OKPRODUCT: d.ok_ratio ?? 0,
          OUTPUT: d.output_ratio ?? 0,
          ACTIVITY: d.activity_ratio ?? 0,
        };
      }),
    [ratioDays]
  );

  const lineMap = {
    "OEE RATIO": {
      key: "OEE",
      label: "OEE Ratio",
      color: "#f59e0b",
    },
    "OK PRODUCT RATIO": {
      key: "OKPRODUCT",
      label: "OK Product Ratio",
      color: "#22c55e",
    },
    "OUTPUT RATIO": {
      key: "OUTPUT",
      label: "Output Ratio",
      color: "#0ea5e9",
    },
    "ACTIVITY RATIO": {
      key: "ACTIVITY",
      label: "Activity Ratio",
      color: "#8b5cf6",
    },
  };

  const isAll = normalizedType === "ALL";
  const selectedLine = !isAll
    ? lineMap[normalizedType] || lineMap["OEE RATIO"]
    : null;

  const dataLabel = isAll
    ? "All (OEE, OK Product, Output, Activity)"
    : selectedLine.label;

  const hasRatioData = ratioChartData.length > 0;

  // ------------- MAP TIME CHO STACKED BAR (useMemo, fix tổng 100%) -------------
  const stackChartData = useMemo(() => {
    return timeDays.map((d) => {
      const c = d.categories || {};

      const keys = [
        "Operation",
        "SmallStop",
        "Fault",
        "Break",
        "Maintenance",
        "Eat",
        "Waiting",
        "MachineryEdit",
        "ChangeProductCode",
        "Glue_CleaningPaper",
        "Others",
      ];

      const rawValues = keys.map((k) => Number(c[k] || 0));
      const total = rawValues.reduce((sum, v) => sum + v, 0);

      let percentInts = keys.map(() => 0);

      if (total > 0) {
        const rawPerc = rawValues.map((v) => (v * 100) / total);
        const baseInts = rawPerc.map((v) => Math.floor(v));
        let remainder = 100 - baseInts.reduce((s, v) => s + v, 0);

        const frac = rawPerc.map((v, idx) => ({
          idx,
          frac: v - baseInts[idx],
        }));
        frac.sort((a, b) => b.frac - a.frac);

        const adjusted = [...baseInts];
        let i = 0;
        while (remainder > 0 && i < frac.length) {
          adjusted[frac[i].idx] += 1;
          remainder -= 1;
          i += 1;
        }

        percentInts = adjusted;
      }

      let dayNumber = parseInt(String(d.day).slice(-2), 10);
      if (Number.isNaN(dayNumber)) dayNumber = d.day;

      return {
        day: dayNumber,
        OperationP: percentInts[0],
        SmallStopP: percentInts[1],
        FaultP: percentInts[2],
        BreakP: percentInts[3],
        MaintenanceP: percentInts[4],
        EatP: percentInts[5],
        WaitingP: percentInts[6],
        MachineryEditP: percentInts[7],
        ChangeProductCodeP: percentInts[8],
        GlueCleaningPaperP: percentInts[9],
        OthersP: percentInts[10],
      };
    });
  }, [timeDays]);

  const hasStackData = stackChartData.length > 0;

  // ❗ Early return phải đặt SAU tất cả hook
  if (!machine || !month) {
    return null;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {showOverlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.6)",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "#111827",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid #ffffff",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Đang tải dữ liệu...
          </div>
        </div>
      )}
      {/* HEADER */}
      {/* <div>
        <h4 style={{ margin: "0 0 4px" }}>Dữ liệu theo tháng</h4>
        <p style={{ margin: 0, fontSize: 13 }}>
          Máy: <b>{machine.name}</b> (ID: {machine.id}) &nbsp;|&nbsp;{" "}
          <b>{monthLabel}</b> &nbsp;|&nbsp; Data: <b>{dataLabel}</b>
        </p>
      </div> */}

      {/* BIỂU ĐỒ LINE – RATIO */}
      <div
        style={{
          flex: 1,
          borderRadius: 8,
          border: "1px solid #d1d5db",
          background: "#ffffff",
          padding: 12,
          minHeight: 0,
        }}
      >
        {loadingRatio && <p>Đang tải dữ liệu ratio...</p>}
        {errorRatio && (
          <p style={{ color: "red", marginTop: 4, marginBottom: 4 }}>
            {errorRatio}
          </p>
        )}

        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
          {isAll
            ? `OEE / OK Product / Output / Activity theo ngày trong ${monthLabel}`
            : `${selectedLine.label} theo ngày trong ${monthLabel}`}
        </div>

        {hasRatioData ? (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={ratioChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                label={{
                  value: "Days",
                  position: "insideBottomRight",
                  offset: -4,
                }}
              />
              <YAxis
                domain={[0, 120]}
                label={{ value: "Ratio", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Legend />

              {isAll ? (
                <>
                  <Line
                    type="linear"
                    dataKey="OEE"
                    name="OEE Ratio"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="linear"
                    dataKey="OKPRODUCT"
                    name="OK Product Ratio"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="linear"
                    dataKey="OUTPUT"
                    name="Output Ratio"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="linear"
                    dataKey="ACTIVITY"
                    name="Activity Ratio"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </>
              ) : (
                selectedLine && (
                  <Line
                    type="linear"
                    dataKey={selectedLine.key}
                    name={selectedLine.label}
                    stroke={selectedLine.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          !loadingRatio && (
            <p
              style={{
                marginTop: 16,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              Không có dữ liệu ratio cho tháng này.
            </p>
          )
        )}
      </div>

      {/* BIỂU ĐỒ CỘT CHỒNG – PHÂN BỔ THỜI GIAN */}
      <div
        style={{
          flex: 1,
          borderRadius: 8,
          border: "1px solid #d1d5db",
          background: "#ffffff",
          padding: 12,
          minHeight: 0,
        }}
      >
        {loadingTime && <p>Đang tải dữ liệu thời gian...</p>}
        {errorTime && (
          <p style={{ color: "red", marginTop: 4, marginBottom: 4 }}>
            {errorTime}
          </p>
        )}

        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
          Biểu đồ cột chồng – tỷ lệ (%) phân bổ thời gian theo ngày
        </div>

        {hasStackData ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={stackChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                label={{
                  value: "Days",
                  position: "insideBottomRight",
                  offset: -4,
                }}
              />
              <YAxis
                domain={[0, 100]}
                label={{
                  value: "Tỷ lệ thời gian (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="OperationP"
                name="Operation"
                stackId="time"
                fill="#00a03e"
              />
              <Bar
                dataKey="SmallStopP"
                name="Small Stop"
                stackId="time"
                fill="#f97316"
              />
              <Bar
                dataKey="FaultP"
                name="Fault"
                stackId="time"
                fill="#ef4444"
              />
              <Bar
                dataKey="BreakP"
                name="Break"
                stackId="time"
                fill="#eab308"
              />
              <Bar
                dataKey="MaintenanceP"
                name="Maintenance"
                stackId="time"
                fill="#6b21a8"
              />
              <Bar dataKey="EatP" name="Eat" stackId="time" fill="#22c55e" />
              <Bar
                dataKey="WaitingP"
                name="Waiting"
                stackId="time"
                fill="#0ea5e9"
              />
              <Bar
                dataKey="MachineryEditP"
                name="Machinery Edit"
                stackId="time"
                fill="#1d4ed8"
              />
              <Bar
                dataKey="ChangeProductCodeP"
                name="Change Product Code"
                stackId="time"
                fill="#a855f7"
              />
              <Bar
                dataKey="GlueCleaningPaperP"
                name="Glue Cleaning Paper"
                stackId="time"
                fill="#fb7185"
              />
              <Bar
                dataKey="OthersP"
                name="Others"
                stackId="time"
                fill="#6b7280"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          !loadingTime && (
            <p
              style={{
                marginTop: 16,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              Không có dữ liệu thời gian cho tháng này.
            </p>
          )
        )}
      </div>
    </div>
  );
}