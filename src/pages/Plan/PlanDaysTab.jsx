import React, { useEffect, useState } from "react";
import {
  linename,
  getMachinesByLine,
  getDayPlans,
  updateAllDayPlans, // hoặc updateAllDayPlans nếu bạn đang dùng bulk-update
} from "../../api";
import "./PlanTabs.css";

export default function PlanDaysTab() {
  const [lineList, setLineList] = useState([]);
  const [machineList, setMachineList] = useState([]);

  const [lineId, setLineId] = useState("");        // idline
  const [machine, setMachine] = useState("All");   // id máy hoặc "All"
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [plans, setPlans] = useState([]);

  // ===== 1. Lấy LINE =====
  useEffect(() => {
    const fetchLines = async () => {
      try {
        const data = await linename();
        console.log("LINE DATA:", data);
        setLineList(data);
        if (data.length > 0) {
          setLineId(String(data[0].idline));
        }
      } catch (err) {
        console.error("Lỗi lấy line:", err);
      }
    };
    fetchLines();
  }, []);

  // ===== 2. Lấy MACHINE theo LINE =====
  useEffect(() => {
    if (!lineId) {
      setMachineList([]);
      return;
    }

    const fetchMachines = async () => {
      try {
        console.log("GỌI getMachinesByLine với idline =", lineId);
        const data = await getMachinesByLine(lineId);
        console.log("MACHINE DATA:", data);
        setMachineList(data);
        setMachine("All");
      } catch (err) {
        console.error("Lỗi lấy machine:", err);
        setMachineList([]);
        setMachine("All");
      }
    };
    fetchMachines();
  }, [lineId]);

  // ===== 3. Gọi API lấy plan =====
  const loadPlans = async () => {
    if (!lineId || !date) return;

    try {
      const machineId = machine === "All" ? null : machine;
      console.log("CALL getDayPlans:", { lineId, machineId, date });
      const data = await getDayPlans(lineId, machineId, date);
      console.log("DAY PLANS:", data);
      setPlans(data || []);
    } catch (err) {
      console.error("Lỗi load day plans:", err);
      setPlans([]);
    }
  };

  // Auto load khi đổi line/date/machine
  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId, date, machine]);

  const handleUpdatePlan = async () => {
    try {
      await updateAllDayPlans(plans);
      // sau khi cập nhật xong, load lại từ DB cho chắc
      await loadPlans();
    } catch (err) {
      console.error("Lỗi update all:", err);
    }
  };

  // ===== 4. Hàm tính DayPlan & TargetProduct (có cả cycleTime) =====
  const recalcRow = (row, changedField, value) => {
    const updated = { ...row, [changedField]: value };

    const parseDT = (v) => (v ? new Date(v) : null);

    const s1 = parseDT(updated.startShift1);
    const e1 = parseDT(updated.endShift1);
    const s2 = parseDT(updated.startShift2);
    const e2 = parseDT(updated.endShift2);

    let dayPlan = updated.dayPlan;

    // Nếu thay đổi giờ → tính lại DayPlan = tổng giờ 2 ca
    if (
      ["startShift1", "endShift1", "startShift2", "endShift2"].includes(
        changedField
      )
    ) {
      let diff1 = 0;
      let diff2 = 0;

      if (s1 && e1) {
        diff1 = (e1.getTime() - s1.getTime()) / (1000 * 60 * 60);
      }
      if (s2 && e2) {
        diff2 = (e2.getTime() - s2.getTime()) / (1000 * 60 * 60);
      }

      const total = diff1 + diff2;
      if (Number.isFinite(total)) {
        dayPlan = Number(total.toFixed(2));
        updated.dayPlan = dayPlan;
      }
    }

    // Nếu sửa trực tiếp DayPlan
    if (changedField === "dayPlan") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        dayPlan = num;
        updated.dayPlan = dayPlan;
      } else {
        dayPlan = null;
        updated.dayPlan = null;
      }
    }

    // Nếu sửa CycleTime
    if (changedField === "cycleTime") {
      const ct = parseFloat(value);
      if (!isNaN(ct) && ct > 0) {
        updated.cycleTime = ct;
      } else {
        updated.cycleTime = "";
      }
    }

    // Tính lại TargetProduct = DayPlan * 3600 / CycleTime
    if (
      updated.dayPlan != null &&
      updated.cycleTime !== undefined &&
      updated.cycleTime !== "" &&
      !isNaN(parseFloat(updated.cycleTime)) &&
      parseFloat(updated.cycleTime) > 0
    ) {
      const ct = parseFloat(updated.cycleTime);
      const target = (updated.dayPlan * 60 * 60) / ct;
      updated.targetProduct = Math.round(target);
    } else {
      updated.targetProduct = null;
    }

    return updated;
  };

  const handleCellChange = (index, field, value) => {
    setPlans((prev) => {
      const next = [...prev];
      const row = next[index];
      const updatedRow = recalcRow(row, field, value);
      next[index] = updatedRow;
      return next;
    });
  };

  // ===== 5. Gửi update 1 dòng xuống BE (nếu bạn vẫn dùng per-row) =====
//   const handleUpdateRow = async (index) => {
//     const row = plans[index];
//     try {
//       console.log("Gửi updateDayPlan:", row);
//       const updated = await updateDayPlan(row);
//       // nếu BE trả lại dữ liệu mới, ghép lại vào state cho chắc
//       if (updated) {
//         setPlans((prev) => {
//           const next = [...prev];
//           next[index] = { ...next[index], ...updated };
//           return next;
//         });
//       }
//     } catch (err) {
//       console.error("Lỗi cập nhật plan:", err);
//     }
//   };

  return (
    <>
      {/* ====== FILTER ====== */}
      <div className="plan-filter-row">
        {/* LINE */}
        <div className="row-item">
          <label>LINE:</label>
          <select
            style={{ width: 100, marginLeft: 5 }}
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
          >
            {lineList.map((item) => (
              <option key={item.idline} value={item.idline}>
                {item.ten_line}
              </option>
            ))}
          </select>
        </div>

        {/* MACHINE */}
        <div className="row-item">
          <label>MACHINE:</label>
          <select
            style={{ marginLeft: 5 }}
            value={machine}
            onChange={(e) => setMachine(e.target.value)}
          >
            <option value="All">All</option>
            {machineList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* DATE */}
        <div className="row-item">
          <label>DATE:</label>
          <input
            style={{ width: 120, marginLeft: 5 }}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Nút Update tổng (tùy bạn dùng loadPlans hay bulk-update) */}
        <button className="btn-primary" onClick={handleUpdatePlan}>
          Update
        </button>
      </div>

      {/* ====== BẢNG PLAN ====== */}
      <div className="plan-table-wrapper">
        <table className="plan-table">
          <thead>
            <tr>
              <th style={{textAlign:"center"}}>Line</th>
              <th style={{textAlign:"center"}}>Machine</th>
              <th style={{textAlign:"center"}}>Day</th>
              <th style={{textAlign:"center"}}>DayPlan (giờ)</th>
              <th style={{textAlign:"center"}}>Target Product</th>
              <th style={{textAlign:"center"}}>Cycle Time</th>
              <th style={{textAlign:"center"}}>StartTime 1</th>
              <th style={{textAlign:"center"}}>EndTime 1</th>
              <th style={{textAlign:"center"}}>StartTime 2</th>
              <th style={{textAlign:"center"}}>EndTime 2</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((row, index) => (
              <tr key={row.id || index}>
                <td style={{textAlign:"center"}}>{row.line}</td>
                <td style={{textAlign:"center"}}>{row.machine}</td>
                <td style={{textAlign:"center"}}>{row.day}</td>

                {/* DayPlan: có thể sửa, hoặc để auto từ giờ */}
                <td style={{textAlign:"center"}}>
                  {/* <input
                    className="cell-input"
                    type="number"
                    step="0.1"
                    value={row.dayPlan ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "dayPlan", e.target.value)
                    }
                  /> */}
                  {row.dayPlan}
                </td>

                {/* Target Product: auto, không cho sửa */}
                <td style={{textAlign:"center"}}>
                {row.targetProduct}
                  {/* <input
                    className="cell-input"
                    type="number"
                    value={row.targetProduct ?? ""}
                    readOnly
                  /> */}
                </td>

                {/* CycleTime: GIỜ đã cho sửa */}
                <td >
                  <input style={{textAlign:"center",width:40}}
                    className="cell-input no-spin"
                    type="number"
                    
                    value={row.cycleTime ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "cycleTime", e.target.value)
                    }
                  />
                </td>

                {/* Thay đổi giờ → DayPlan & TargetProduct tự tính lại */}
                <td>
                  <input style={{textAlign:"center"}}
                    className="cell-input"
                    type="datetime-local"
                    value={row.startShift1 ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "startShift1", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input style={{textAlign:"center"}}
                    className="cell-input"
                    type="datetime-local"
                    value={row.endShift1 ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "endShift1", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input style={{textAlign:"center"}}
                    className="cell-input"
                    type="datetime-local"
                    value={row.startShift2 ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "startShift2", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input style={{textAlign:"center"}}
                    className="cell-input"
                    type="datetime-local"
                    value={row.endShift2 ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "endShift2", e.target.value)
                    }
                  />
                </td>

                {/* Nếu bạn vẫn dùng update từng dòng */}
                {/* <td>
                  <button
                    className="btn-secondary"
                    onClick={() => handleUpdateRow(index)}
                  >
                    Update
                  </button>
                </td> */}
              </tr>
            ))}

            {plans.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: 12 }}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}