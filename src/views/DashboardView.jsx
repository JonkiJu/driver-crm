import { SOURCES, STAGES } from "../constants/data";
import { todayStr, minutesUntil } from "../utils/date";
import { PTitle } from "../components/UiBits";

export default function DashboardView({ drivers }) {
  const total = drivers.length;
  const hired = drivers.filter((driver) => driver.stage === "hired").length;
  const active = drivers.filter((driver) => !["hired", "cold"].includes(driver.stage)).length;
  const cold = drivers.filter((driver) => driver.stage === "cold").length;
  const overdue = drivers.filter((driver) => {
    const mins = minutesUntil(driver);
    return mins !== null && mins < 0 && !["hired", "cold"].includes(driver.stage);
  }).length;
  const stale = drivers.filter(
    (driver) =>
      driver.lastContact &&
      (new Date(todayStr()) - new Date(driver.lastContact)) / 86400000 >= 3 &&
      !["hired", "cold"].includes(driver.stage),
  ).length;
  const hot = drivers.filter(
    (driver) => driver.interest === "Hot" && !["hired", "cold"].includes(driver.stage),
  ).length;
  const noAction = drivers.filter(
    (driver) => !driver.nextAction && !["hired", "cold"].includes(driver.stage),
  ).length;

  const kpis = [
    { label: "Total", value: total, color: "#6366f1" },
    { label: "Active", value: active, color: "#3b82f6" },
    { label: "Hired", value: hired, color: "#16a34a" },
    { label: "Hot", value: hot, color: "#059669" },
    { label: "Overdue", value: overdue, color: overdue > 0 ? "#dc2626" : "#94a3b8" },
    { label: "Stale (72h+)", value: stale, color: stale > 0 ? "#d97706" : "#94a3b8" },
    { label: "No Action", value: noAction, color: noAction > 0 ? "#f97316" : "#94a3b8" },
    { label: "Cold", value: cold, color: "#94a3b8" },
  ];

  const sourceCounts = SOURCES.reduce(
    (acc, source) => ({ ...acc, [source]: drivers.filter((driver) => driver.source === source).length }),
    {},
  );
  const maxSource = Math.max(...Object.values(sourceCounts), 1);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
      <PTitle title="Dashboard" sub="Live pipeline overview" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: 10, marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "14px 16px",
              boxShadow: "0 1px 3px rgba(0,0,0,.04)",
            }}
          >
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 500 }}>{kpi.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,.04)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>By Stage</div>
          {STAGES.map((stage) => {
            const count = drivers.filter((driver) => driver.stage === stage.id).length;
            const percent = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={stage.id}
                className="row-hover"
                style={{
                  display: "grid",
                  gridTemplateColumns: "115px 28px 1fr",
                  gap: 10,
                  alignItems: "center",
                  padding: "6px 8px",
                  borderRadius: 7,
                }}
              >
                <span style={{ fontSize: 12, color: "#374151" }}>{stage.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: stage.color, textAlign: "right" }}>{count}</span>
                <div style={{ background: "#f1f5f9", borderRadius: 4, height: 6 }}>
                  <div style={{ height: "100%", width: `${percent}%`, background: stage.color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,.04)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Lead Sources</div>
          {Object.entries(sourceCounts).map(([source, count]) => (
            <div
              key={source}
              className="row-hover"
              style={{
                display: "grid",
                gridTemplateColumns: "100px 28px 1fr",
                gap: 10,
                alignItems: "center",
                padding: "6px 8px",
                borderRadius: 7,
              }}
            >
              <span style={{ fontSize: 12, color: "#374151" }}>{source}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", textAlign: "right" }}>{count}</span>
              <div style={{ background: "#f1f5f9", borderRadius: 4, height: 6 }}>
                <div style={{ height: "100%", width: `${(count / maxSource) * 100}%`, background: "#6366f1", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
