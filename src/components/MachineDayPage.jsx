import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { fetchMachineDay } from "../api";

export default function MachineDayPage({ machine, day }) {
  const [pieData, setPieData] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [powerRun, setPowerRun] = useState("");
  const [totalHours, setTotalHours] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const showOverlay = loading && day;
  const color_map = {
    Operation:          "#00a03e",
    SmallStop:          "#f97316",
    Fault:              "#ef4444",
    Break:              "#eab308",
    Maintenance:        "#6b21a8",
    Eat:                "#22c55e",
    Waiting:            "#0ea5e9",
    MachineryEdit:      "#1d4ed8",
    ChangeProductCode:  "#a855f7",
    Glue_CleaningPaper: "#fb7185",
    Others:             "#6b7280",
  };
  useEffect(() => {
    if (!machine || !day) return;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchMachineDay(machine.id, day);
        console.log("MachineDay API data:", data);

        if (!data || !Array.isArray(data.pie)) {
          setPieData([]);
          setDetailRows([]);
          setPowerRun("");
          setTotalHours(null);
          setProductInfo(null);
        } else {
          setPieData(data.pie || []);
          setDetailRows(data.details || []);
          setPowerRun(data.power_run || "");
          setTotalHours(
            typeof data.total_hours === "number" ? data.total_hours : null
          );
          setProductInfo(data.product || null);
        }
      } catch (err) {
        console.error("Lỗi load dữ liệu máy theo ngày:", err);
        setError("Không tải được dữ liệu từ server");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [machine, day]);

  if (!machine || !day) return null;

  // ✅ HÀM EXPORT RA FILE EXCEL .xlsx
  const handleExportExcel = () => {
    if (!detailRows.length && !productInfo) {
      alert("Không có dữ liệu để xuất.");
      return;
    }
    
    const wsData = [];

    // Thông tin chung
    // wsData.push(["Máy", `${machine.name} (ID: ${machine.id})`]);
    // wsData.push(["Ngày", day]);
    // if (totalHours !== null) {
    //   wsData.push(["Tổng thời gian (giờ)", totalHours]);
    // }
    // if (powerRun) {
    //   wsData.push(["Power Run", powerRun]);
    // }
    wsData.push([]); // dòng trống

    // BẢNG THỜI GIAN
    wsData.push(["BẢNG THỜI GIAN"]);
    wsData.push(["Loại dữ liệu", "Giờ", "Thời gian", "Tỷ lệ (%)"]);

    detailRows.forEach((row) => {
      wsData.push([
        row.label,
        row.value,
        row.time,
        row.ratio_text || row.ratio || "",
      ]);
    });

    wsData.push([]); // dòng trống

    // BẢNG PRODUCT
    wsData.push(["PRODUCT"]);
    wsData.push(["TOTAL", "OK", "NG", "RATIO (%)"]);
    if (productInfo) {
      wsData.push([
        productInfo.total ?? "",
        productInfo.ok ?? "",
        productInfo.ng ?? "",
        productInfo.ratio_text || productInfo.ratio || "",
      ]);
    }

    // Tạo workbook & sheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "DayData");

    // Ghi ra buffer + tải xuống
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `machine_${machine.id}_${day}_daydata.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
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
      {/* HÀNG TIÊU ĐỀ + NÚT EXPORT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 6,
          gap: 8,
        }}
      >
        {/* <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 2px" }}>Dữ liệu theo ngày</h4>
          <p style={{ margin: 0, fontSize: 13 }}>
            Máy: <b>{machine.name}</b> (ID: {machine.id}) &nbsp;|&nbsp; Ngày:{" "}
            <b>{day}</b>
          </p>
          {totalHours !== null && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#4b5563" }}>
              Tổng thời gian: <b>{totalHours}</b> giờ
              {powerRun && (
                <>
                  {" "}
                  &nbsp;|&nbsp; Power Run: <b>{powerRun}</b>
                </>
              )}
            </p>
          )}
        </div> */}

        <button
          onClick={handleExportExcel}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid #1d4ed8",
            background: "#2563eb",
            color: "#ffffff",
            fontSize: 12,
            cursor: "pointer",
            whiteSpace: "nowrap",
            marginLeft:"auto"
          }}
        >
          ⬇ Xuất Excel
        </button>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && (
        <p style={{ color: "red", marginTop: 4, marginBottom: 4 }}>{error}</p>
      )}

      {/* HÀNG TRÊN: PIE + BẢNG */}
      <div
        style={{
          marginTop: 4,
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 16,
          width: "100%",
          // flex: 1,
          minHeight: 0,
        }}
      >
        {/* PIE CHART */}
        <div
          style={{
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="90%"
                  label={pieData.length > 0}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BẢNG LEGEND + THỜI GIAN + % */}
        <div
          style={{
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 20,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      borderBottom: "1px solid #d1d5db",
                      textAlign: "left",
                      padding: "4px 6px",
                      width: 70,
                    }}
                  >
                    Pie
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #d1d5db",
                      textAlign: "left",
                      padding: "4px 6px",
                    }}
                  >
                    Loại dữ liệu
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #d1d5db",
                      textAlign: "left",
                      padding: "4px 6px",
                    }}
                  >
                    Thời gian
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #d1d5db",
                      textAlign: "right",
                      padding: "4px 6px",
                      width: 80,
                    }}
                  >
                    Tỷ lệ (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, idx) => (
                  <tr key={idx}>
                    <td
                      style={{
                        padding: "3px 6px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          backgroundColor: row.color || "#6b7280",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "3px 6px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {row.label}
                    </td>
                    <td
                      style={{
                        padding: "3px 6px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {row.time}
                    </td>
                    <td
                      style={{
                        padding: "3px 6px",
                        borderBottom: "1px solid #e5e7eb",
                        textAlign: "right",
                      }}
                    >
                      {row.ratio_text || `${row.ratio ?? 0}%`}
                    </td>
                  </tr>
                ))}
              {detailRows.length === 0 &&
  [
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
  ].map((label, idx) => {
    const color = color_map[label] || "#6b7280";

    return (
      <tr key={idx}>
        <td
          style={{
            padding: "3px 6px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 3,
              backgroundColor: color,
            }}
          />
        </td>

        <td
          style={{
            padding: "3px 6px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {label}
        </td>

        <td
          style={{
            padding: "3px 6px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          0h 0m
        </td>

        <td
          style={{
            padding: "3px 6px",
            borderBottom: "1px solid #e5e7eb",
            textAlign: "right",
          }}
        >
          0.0%
        </td>
      </tr>
    );
  })}
              </tbody>
            </table>
          </div>

          {powerRun && (
            <div style={{ marginTop:10, fontSize: 20 }}>
              <b>Power Run:</b> {powerRun}
            </div>
          )}
        </div>
      </div>

      {/* HÀNG DƯỚI – PRODUCT */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            padding: 10,
            width: "60%",
            minWidth: 420,
          }}
        >
          {productInfo ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 20,
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={8}
                    style={{
                      borderBottom: "1px solid #d1d5db",
                      padding: "4px 6px",
                      textAlign: "left",
                    }}
                  >
                    PRODUCT
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "4px 6px" }}>TOTAL</td>
                  <td style={{ padding: "4px 6px", fontWeight: 600 }}>
                    {productInfo.total}
                  </td>
                  <td style={{ padding: "4px 6px" }}>OK</td>
                  <td
                    style={{
                      padding: "4px 6px",
                      color: "#16a34a",
                      fontWeight: 700,
                    }}
                  >
                    {productInfo.ok}
                  </td>
                  <td style={{ padding: "4px 6px" }}>NG</td>
                  <td
                    style={{
                      padding: "4px 6px",
                      color: "#ef4444",
                      fontWeight: 700,
                    }}
                  >
                    {productInfo.ng}
                  </td>
                  <td style={{ padding: "4px 6px" }}>RATIO</td>
                  <td
                    style={{
                      padding: "4px 6px",
                      fontWeight: 700,
                    }}
                  >
                    {productInfo.ratio_text || `${productInfo.ratio ?? 0}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 20,
            }}
          >
            <thead>
              <tr>
                <th
                  colSpan={8}
                  style={{
                    borderBottom: "1px solid #d1d5db",
                    padding: "4px 6px",
                    textAlign: "left",
                  }}
                >
                  PRODUCT
                </th>
              </tr>
            </thead>
        
            <tbody>
              <tr>
                <td style={{ padding: "4px 6px" }}>TOTAL</td>
                <td style={{ padding: "4px 6px", fontWeight: 600 }}>0</td>
        
                <td style={{ padding: "4px 6px" }}>OK</td>
                <td
                  style={{
                    padding: "4px 6px",
                    color: "#16a34a",
                    fontWeight: 700,
                  }}
                >
                  0
                </td>
        
                <td style={{ padding: "4px 6px" }}>NG</td>
                <td
                  style={{
                    padding: "4px 6px",
                    color: "#ef4444",
                    fontWeight: 700,
                  }}
                >
                  0
                </td>
        
                <td style={{ padding: "4px 6px" }}>RATIO</td>
                <td
                  style={{
                    padding: "4px 6px",
                    fontWeight: 700,
                  }}
                >
                  0%
                </td>
              </tr>
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}