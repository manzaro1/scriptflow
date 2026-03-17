import React, { useEffect } from "react";

export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TYPE_COLORS: Record<ToastMessage["type"], { bg: string; border: string; text: string }> = {
  success: { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  error: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" },
  info: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" },
};

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = TYPE_COLORS[message.type];

  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 6,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: 11,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: 260,
        wordBreak: "break-word",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <span style={{ flex: 1 }}>{message.text}</span>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: colors.text,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function Toast({ messages, onDismiss }: ToastProps) {
  if (messages.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onDismiss={() => onDismiss(msg.id)} />
      ))}
    </div>
  );
}
