import { CALL_LOG_TPL, TEXT_TEMPLATES } from "../constants/data";
import { CBtn, PTitle } from "../components/UiBits";

export default function TemplatesView({ copiedTpl, onCopy }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
      <PTitle title="Templates" sub="Copy-ready messages - fill placeholders before sending" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: 12, marginBottom: 26 }}>
        {TEXT_TEMPLATES.map((template, index) => (
          <div
            key={index}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,.04)",
            }}
          >
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{template.label}</span>
              <CBtn id={index} copied={copiedTpl} onCopy={() => onCopy(template.body, index)} />
            </div>
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{template.body}</div>
          </div>
        ))}
      </div>

      <PTitle title="Call Log Template" sub="" />
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
          maxWidth: 540,
          boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        }}
      >
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
          <CBtn id="call-log" copied={copiedTpl} onCopy={() => onCopy(CALL_LOG_TPL, "call-log")} />
        </div>
        <pre style={{ padding: "14px 16px", fontSize: 12, color: "#64748b", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre-wrap" }}>{CALL_LOG_TPL}</pre>
      </div>
    </div>
  );
}
