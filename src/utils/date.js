export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function getTodayPlus(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().split("T")[0];
}

export function nextActionTs(driver) {
  if (!driver.nextAction) return Infinity;
  const time = driver.nextActionTime || "23:59";
  return new Date(`${driver.nextAction}T${time}`).getTime();
}

export function minutesUntil(driver) {
  if (!driver.nextAction) return null;
  const time = driver.nextActionTime || "23:59";
  return Math.round((new Date(`${driver.nextAction}T${time}`) - Date.now()) / 60000);
}

export function fmtDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
