import React from "react";
import { FEATURES } from "../utils/pricing";

interface UpgradePromptProps {
  featureId: string;
  onUpgrade: () => void;
}

export default function UpgradePrompt({ featureId, onUpgrade }: UpgradePromptProps) {
  const feature = FEATURES.find((f) => f.id === featureId);
  const label = feature?.label || "This feature";

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>PRO</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", lineHeight: 1.5 }}>
        Unlock {label.toLowerCase()} and all premium features with ScriptFlow Pro.
      </div>
      <div style={featureListStyle}>
        {FEATURES.filter((f) => f.tier === "pro").map((f) => (
          <div key={f.id} style={featureItemStyle}>
            <span style={{ color: "#7c3aed" }}>&#10003;</span> {f.label}
          </div>
        ))}
      </div>
      <button onClick={onUpgrade} style={upgradeButtonStyle}>
        Upgrade to Pro
      </button>
      <div style={{ fontSize: 10, color: "#9ca3af" }}>
        One-time purchase via Canva
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  padding: "32px 24px",
  textAlign: "center",
};

const iconStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#fff",
  backgroundColor: "#7c3aed",
  padding: "4px 10px",
  borderRadius: 20,
  letterSpacing: 1,
};

const featureListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "flex-start",
  width: "100%",
  maxWidth: 220,
};

const featureItemStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#374151",
  display: "flex",
  gap: 6,
  alignItems: "center",
};

const upgradeButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#fff",
  backgroundColor: "#7c3aed",
  padding: "10px 24px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  marginTop: 4,
};
