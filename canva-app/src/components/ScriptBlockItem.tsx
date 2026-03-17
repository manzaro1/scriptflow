import React, { useRef, useEffect } from "react";
import type { ElementType, ScriptBlock } from "../types";
import { shouldUpperCase } from "../utils/script-helpers";

const TYPE_LABELS: Record<ElementType, string> = {
  slugline: "SCN",
  action: "ACT",
  character: "CHAR",
  dialogue: "DLG",
  parenthetical: "PAR",
  transition: "TRNS",
};

const TYPE_COLORS: Record<ElementType, string> = {
  slugline: "#d97706",
  action: "#6b7280",
  character: "#7c3aed",
  dialogue: "#2563eb",
  parenthetical: "#a78bfa",
  transition: "#f59e0b",
};

const TYPE_STYLES: Record<ElementType, React.CSSProperties> = {
  slugline: { textTransform: "uppercase", fontWeight: 700 },
  action: {},
  character: { textTransform: "uppercase", fontWeight: 700, textAlign: "center" },
  dialogue: { paddingLeft: 24, paddingRight: 16 },
  parenthetical: { fontStyle: "italic", paddingLeft: 32, paddingRight: 32 },
  transition: { textTransform: "uppercase", fontWeight: 700, textAlign: "right" },
};

interface ScriptBlockItemProps {
  block: ScriptBlock;
  index: number;
  isFocused: boolean;
  onFocus: (index: number) => void;
  onBlur: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  onInput: () => void;
  blockRef: (el: HTMLDivElement | null) => void;
}

export default function ScriptBlockItem({
  block,
  index,
  isFocused,
  onFocus,
  onBlur,
  onKeyDown,
  onInput,
  blockRef,
}: ScriptBlockItemProps) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (innerRef.current && !initialized.current) {
      innerRef.current.innerText = block.content;
      initialized.current = true;
    }
  }, [block.content]);

  // Update content when block type changes (uppercase enforcement)
  useEffect(() => {
    if (innerRef.current && shouldUpperCase(block.type)) {
      const text = innerRef.current.innerText;
      if (text !== text.toUpperCase()) {
        innerRef.current.innerText = text.toUpperCase();
      }
    }
  }, [block.type]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
        padding: "2px 0",
        borderLeft: isFocused ? `2px solid ${TYPE_COLORS[block.type]}` : "2px solid transparent",
        paddingLeft: 4,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          color: TYPE_COLORS[block.type],
          backgroundColor: `${TYPE_COLORS[block.type]}18`,
          padding: "2px 4px",
          borderRadius: 3,
          minWidth: 30,
          textAlign: "center",
          flexShrink: 0,
          marginTop: 2,
          userSelect: "none",
        }}
      >
        {TYPE_LABELS[block.type]}
      </span>
      <div
        ref={(el) => {
          innerRef.current = el;
          blockRef(el);
        }}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onFocus={() => onFocus(index)}
        onBlur={() => onBlur(index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        onInput={onInput}
        data-placeholder={`${block.type}...`}
        style={{
          flex: 1,
          fontFamily: "'Courier Prime', 'Courier New', monospace",
          fontSize: 12,
          lineHeight: 1.5,
          outline: "none",
          minHeight: 20,
          padding: "1px 4px",
          borderRadius: 2,
          backgroundColor: isFocused ? "#f8f9fa" : "transparent",
          ...TYPE_STYLES[block.type],
        }}
      />
    </div>
  );
}
