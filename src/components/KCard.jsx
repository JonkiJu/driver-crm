import { DOC_LIST } from "../constants/data";
import { minutesUntil } from "../utils/date";

export default function KCard({ driver, stage, onClick, onStageChange }) {
  const mins = minutesUntil(driver);
  const over = mins !== null && mins < 0;
  const soon = mins !== null && mins >= 0 && mins <= 90;
  const docs = Object.values(driver.docs || {}).filter(Boolean).length;
  const intC =
    driver.interest === "Hot" ? "#10b981" : driver.interest === "Warm" ? "#f59e0b" : "#94a3b8";

  let naLabel = null;
  let naTimeLabel = null;
  if (driver.nextAction) {
    const dt = new Date(`${driver.nextAction}T00:00:00`);
    naLabel = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    naTimeLabel = driver.nextActionTime || null;
  }

  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        background: "#fff",
        border: `1px solid ${over ? "#fecaca" : soon ? "#fde68a" : "#e2e8f0"}`,
        borderRadius: 10,
        padding: "12px 13px",
        cursor: "pointer",
        transition: "all .15s",
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>{driver.name}</div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: intC, flexShrink: 0, marginTop: 3 }} title={driver.interest} />
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 7 }}>
        {driver.city} · CDL {driver.cdl} · {driver.exp}yr
      </div>

      {(driver.flags || []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
          {(driver.flags || []).map((flag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: 9,
                background: "#f8fafc",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              {flag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        {driver.nextAction ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: over ? "#dc2626" : soon ? "#d97706" : "#64748b", fontWeight: over || soon ? 600 : 400 }}>
              {over
                ? `Overdue ${Math.abs(Math.round(mins / 60)) < 48 ? `${Math.abs(Math.round(mins / 60))}h` : `${Math.abs(Math.round(mins / 1440))}d`}`
                : soon && mins < 60
                  ? `In ${mins} min`
                  : `Next ${naLabel}`}
            </span>
            {naTimeLabel && !over && (
              <span
                style={{
                  fontSize: 10,
                  color: soon ? "#d97706" : "#94a3b8",
                  background: soon ? "#fffbeb" : "#f8fafc",
                  padding: "1px 5px",
                  borderRadius: 3,
                  border: `1px solid ${soon ? "#fde68a" : "#e2e8f0"}`,
                }}
              >
                {naTimeLabel}
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "#d1d5db" }}>No action set</span>
        )}
        <span style={{ fontSize: 10, color: "#d1d5db" }}>{docs}/{DOC_LIST.length}</span>
      </div>
    </div>
  );
}
