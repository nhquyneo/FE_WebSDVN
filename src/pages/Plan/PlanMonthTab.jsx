import React, { useEffect, useState } from "react";
import {
  linename,
  getMachinesByLine,
  getMonthPlans,
  updateAllMonthPlans,
} from "../../api";
import "./PlanTabs.css";

export default function PlanMonthTab() {
  const [lineList, setLineList] = useState([]);
  const [machineList, setMachineList] = useState([]);

  const [lineId, setLineId] = useState("");
  const [machine, setMachine] = useState("All");
  const [monthValue, setMonthValue] = useState(
    new Date().toISOString().slice(0, 7) // "YYYY-MM"
  );

  const [plans, setPlans] = useState([]);

  // Lấy LINE
  useEffect(() => {
    const fetchLines = async () => {
      try {
        const data = await linename();
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

  // Lấy MACHINE theo LINE
  useEffect(() => {
    if (!lineId) {
      setMachineList([]);
      return;
    }

    const fetchMachines = async () => {
      try {
        const data = await getMachinesByLine(lineId);
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

  // Load dữ liệu tháng
  const loadPlans = async () => {
    if (!lineId || !monthValue) return;

    const [yearStr, monthStr] = monthValue.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    try {
      const machineId = machine === "All" ? null : machine;
      const data = await getMonthPlans(lineId, machineId, year, month);
      setPlans(data || []);
    } catch (err) {
      console.error("Lỗi load month plans:", err);
      setPlans([]);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId, monthValue, machine]);

  // Tính lại DayPlan & TargetProduct như tab ngày
  const recalcRow = (row, changedField, value) => {
    const updated = { ...row, [changedField]: value };

    const parseDT = (v) => (v ? new Date(v) : null);

    const s1 = parseDT(updated.startShift1);
    const e1 = parseDT(updated.endShift1);
    const s2 = parseDT(updated.startShift2);
    const e2 = parseDT(updated.endShift2);

    // DayPlan (int, giờ)
    let dayPlan = updated.dayPlan;

    if (
      ["startShift1", "endShift1", "startShift2", "endShift2"].includes(
        changedField
      )
    ) {
      let diff1 = 0;
      let diff2 = 0;

      if (s1 && e1) diff1 = (e1.getTime() - s1.getTime()) / (1000 * 60 * 60);
      if (s2 && e2) diff2 = (e2.getTime() - s2.getTime()) / (1000 * 60 * 60);

      const total = diff1 + diff2;
      if (Number.isFinite(total)) {
        dayPlan = parseInt(Math.round(total), 10);
        updated.dayPlan = dayPlan;
      }
    }

    if (changedField === "cycleTime") {
      const ct = parseFloat(value);
      if (!isNaN(ct) && ct > 0) updated.cycleTime = ct;
      else updated.cycleTime = "";
    }

    // DayPlan không cho sửa tay ở bản tháng (có thể thêm nếu cần)
    // TargetProduct = DayPlan * 3600 / CycleTime
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

  const handleUpdateAll = async () => {
    try {
      await updateAllMonthPlans(plans);
      await loadPlans();
    } catch (err) {
      console.error("Lỗi update month plans:", err);
    }
  };

  return (
    <>
      {/* FILTER */}
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

        {/* MONTH */}
        <div className="row-item">
          <label>MONTH:</label>
          <input
            style={{ marginLeft: 5 }}
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={handleUpdateAll}>
          Update
        </button>
      </div>

      {/* TABLE */}
      <div className="plan-table-wrapper">
        <table className="plan-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Machine</th>
              <th>Day</th>
              <th>DayPlan (giờ)</th>
              <th>Target Product</th>
              <th>Cycle Time</th>
              <th>StartTime 1</th>
              <th>EndTime 1</th>
              <th>StartTime 2</th>
              <th>EndTime 2</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((row, index) => (
              <tr key={row.id || index}>
                <td>{row.line}</td>
                <td>{row.machine}</td>
                <td>{row.day}</td>

                {/* DayPlan: readonly */}
                <td>
                  <input
                    className="cell-input"
                    type="number"
                    value={row.dayPlan ?? ""}
                    readOnly
                    disabled
                  />
                </td>

                {/* TargetProduct: readonly */}
                <td>
                  <input
                    className="cell-input"
                    type="number"
                    value={row.targetProduct ?? ""}
                    readOnly
                    disabled
                  />
                </td>

                {/* CycleTime: cho sửa, ẩn spinner nếu muốn dùng class no-spin */}
                <td>
                  <input
                    className="cell-input no-spin"
                    type="number"
                    step="0.001"
                    value={row.cycleTime ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "cycleTime", e.target.value)
                    }
                  />
                </td>

                {/* Time fields */}
                <td>
                  <input
                    className="cell-input"
                    type="datetime-local"
                    value={row.startShift1 ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "startShift1", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="cell-input"
                    type="datetime-local"
                    value={row.endShift1 ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "endShift1", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="cell-input"
                    type="datetime-local"
                    value={row.startShift2 ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "startShift2", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="cell-input"
                    type="datetime-local"
                    value={row.endShift2 ?? ""}
                    onChange={(e) =>
                      handleCellChange(index, "endShift2", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}

            {plans.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 12 }}>
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