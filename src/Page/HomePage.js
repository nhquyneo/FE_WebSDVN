// src/Page/HomePage.js
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { linename, getMachinesByLine } from "../api";
import LinePage from "../pages/LinePage";

// page con
import OverviewPage from "../pages/Overview";
import PlanPage from "../pages/Plan";
import ErrorStatsPage from "../pages/ErrorStats";

import SideNav from "./SideNav";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lineId } = useParams();

  const [lines, setLines] = useState([]);
  const [activeLineId, setActiveLineId] = useState(null);
  const [machines, setMachines] = useState([]);

  //const [selectedMachine, setSelectedMachine] = useState(null);
  //const [isPopupOpen, setIsPopupOpen] = useState(false);

  const normalizeLines = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      idline: row.idline ?? row.LineID,
      ten_line: row.ten_line ?? row.LineName,
    }));
  };

  const normalizeMachines = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      id: row.id ?? row.MachineID,
      name: row.name ?? row.MachineName,
    }));
  };

  // Load danh sách line
  useEffect(() => {
    async function loadLines() {
      try {
        const data = await linename();
        const normalized = normalizeLines(data);
        setLines(normalized);

        // Giữ logic cũ: auto load máy line đầu tiên (dù chưa chuyển route)
        if (normalized.length > 0 && !lineId) {
          const firstId = normalized[0].idline;
          setActiveLineId(firstId);
          try {
            const mData = await getMachinesByLine(firstId);
            setMachines(normalizeMachines(mData));
          } catch (err) {
            console.error("Lỗi tải máy:", err);
          }
        }
      } catch (err) {
        console.error("Lỗi tải line:", err);
      }
    }

    loadLines();
  }, [lineId]);

  // Khi route /line/:lineId đổi → load máy cho line đó
  useEffect(() => {
    if (!lineId) {
      setActiveLineId(null);
      return;
    }

    const idNum = Number(lineId);
    if (!idNum) return;

    setActiveLineId(idNum);

    async function loadMachines() {
      try {
        const mData = await getMachinesByLine(idNum);
        setMachines(normalizeMachines(mData));
      } catch (err) {
        console.error("Lỗi tải máy theo line:", err);
        setMachines([]);
      }
    }

    loadMachines();
  }, [lineId]);

  const handleSelectMachine = (machine) => {
    //setSelectedMachine(machine);
    //setIsPopupOpen(true);
    navigate(`/machine/${machine.id}`, {
      state: { machine }, // truyền thêm thông tin để MachinePage dùng luôn
    });
  };

  // Render nội dung chính theo route
  const renderMainContent = () => {
    if (location.pathname.startsWith("/plan")) return <PlanPage />;
    if (location.pathname.startsWith("/error")) return <ErrorStatsPage />;
    if (location.pathname.startsWith("/line/")) return renderLinePage();

    // Mặc định: Tổng quan
    return <OverviewPage />;
  };

  const renderLinePage = () => {
    const line = lines.find((l) => l.idline === activeLineId);

    if (!line)
      return (
        <div className="content-box">
          <h3 className="content-title">Không có dữ liệu Line</h3>
        </div>
      );

    return (
      <div className="content-box">
        <h3 className="content-title">{line.ten_line}</h3>

        <div className="machine-list">
          {machines.map((m) => (
            <button
              key={m.id}
              className="machine-btn"
              onClick={() => handleSelectMachine(m)}
            >
              {m.id}. {m.name}
            </button>
          ))}
        </div>

        {machines.length === 0 && (
          <p className="content-desc">Chưa có máy nào cho line này.</p>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      {/* SIDENAV tách riêng */}
      <SideNav
        lines={lines}
        onSelectMachine={handleSelectMachine}
      />

      {/* MAIN CONTENT */}
      <main className="main">
        {/* <div className="user-strip">
          <span className="user-strip-text">{userName}</span>
        </div> */}

        <div className="content-container">{renderMainContent()}</div>
      </main>

    </div>
  );
}
