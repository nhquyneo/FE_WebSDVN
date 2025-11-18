// src/Page/HomePage.js

import { useState, useEffect } from "react";
import { linename, getMachinesByLine } from "../api";
import "./HomePage.css";

export default function HomePage() {
  const [lines, setLines] = useState([]); // danh sách line
  const [activeLineId, setActiveLineId] = useState(null); // id line đang chọn

  const [machines, setMachines] = useState([]); // danh sách máy theo line
  const [selectedMachine, setSelectedMachine] = useState(null); // máy đang chọn trong popup
  const [isPopupOpen, setIsPopupOpen] = useState(false); // trạng thái mở/đóng popup

  // helper chuẩn hoá dữ liệu line (phòng khi backend dùng LineID / LineName)
  const normalizeLines = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      idline: row.idline ?? row.LineID,
      ten_line: row.ten_line ?? row.LineName,
    }));
  };

  // helper chuẩn hoá dữ liệu máy
  const normalizeMachines = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      id: row.id ?? row.MachineID,
      name: row.name ?? row.MachineName,
    }));
  };

  // load lines khi vào trang
  useEffect(() => {
    async function loadLines() {
      try {
        const data = await linename();
        const normalized = normalizeLines(data);
        setLines(normalized);

        if (normalized.length > 0) {
          const firstId = normalized[0].idline;
          setActiveLineId(firstId);

          // load luôn máy của line đầu tiên
          try {
            const mData = await getMachinesByLine(firstId);
            setMachines(normalizeMachines(mData));
          } catch (err) {
            console.error("Lỗi load máy line đầu tiên:", err);
            setMachines([]);
          }
        }
      } catch (err) {
        console.error("Lỗi load line:", err);
        setLines([]);
      }
    }

    loadLines();
  }, []);

  // khi chọn line ở sidebar
  const handleSelectLine = async (idline) => {
    setActiveLineId(idline);
    setSelectedMachine(null); // reset popup khi đổi line

    try {
      const mData = await getMachinesByLine(idline);
      setMachines(normalizeMachines(mData));
    } catch (err) {
      console.error("Lỗi load máy theo line:", err);
      setMachines([]);
    }
  };

  // khi click vào nút máy
  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
    setIsPopupOpen(true);
  };

  const renderContent = () => {
    const currentLine = lines.find((l) => l.idline === activeLineId);

    if (!currentLine) {
      return (
        <div className="content-box">
          <h3 className="content-title">Không có dữ liệu</h3>
        </div>
      );
    }

    return (
      <div className="content-box">
        <h3 className="content-title">{currentLine.ten_line}</h3>

        <div className="machine-list">
          {machines.map((machine) => (
            <button
              key={machine.id}
              className="machine-btn"
              onClick={() => handleSelectMachine(machine)}
            >
              {machine.id}. {machine.name}
            </button>
          ))}
        </div>

        {machines.length === 0 && (
          <p className="content-desc" style={{ marginTop: 12 }}>
            Chưa có máy nào cho line này.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">🌿 MyApp</div>

        <nav>
          {lines.map((line) => (
            <button
              key={line.idline}
              onClick={() => handleSelectLine(line.idline)}
              className={`menu-btn ${
                activeLineId === line.idline ? "active" : ""
              }`}
            >
              {line.ten_line}
            </button>
          ))}
        </nav>
      </aside>

      {/* Nội dung chính */}
      <main className="main-content">{renderContent()}</main>

      {/* Popup chi tiết máy – dùng chung */}
      <MachinePopup
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        machine={selectedMachine}
      />
    </div>
  );
}

/**
 * Popup đơn giản hiển thị thông tin máy
 * Nếu bạn đã có file riêng MachinePopup.js thì có thể xoá component này
 * và đổi lại import cho đúng đường dẫn.
 */
function MachinePopup({ open, onClose, machine }) {
  if (!open || !machine) return null;

  return (
    <div className="popup-backdrop">
      <div className="popup-card">
        <h3>Thông tin máy</h3>
        <p>
          <strong>ID:</strong> {machine.id}
        </p>
        <p>
          <strong>Tên máy:</strong> {machine.name}
        </p>

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button className="popup-close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
