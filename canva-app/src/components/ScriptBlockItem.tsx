import React, { useRef, useEffect } from "react";
import type { ScriptBlock, ScriptMode } from "../types";
import { getModeConfig } from "../utils/mode-config";

interface ScriptBlockItemProps {
  block: ScriptBlock;
  index: number;
  isFocused: boolean;
  mode?: ScriptMode;
  searchTerm?: string;
  highlightedBlockId?: string | null;
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
  mode = "screenplay",
  searchTerm,
  highlightedBlockId,
  onFocus,
  onBlur,
  onKeyDown,
  onInput,
  blockRef,
}: ScriptBlockItemProps) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);
  const config = getModeConfig(mode);

  const typeColor = config.typeColors[block.type] || "#6b7280";
  const typeLabel = config.typeLabels[block.type] || block.type.substring(0, 4).toUpperCase();
  const typeStyle = config.typeStyles[block.type] || {};

  useEffect(() => {
    if (innerRef.current && !initialized.current) {
      innerRef.current.innerText = block.content;
      initialized.current = true;
    }
  }, [block.content]);

  // Update content when block type changes (uppercase enforcement)
  useEffect(() => {
    if (innerRef.current && config.shouldUpperCase(block.type)) {
      const text = innerRef.current.innerText;
      if (text !== text.toUpperCase()) {
        innerRef.current.innerText = text.toUpperCase();
      }
    }
  }, [block.type, config]);

  // Search highlight
  const isSearchMatch =
    searchTerm && block.content.toLowerCase().includes(searchTerm.toLowerCase());
  const isCurrentHighlight = highlightedBlockId === block.id;

  let bgColor = isFocused ? "#f8f9fa" : "transparent";
  if (isCurrentHighlight) bgColor = "#fde68a";
  else if (isSearchMatch) bgColor = "#fef3c7";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
        padding: "2px 0",
        borderLeft: isFocused
          ? `2px solid ${typeColor}`
          : "2px solid transparent",
        paddingLeft: 4,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          color: typeColor,
          backgroundColor: `${typeColor}18`,
          padding: "2px 4px",
          borderRadius: 3,
          minWidth: 30,
          textAlign: "center",
          flexShrink: 0,
          marginTop: 2,
          userSelect: "none",
        }}
      >
        {typeLabel}
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
          backgroundColor: bgColor,
          ...typeStyle,
        }}
      />
    </div>
  );
}
