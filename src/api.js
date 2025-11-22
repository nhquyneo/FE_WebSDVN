const API_BASE = "http://127.0.0.1:5000"; // hoặc http://10.73.132.85:5000 nếu gọi qua mạng LAN

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  return data;
}
export async function register(username, password, full_name) {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, full_name }),
    });
  
    const data = await res.json();
    return data;
  }
  
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
export async function getLineKpi(lineName, month, year, data) {
  const params = new URLSearchParams({
    line: lineName,
    month: String(month),
    year: String(year),
    data: data || "all",   // 👈 GỬI LUÔN DATA XUỐNG (all/oee/ok/output/activity)
  });

  const res = await fetch(`${API_BASE}/api/line-kpi?` + params.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`KPI API error: ${res.status}`);
  }

  // [{ LineName, day, oee, ok, output, activity, data_type }]
  return res.json();
}
export async function getDayPlans(idline, idmachine, date) {
  const params = new URLSearchParams();
  params.append("idline", idline);
  if (idmachine) params.append("idmachine", idmachine);
  if (date) params.append("date", date);

  const res = await fetch(`${API_BASE}/api/day-plans?` + params.toString());
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json(); // mảng các dòng như screenshot
}

export async function updateAllDayPlans(planList) {
  const res = await fetch(`${API_BASE}/api/day-plans/bulk-update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(planList),   // chú ý: KHÔNG JSON.stringify 2 lần
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}
export async function getMonthPlans(idline, idmachine, year, month) {
  const params = new URLSearchParams();
  params.append("idline", idline);
  if (idmachine) params.append("idmachine", idmachine);
  params.append("year", year);
  params.append("month", month);

  const res = await fetch(`${API_BASE}/api/month-plans?` + params.toString());
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function updateAllMonthPlans(planList) {
  const res = await fetch(`${API_BASE}/api/month-plans/bulk-update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(planList),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}