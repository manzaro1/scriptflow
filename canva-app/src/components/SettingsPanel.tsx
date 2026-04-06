import React, { useState } from "react";
import { testApiKey, type AIProvider } from "../utils/ai";

interface SettingsPanelProps {
  apiKey: string;
  apiProvider: AIProvider;
  onApiKeyChange: (key: string) => void;
  onProviderChange: (provider: AIProvider) => void;
}

export default function SettingsPanel({
  apiKey,
  apiProvider,
  onApiKeyChange,
  onProviderChange,
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
    const ok = await testApiKey(inputValue.trim(), apiProvider);
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
          Choose an AI provider for script generation and analysis.
        </p>
      </div>

      {/* Provider selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
          AI Provider
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onProviderChange("pollinations")}
            style={{
              ...providerBtnStyle,
              backgroundColor: apiProvider === "pollinations" ? "#7c3aed" : "#f9fafb",
              color: apiProvider === "pollinations" ? "#fff" : "#374151",
              borderColor: apiProvider === "pollinations" ? "#7c3aed" : "#d1d5db",
            }}
          >
            Pollinations
            <span style={{ fontSize: 10, opacity: 0.8, display: "block", fontWeight: 400 }}>
              Free • OpenAI model
            </span>
          </button>
          <button
            onClick={() => onProviderChange("cerebras")}
            style={{
              ...providerBtnStyle,
              backgroundColor: apiProvider === "cerebras" ? "#7c3aed" : "#f9fafb",
              color: apiProvider === "cerebras" ? "#fff" : "#374151",
              borderColor: apiProvider === "cerebras" ? "#7c3aed" : "#d1d5db",
            }}
          >
            Cerebras K2 Think
            <span style={{ fontSize: 10, opacity: 0.8, display: "block", fontWeight: 400 }}>
              Advanced reasoning model
            </span>
          </button>
        </div>
      </div>

      {apiProvider === "cerebras" ? (
        <>
          <div
            style={{
              padding: "8px 10px",
              backgroundColor: "#fefce8",
              borderRadius: 6,
              fontSize: 11,
              color: "#854d0e",
            }}
          >
            <strong>K2 Think</strong> is a powerful reasoning model by MBZUAI &amp; G42,
            running on Cerebras hardware at 2,000 tokens/sec. Requires a Cerebras API key.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
              Cerebras API Key
            </label>
            <input
              type="password"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setTestResult(null);
              }}
              placeholder="cerebras_api_key_..."
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
            <div style={successStyle}>API key is valid and working with K2 Think!</div>
          )}
          {testResult === "fail" && (
            <div style={errorStyle}>
              Invalid API key. Get one at{" "}
              <a
                href="https://api.cerebras.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#7c3aed" }}
              >
                api.cerebras.ai
              </a>
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
            <strong>Get a Cerebras API key:</strong>
            <ol style={{ margin: "4px 0 0 16px", padding: 0 }}>
              <li>
                Visit{" "}
                <a
                  href="https://api.cerebras.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#7c3aed" }}
                >
                  api.cerebras.ai
                </a>{" "}
                and sign up
              </li>
              <li>Go to API Keys and create a new key</li>
              <li>Copy and paste it here</li>
            </ol>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: "8px 10px",
            backgroundColor: "#f0fdf4",
            borderRadius: 6,
            fontSize: 11,
            color: "#166534",
          }}
        >
          Pollinations is free and works out of the box. No API key needed!
        </div>
      )}
    </div>
  );
}

const providerBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid",
  cursor: "pointer",
  textAlign: "left" as const,
  fontWeight: 600,
  fontSize: 12,
  display: "flex",
  flexDirection: "column" as const,
  gap: 2,
  transition: "all 0.15s",
};

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
