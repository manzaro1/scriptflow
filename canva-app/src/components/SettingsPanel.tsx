import React, { useState } from "react";
import { testApiKey } from "../utils/ai";

interface SettingsPanelProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export default function SettingsPanel({
  apiKey,
  onApiKeyChange,
}: SettingsPanelProps) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "fail" | null>(null);

  const handleSave = () => {
    onApiKeyChange(inputValue.trim());
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!inputValue.trim()) return;
    setTesting(true);
    setTestResult(null);
    const ok = await testApiKey(inputValue.trim());
    setTestResult(ok ? "success" : "fail");
    setTesting(false);
  };

  const handleClear = () => {
    setInputValue("");
    onApiKeyChange("");
    setTestResult(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
          AI Configuration
        </h3>
        <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
          ScriptFlow uses Pollinations AI for all AI features. It works
          out of the box — no API key needed! Optionally add a key for
          higher rate limits.
        </p>
      </div>

      <div
        style={{
          padding: "8px 10px",
          backgroundColor: "#f0fdf4",
          borderRadius: 6,
          fontSize: 11,
          color: "#166534",
        }}
      >
        AI is ready to use. Free tier: works without any key.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
          Pollinations API Key (optional)
        </label>
        <input
          type="password"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setTestResult(null);
          }}
          placeholder="sk_... or pk_..."
          style={{
            fontSize: 12,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            outline: "none",
            fontFamily: "monospace",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} style={primaryBtnStyle}>
          Save Key
        </button>
        <button
          onClick={handleTest}
          disabled={testing || !inputValue.trim()}
          style={{
            ...secondaryBtnStyle,
            opacity: testing || !inputValue.trim() ? 0.5 : 1,
            cursor: testing || !inputValue.trim() ? "not-allowed" : "pointer",
          }}
        >
          {testing ? "Testing..." : "Test Key"}
        </button>
        {apiKey && (
          <button onClick={handleClear} style={dangerBtnStyle}>
            Clear
          </button>
        )}
      </div>

      {testResult === "success" && (
        <div style={successStyle}>API key is valid and working.</div>
      )}
      {testResult === "fail" && (
        <div style={errorStyle}>
          Invalid API key. Check your key and try again.
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid #f3f4f6",
          paddingTop: 12,
          fontSize: 11,
          color: "#9ca3af",
          lineHeight: 1.5,
        }}
      >
        <strong>Get a Pollinations API key (optional):</strong>
        <ol style={{ margin: "4px 0 0 16px", padding: 0 }}>
          <li>
            Visit{" "}
            <a
              href="https://pollinations.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7c3aed" }}
            >
              pollinations.ai
            </a>
          </li>
          <li>Sign up and generate an API key</li>
          <li>
            Use <code style={{ fontSize: 10 }}>sk_</code> keys for server-side
            or <code style={{ fontSize: 10 }}>pk_</code> for client-side
          </li>
        </ol>
        <p style={{ marginTop: 8 }}>
          Without a key, you get free AI with standard rate limits. A key
          unlocks higher limits and priority access.
        </p>
      </div>
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "#7c3aed",
  padding: "6px 14px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#374151",
  backgroundColor: "#f9fafb",
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
};

const dangerBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#dc2626",
  backgroundColor: "#fef2f2",
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid #fecaca",
  cursor: "pointer",
};

const successStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#166534",
  backgroundColor: "#f0fdf4",
  padding: "6px 8px",
  borderRadius: 4,
};

const errorStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#dc2626",
  backgroundColor: "#fef2f2",
  padding: "6px 8px",
  borderRadius: 4,
};
