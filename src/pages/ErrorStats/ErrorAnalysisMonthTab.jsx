import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  Area,
  LabelList,
} from "recharts";
import {
  linename,
  getMachinesByLine,
  getErrorAnalysByYear,
} from "../../api";

const styles = {
  container: {
    padding: "12px",
    fontFamily:
      '"Bai Jamjuree", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    marginBottom: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  filterItem: { display: "flex", alignItems: "center", gap: "6px" },
  label: { fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" },
  select: {
    height: "30px",
    minWidth: "140px",
    padding: "3px 8px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    padding: "10px 12px",
  },
  chartWrapper: { height: "320px", marginBottom: "12px" },
  tableWrapper: { maxHeight: "260px", overflow: "auto", marginTop: "8px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: {
    position: "sticky",
    top: 0,
    backgroundColor: "#f3f4f6",
    padding: "6px 8px",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
    textAlign:"left",
  },
  td: { padding: "6px 8px", borderBottom: "1px solid #f3f4f6" },
  tdRight: {
    padding: "6px 8px",
    borderBottom: "1px solid #f3f4f6",
    textAlign: "right",
  },

  // Overlay wrap
  overlayContainer: {
    position: "relative",
  },
  // Lớp mờ phủ lên chart + table
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  // Box đen ở giữa
  overlayBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 18px",
    borderRadius: 12,
    background: "#111827",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
  },
  // Spinner tròn
  spinner: {
    width: 16,
    height: 16,
    border: "2.5px solid rgba(255,255,255,0.85)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    display: "block",
    animation: "spin 0.7s linear infinite",
  },
};

// @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

// Parse "0h 13m 32s" -> giây
function parseRecoveryTimeToSeconds(str) {
  if (!str) return 0;
  const r = /(\d+)h\s*(\d*)m?\s*(\d*)s?/i;
  const m = str.match(r);
  if (!m) return 0;
  const h = parseInt(m[1] || 0, 10);
  const mm = parseInt(m[2] || 0, 10);
  const s = parseInt(m[3] || 0, 10);
  return h * 3600 + mm * 60 + s;
}

export default function ErrorAnalysisYearTab() {
  const thisYear = new Date().getFullYear();

  const [lines, setLines] = useState([]);
  const [machines, setMachines] = useState([]);
  const [errors, setErrors] = useState([]);

  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [filters, setFilters] = useState({
    line: "",
    machine: "All",
    year: thisYear,
    dataType: "count", // 'count' | 'recovery'
  });

  // Load LINE
  useEffect(() => {
    const loadLines = async () => {
      const data = await linename();
      const arr = data.map((i) => ({ id: i.idline, name: i.ten_line }));
      setLines(arr);

      if (!filters.line && arr.length > 0) {
        setFilters((prev) => ({ ...prev, line: arr[0].id }));
      }
    };
    loadLines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load MACHINE theo LINE
  useEffect(() => {
    if (!filters.line) return;

    const loadMachines = async () => {
      try {
        setLoadingMachines(true);
        const ds = await getMachinesByLine(filters.line);
        const map = ds.map((m) => ({
          id: m.idmay ?? m.id,
          name: m.ten_may ?? m.name,
        }));
        setMachines(map);
        setFilters((p) => ({ ...p, machine: "All" }));
      } finally {
        setLoadingMachines(false);
      }
    };
    loadMachines();
  }, [filters.line]);

  const handleChange = (key) => (e) =>
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  // Gọi API theo năm
  const loadData = async () => {
    try {
      setLoadingData(true);

      const sortBy = filters.dataType === "count" ? "count" : "time";

      const res = await getErrorAnalysByYear({
        idline: filters.line,
        idmay: filters.machine,
        year: filters.year,
        sortBy,
      });

      const normalized = res.map((item) => {
        const seconds =
          item.TotalErrorSeconds != null
            ? Number(item.TotalErrorSeconds)
            : parseRecoveryTimeToSeconds(item.RecoveryTime);

        return {
          code: item.ErrorCode,
          machineName: item.MachineName,
          message: item.ErrorName_Vie,
          count: Number(item.ErrorCount || 0),
          totalSeconds: seconds,
          recoveryTime: item.RecoveryTime,
        };
      });

      setErrors(normalized);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!filters.line) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.line, filters.machine, filters.year, filters.dataType]);

  // CHART DATA – sort desc + TOP 20 + domain Y cố định
  const { chartData, leftDomain } = useMemo(() => {
    if (!errors.length) {
      return { chartData: [], leftDomain: [0, 1] };
    }

    const getMetric = (it) =>
      filters.dataType === "recovery"
        ? Number(it.totalSeconds || 0) / 3600 // giờ
        : Number(it.count || 0); // count

    const sorted = [...errors].sort((a, b) => getMetric(b) - getMetric(a));

    const top = sorted.slice(0, 20);

    const totalMetric = top.reduce((s, it) => s + getMetric(it), 0);
    if (totalMetric === 0) return { chartData: [], leftDomain: [0, 1] };

    let cumulative = 0;
    const data = top.map((it) => {
      const v = getMetric(it).toFixed(2);
      cumulative += (v / totalMetric) * 100;
      return {
        code: it.code,
        value: v,
        count: it.count,
        cumulativePercent: Number(cumulative.toFixed(1)),
      };
    });

    let domain;
    if (filters.dataType === "recovery") {
      domain = [0, 3000]; // 0–3000 giờ ~ 10M giây
    } else {
      domain = [0, 1000]; // count
    }

    return { chartData: data, leftDomain: domain };
  }, [errors, filters.dataType]);

  return (
    <div style={styles.container}>
      {/* FILTER BAR */}
      <div style={styles.filterBar}>
        <div style={styles.filterItem}>
          <span style={styles.label}>LINE:</span>
          <select
            style={styles.select}
            value={filters.line}
            onChange={handleChange("line")}
          >
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterItem}>
          <span style={styles.label}>MACHINE:</span>
          <select
            style={styles.select}
            value={filters.machine}
            disabled={loadingMachines}
            onChange={handleChange("machine")}
          >
            <option value="All">All</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterItem}>
          <span style={styles.label}>YEAR:</span>
          <select
            style={styles.select}
            value={filters.year}
            onChange={handleChange("year")}
          >
            {[thisYear - 2, thisYear - 1, thisYear, thisYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterItem}>
          <span style={styles.label}>DATA:</span>
          <select
            style={styles.select}
            value={filters.dataType}
            onChange={handleChange("dataType")}
          >
            <option value="count">Count</option>
            <option value="recovery">Recover Time</option>
          </select>
        </div>
      </div>

      {/* OVERLAY + CONTENT */}
      <div style={styles.overlayContainer}>
        {loadingData && (
          <div style={styles.overlay}>
            <div style={styles.overlayBox}>
              <span style={styles.spinner} />
              Đang tải dữ liệu...
            </div>
          </div>
        )}

        {/* CHART */}
        <div style={{ ...styles.card, ...styles.chartWrapper }}>
          {chartData.length === 0 && !loadingData ? (
            <div
              style={{
                paddingTop: "120px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              Không có dữ liệu...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />

                <YAxis
                  yAxisId="left"
                  domain={leftDomain}
                  tickFormatter={(v) =>
                    filters.dataType === "recovery" ? `${v.toFixed(0)}h` : v
                  }
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />

                <Tooltip />

                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativePercent"
                  fill="#fee2e2"
                  stroke="none"
                  fillOpacity={1}
                />

                <Bar yAxisId="left" dataKey="value" fill="#1d4ed8">
                  <LabelList dataKey="count" position="top" />
                </Bar>

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativePercent"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#fff", stroke: "#ef4444" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* TABLE */}
        <div style={{ ...styles.card, ...styles.tableWrapper }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Machine</th>
                <th style={styles.th}>Alarm</th>
                <th style={styles.th}>Message</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Count</th>
                <th style={styles.th}>Recovery Time</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr key={`${e.machineName}-${e.code}`}>
                  <td style={styles.td}>{e.machineName}</td>
                  <td style={styles.td}>{e.code}</td>
                  <td style={styles.td}>{e.message}</td>
                  <td style={styles.tdRight}>{e.count}</td>
                  <td style={styles.td}>{e.recoveryTime}</td>
                </tr>
              ))}
              {errors.length === 0 && !loadingData && (
                <tr>
                  <td style={styles.td} colSpan={5}>
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
