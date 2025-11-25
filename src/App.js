// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./Page/HomePage";
import MachinePage from "./pages/Machine";
import LinePage from "./pages/LinePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tổng quan */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />

        {/* Kế hoạch */}
        <Route path="/plan" element={<HomePage />} />

        {/* Thống kê lỗi */}
        <Route path="/error" element={<HomePage />} />

        {/* Trang từng line */}
        <Route path="/line/:lineId" element={<LinePage />} />
        
        {/* 👇 Trang overview 1 máy cụ thể */}
        <Route path="/machine/:machineId" element={<MachinePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
