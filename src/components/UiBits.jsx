export function SPill({ n, l, c, bg }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: bg,
        border: `1px solid ${c}33`,
        borderRadius: 20,
        padding: "3px 10px",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{n}</span>
      <span style={{ fontSize: 11, color: c, opacity: 0.8 }}>{l}</span>
    </div>
  );
}

export function Btn({ label, onClick, primary }) {
  return (
    <button
      className={primary ? "btn-p" : "btn-g"}
      onClick={onClick}
      style={{
        background: primary ? "#2563eb" : "#f8fafc",
        border: `1px solid ${primary ? "#2563eb" : "#e2e8f0"}`,
        color: primary ? "#fff" : "#374151",
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: primary ? 600 : 400,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );
}

export function FL({ t }) {
  return <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>{t}</div>;
}

export function PTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function CBtn({ id, copied, onCopy }) {
  return (
    <button
      onClick={onCopy}
      style={{
        background: copied === id ? "#ecfdf5" : "#eff6ff",
        border: `1px solid ${copied === id ? "#6ee7b7" : "#bfdbfe"}`,
        color: copied === id ? "#059669" : "#2563eb",
        padding: "4px 12px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {copied === id ? "Copied" : "Copy"}
    </button>
  );
}
