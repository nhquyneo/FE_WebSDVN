// src/components/SideNav.js
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMachinesByLine } from "../api";
import "./HomePage.css"; // nếu muốn tách riêng CSS, hoặc dùng HomePage.css cũng được

const SideNav = ({ lines, onSelectMachine, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [hoveredLineId, setHoveredLineId] = useState(null);
  const [hoveredMachines, setHoveredMachines] = useState([]);

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
    setHoveredLineId(null);
    setHoveredMachines([]);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">🌿 MyApp</div>
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
              <button
                onClick={() => handleGoLine(line.idline)}
                className={`menu-btn ${isActiveLine ? "active" : ""}`}
              >
                {line.ten_line}
              </button>

              {hoveredLineId === line.idline && (
                <div className="line-dropdown">
                  <div className="line-dropdown-header">
                    {line.ten_line}
                  </div>
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

        <div className="sidebar-bottom">
          <button
            className={`menu-btn secondary-btn ${isPlan ? "active" : ""}`}
            onClick={handleGoPlan}
          >
            Kế hoạch
          </button>
          <button
            className={`menu-btn secondary-btn ${isError ? "active" : ""}`}
            onClick={handleGoError}
          >
            Thống kê lỗi
          </button>

          <button onClick={onLogout} className="logout-btn">
            🚪 Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
