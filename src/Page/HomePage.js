import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../auth";
import { linename, getMachinesByLine } from "../api"; // nhớ thêm getMachinesByLine trong api.js
import MachinePopup from "../components/MachinePopup";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const user = auth.user || {};

  const [lines, setLines] = useState([]);          // danh sách line
  const [activeLineId, setActiveLineId] = useState(null); // id line đang chọn

  const [machines, setMachines] = useState([]);    // danh sách máy theo line
  const [selectedMachine, setSelectedMachine] = useState(null); // máy đang chọn trong popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);        // trạng thái mở/đóng popup

  const logout = () => {
    auth.isAuthed = false;
    auth.user = null;
    navigate("/", { replace: true });
  };

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

        {/* <p className="content-desc">ID Line: {currentLine.idline}</p> */}

        {/* Danh sách máy: 4 nút trên 1 dòng, nút to */}
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

        {/* Nút đăng xuất giữ nguyên ở cuối sidebar */}
        <button onClick={logout} className="logout-btn">
          🚪 Đăng xuất
        </button>
      </aside>

      {/* Bên phải */}
      <main className="main">
        {/* Thẻ full_name sát bên phải */}
        <div className="user-strip">
          <span className="user-strip-text">
            {user.full_name || "Người dùng"}
          </span>
        </div>

        <div className="content-container">{renderContent()}</div>
      </main>

      {/* Popup chi tiết máy – dùng chung */}
      <MachinePopup
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        machine={selectedMachine}
      />
    </div>
  );
}