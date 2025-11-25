// src/components/SideNav.js
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMachinesByLine } from "../api";
import "./HomePage.css";
import Logo from "./VCC Tech.png";

const SideNav = ({ lines, onSelectMachine, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [hoveredLineId, setHoveredLineId] = useState(null);
  const [hoveredMachines, setHoveredMachines] = useState([]);

  // dùng ref để giữ id của timeout
  const hideTimeoutRef = useRef(null);

  // active theo URL
  const isOverview =
    location.pathname === "/" || location.pathname === "/home";
  const isPlan = location.pathname.startsWith("/plan");
  const isError = location.pathname.startsWith("/error");

  const normalizeMachines = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      id: row.id ?? row.MachineID,
      name: row.name ?? row.MachineName,
    }));
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoPlan = () => {
    navigate("/plan");
  };

  const handleGoError = () => {
    navigate("/error");
  };

  const handleGoLine = (idline) => {
    navigate(`/line/${idline}`);
  };

  const handleLineMouseEnter = async (idline) => {
    // nếu đang có timeout ẩn thì hủy
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    setHoveredLineId(idline);
    try {
      const mData = await getMachinesByLine(idline);
      setHoveredMachines(normalizeMachines(mData));
    } catch (err) {
      console.error("Lỗi load máy (hover) theo line:", err);
      setHoveredMachines([]);
    }
  };

  const handleLineMouseLeave = () => {
    // không ẩn ngay, đợi 180ms
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredLineId(null);
      setHoveredMachines([]);
    }, 180);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src={Logo} alt="VCC Tech" style={{ height: "45px" }} />
        </div>
      </div>

      <div className="sidebar-menu">
        {/* Home */}
        <button
          className={`menu-btn home-btn ${isOverview ? "active" : ""}`}
          onClick={handleGoHome}
        >
          Home
        </button>

        {/* Danh sách Line */}
        {lines.map((line) => {
          const isActiveLine = location.pathname === `/line/${line.idline}`;
          return (
            <div
              key={line.idline}
              className="line-nav-item"
              onMouseEnter={() => handleLineMouseEnter(line.idline)}
              onMouseLeave={handleLineMouseLeave}
            >
              {/* <button
                onClick={() => handleGoLine(line.idline)}
                className={`menu-btn ${isActiveLine ? "active" : ""}`}
              >
                {line.ten_line}
              </button> */}
              {/* ====== CLICK → HIỂN THỊ LinePage ====== */}
              <button
                className={`menu-btn ${isActiveLine ? "active" : ""}`}
                onClick={() => navigate(`/line/${line.idline}`, { state: { line } })}
              >
                {line.ten_line}
              </button>

              {hoveredLineId === line.idline && (
                <div
                  className="line-dropdown"
                  // di chuột trong dropdown vẫn tính là Enter/Leave cùng 1 item
                  onMouseEnter={() => handleLineMouseEnter(line.idline)}
                  onMouseLeave={handleLineMouseLeave}
                >
                  <div className="line-dropdown-header">{line.ten_line}</div>
                  <ul className="line-machine-list">
                    {hoveredMachines.length === 0 ? (
                      <li className="line-machine-empty">
                        Chưa có máy cho line này.
                      </li>
                    ) : (
                      hoveredMachines.map((machine) => (
                        <li key={machine.id}>
                          <button
                            className="line-machine-btn"
                            onClick={() => onSelectMachine(machine)}
                          >
                            {machine.name}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
          
        })}
          <button
            className={`menu-btn home-btn ${isPlan ? "active" : ""}`}
            onClick={handleGoPlan}
          >
            Plan
          </button>
          <button
            className={`menu-btn home-btn ${isError ? "active" : ""}`}
            onClick={handleGoError}
          >
            Trouble
          </button>
      </div>
    </aside>
  );
};

export default SideNav;
