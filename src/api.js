const API_BASE = "http://127.0.0.1:5000"; // hoặc http://10.73.132.85:5000 nếu gọi qua mạng LAN

  // --- (tuỳ chọn) Lấy thông tin user ---
 
export async function linename() {
  const res = await fetch(`${API_BASE}/api/lines`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  console.log("linename() trả về:", data); // <-- Ở ĐÂY KHÔNG ĐƯỢC undefined
  return data; // data là MẢNG
}
export async function getMachinesByLine(idline) {
  const res = await fetch(`${API_BASE}/api/lines/${idline}/machines`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();   // trả về mảng máy
}
export async function fetchMachineDay(machineId, day) {
  const url = `${API_BASE}/api/machines/${machineId}/day?day=${encodeURIComponent(
    day
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  return data; // { machine_id, day, power_run, day_value, pie, details } như BE trả
}
export async function fetchMachineMonthRatio(machineId, month, dataType) {
  const params = new URLSearchParams();
  params.set("month", month);
  if (dataType) {
    params.set("data", dataType); // 'OEE RATIO' / 'OK PRODUCT RATIO' / ...
  }

  const url = `${API_BASE}/api/machines/${machineId}/month-ratio?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  return data; // { machine_id, month, data_type, days: [...] }
}
export async function fetchMachineMonth(machineId, month) {
  const url = `${API_BASE}/api/machines/${machineId}/month?month=${month}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  return data; // { days: [ { day, categories: { ... } } ], monthly_totals: ... }
}
export async function fetchMachineYearRatio(machineId, year, dataType) {
  const params = new URLSearchParams();
  params.set("year", year);
  if (dataType) {
    params.set("data", dataType); // 'OEE RATIO' / 'OK PRODUCT RATIO' / ...
  }

  const url = `${API_BASE}/api/machines/${machineId}/year-ratio?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  return data; // { machine_id, month, data_type, days: [...] }
}
export async function fetchMachineYear(machineId, year) {
  const url = `${API_BASE}/api/machines/${machineId}/year?year=${year}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  return data; // { days: [ { day, categories: { ... } } ], monthly_totals: ... }
}