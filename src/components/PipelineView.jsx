import KCard from "./KCard";

export default function PipelineView({ stages, filteredDrivers, onSelectDriver, onStageChange }) {
  return (
    <div
      style={{
        flex: 1,
        overflowX: "auto",
        overflowY: "hidden",
        padding: "16px 20px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      {stages.map((stage) => {
        const cards = filteredDrivers.filter((driver) => driver.stage === stage.id);
        return (
          <div
            key={stage.id}
            style={{ minWidth: 218, maxWidth: 218, display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{stage.label}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  background: stage.light,
                  color: stage.color,
                  borderRadius: 20,
                  padding: "1px 8px",
                  fontWeight: 700,
                }}
              >
                {cards.length}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                overflowY: "auto",
                maxHeight: "calc(100vh - 162px)",
                paddingBottom: 6,
              }}
            >
              {cards.map((driver) => (
                <KCard
                  key={driver.id}
                  driver={driver}
                  stage={stage}
                  onClick={() => onSelectDriver(driver.id)}
                  onStageChange={onStageChange}
                />
              ))}
              {cards.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "18px 0",
                    fontSize: 12,
                    color: "#cbd5e1",
                    border: "1px dashed #e2e8f0",
                    borderRadius: 9,
                    background: "#fafafa",
                  }}
                >
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
